import { useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  AccessConditions,
  DownloadTrackAvailabilityType,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { Nullable } from '@audius/common/utils'
import {
  Box,
  Flex,
  IconUserFollowing,
  IconVisibilityPublic,
  IconCart,
  Text,
  TextLink,
  IconError,
  useTheme,
  SegmentedControl,
  Option,
  IconStars
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { MenuFormCallbackStatus } from 'components/data-entry/ContextualMenu'
import { Divider } from 'components/divider'
import { HelpCallout } from 'components/help-callout/HelpCallout'
import { useTrackField } from 'pages/upload-page/hooks'

import { STREAM_CONDITIONS } from '../types'

import { DownloadPriceField } from './DownloadPriceField'

const WAITLIST_TYPEFORM = 'https://link.audius.co/waitlist'

const messages = {
  downloadAvailability: 'Download Availability',
  customize: 'Customize who has access to download your files.',
  public: 'Public',
  followers: 'Followers',
  premium: 'Premium',
  callout: {
    premium:
      "You're uploading a Premium track. By default, purchasers will be able to download your available files. If you'd like to only sell your files, set your track to Public or Hidden in the",
    specialAccess:
      "You're uploading a Special Access track. By default, users who unlock your track will be able to download your available files. If you'd like to only sell your files, set your track to Public or Hidden in the",
    collectibleGated:
      "You're uploading a Collectible Gated track. By default, users who unlock your track will be able to download your available files. If you'd like to only sell your files, set your track to Public or Hidden in the",
    accessAndSale: 'Access & Sale Settings'
  },
  waitlist:
    'Start selling your music on Audius today! Limited access beta now available.',
  join: 'Join the Waitlist'
}

type DownloadAvailabilityProps = {
  isUpload: boolean
  initialDownloadConditions: Nullable<AccessConditions>
  value: DownloadTrackAvailabilityType
  setValue: (value: DownloadTrackAvailabilityType) => void
}

export const DownloadAvailability = ({
  isUpload,
  initialDownloadConditions,
  value,
  setValue
}: DownloadAvailabilityProps) => {
  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )
  const {
    color: {
      primary,
      neutral: { neutral, n400: subdued }
    }
  } = useTheme()
  const { submitForm, setStatus } = useFormikContext()
  const [{ value: streamConditions }] =
    useTrackField<Nullable<AccessConditions>>(STREAM_CONDITIONS)
  const isUsdcGated = isContentUSDCPurchaseGated(streamConditions)
  const isSpecialAccess =
    isContentFollowGated(streamConditions) ||
    isContentTipGated(streamConditions)
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const shouldRenderCallout =
    isUsdcGated || isSpecialAccess || isCollectibleGated

  const getCalloutMessage = useCallback(() => {
    if (isUsdcGated) {
      return messages.callout.premium
    }
    if (isSpecialAccess) {
      return messages.callout.specialAccess
    }
    if (isCollectibleGated) {
      return messages.callout.collectibleGated
    }
    return ''
  }, [isCollectibleGated, isSpecialAccess, isUsdcGated])

  const handleCalloutClick = useCallback(() => {
    setStatus(MenuFormCallbackStatus.OPEN_ACCESS_AND_SALE)
    submitForm()
  }, [setStatus, submitForm])

  const isFollowersOptionDisabled =
    !isUpload && !isContentFollowGated(initialDownloadConditions)
  const isPremiumOptionDisabled =
    !isUpload && !isContentUSDCPurchaseGated(initialDownloadConditions)
  const options: Option<DownloadTrackAvailabilityType>[] = [
    {
      key: DownloadTrackAvailabilityType.PUBLIC,
      text: messages.public,
      icon: <IconVisibilityPublic size='s' fill={neutral} />
    },
    {
      key: DownloadTrackAvailabilityType.FOLLOWERS,
      text: messages.followers,
      icon: (
        <IconUserFollowing
          size='s'
          fill={isFollowersOptionDisabled ? subdued : neutral}
        />
      ),
      disabled: isFollowersOptionDisabled
    },
    {
      key: DownloadTrackAvailabilityType.USDC_PURCHASE,
      text: messages.premium,
      icon: (
        <IconCart
          size='s'
          fill={
            isPremiumOptionDisabled || !isUsdcUploadEnabled ? subdued : neutral
          }
        />
      ),
      disabled: isPremiumOptionDisabled,
      variant:
        isPremiumOptionDisabled || !isUsdcUploadEnabled ? 'subdued' : 'default'
    }
  ]

  const handleOptionSelect = useCallback(
    (option: DownloadTrackAvailabilityType) => {
      setValue(option)
    },
    [setValue]
  )

  const textCss = shouldRenderCallout
    ? {
        opacity: 0.5
      }
    : {}

  const renderPremiumDownloadsContent = () => {
    return isUsdcUploadEnabled ? (
      <DownloadPriceField disabled={false} />
    ) : (
      <HelpCallout
        icon={<IconStars />}
        content={
          <Flex direction='column' gap='m'>
            <Text>{messages.waitlist}</Text>
            <TextLink
              href={WAITLIST_TYPEFORM}
              css={{ color: primary.p500, width: 'fit-content' }}
              showUnderline
              isExternal
            >
              {messages.join}
            </TextLink>
          </Flex>
        }
      />
    )
  }

  return (
    <>
      <Flex direction='column'>
        <Text variant='title' size='l' css={textCss}>
          {messages.downloadAvailability}
        </Text>
        <Box mt='s'>
          <Text variant='body' css={textCss}>
            {messages.customize}
          </Text>
        </Box>
      </Flex>
      {shouldRenderCallout ? (
        <HelpCallout
          icon={<IconError css={{ alignSelf: 'center' }} />}
          content={
            <Text>
              {getCalloutMessage()}
              &nbsp;
              <TextLink
                onClick={handleCalloutClick}
                css={{ color: primary.p500 }}
              >
                {messages.callout.accessAndSale}
              </TextLink>
              .
            </Text>
          }
        />
      ) : (
        <>
          <SegmentedControl
            onSelectOption={handleOptionSelect}
            selected={value}
            options={options}
            // Matches 0.18s entry animation
            forceRefreshAfterMs={180}
          />
          {value === DownloadTrackAvailabilityType.USDC_PURCHASE
            ? renderPremiumDownloadsContent()
            : null}
        </>
      )}
      <Divider />
    </>
  )
}
