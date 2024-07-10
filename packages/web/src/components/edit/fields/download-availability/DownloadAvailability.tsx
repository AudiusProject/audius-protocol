import { useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  AccessConditions,
  DownloadTrackAvailabilityType,
  Name,
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
  SegmentedControl,
  Option,
  IconStars,
  Hint
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { MenuFormCallbackStatus } from 'components/data-entry/ContextualMenu'
import { Divider } from 'components/divider'
import { useTrackField } from 'components/edit-track/hooks'
import { make, track } from 'services/analytics'

import { STREAM_CONDITIONS } from '../types'

import { DownloadPriceField } from './DownloadPriceField'

const WAITLIST_TYPEFORM = 'https://link.audius.co/waitlist'

const getMessages = (props: DownloadAvailabilityProps) => ({
  downloadAvailability: 'Download Availability',
  customize: 'Specify who has access to download your files.',
  public: 'Public',
  followers: 'Followers',
  premium: 'Premium',
  callout: {
    premium: `You're ${
      props.isUpload ? 'uploading' : 'editing'
    } a Premium track. By default, purchasers will be able to download your available files. If you'd like to sell your files, set your track to Public or Hidden in the`,
    specialAccess: `You're ${
      props.isUpload ? 'uploading' : 'editing'
    } a Special Access track. By default, users who unlock your track will be able to download your available files. If you'd like to sell your files, set your track to Public or Hidden in the`,
    collectibleGated: `You're ${
      props.isUpload ? 'uploading' : 'editing'
    } a Collectible Gated track. By default, users who unlock your track will be able to download your available files. If you'd like to sell your files, set your track to Public or Hidden in the`,
    priceAndAudience: 'Price & Audience Settings'
  },
  waitlist:
    'Start selling your music on Audius today! Limited access beta now available.',
  join: 'Join the Waitlist'
})

type DownloadAvailabilityProps = {
  isUpload: boolean
  initialDownloadConditions: Nullable<AccessConditions>
  value: DownloadTrackAvailabilityType
  setValue: (value: DownloadTrackAvailabilityType) => void
}

export const DownloadAvailability = (props: DownloadAvailabilityProps) => {
  const { isUpload, initialDownloadConditions, value, setValue } = props
  const messages = getMessages(props)
  const { isEnabled: isUsdcUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES_UPLOAD
  )
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
  }, [
    isCollectibleGated,
    isSpecialAccess,
    isUsdcGated,
    messages.callout.premium,
    messages.callout.specialAccess,
    messages.callout.collectibleGated
  ])

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
      icon: <IconVisibilityPublic size='s' color='default' />
    },
    {
      key: DownloadTrackAvailabilityType.FOLLOWERS,
      text: messages.followers,
      icon: (
        <IconUserFollowing
          size='s'
          color={isFollowersOptionDisabled ? 'subdued' : 'default'}
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
          color={
            isPremiumOptionDisabled || !isUsdcUploadEnabled
              ? 'subdued'
              : 'default'
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

  const handleClickWaitListLink = useCallback(() => {
    track(
      make({ eventName: Name.TRACK_UPLOAD_CLICK_USDC_DOWNLOAD_WAITLIST_LINK })
    )
  }, [])

  const textCss = shouldRenderCallout
    ? {
        opacity: 0.5
      }
    : {}

  const renderPremiumDownloadsContent = () => {
    return isUsdcUploadEnabled ? (
      <DownloadPriceField disabled={false} />
    ) : (
      <Hint
        icon={IconStars}
        actions={
          <TextLink
            onClick={handleClickWaitListLink}
            href={WAITLIST_TYPEFORM}
            variant='visible'
            isExternal
          >
            {messages.join}
          </TextLink>
        }
      >
        {messages.waitlist}
      </Hint>
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
        <Hint
          icon={IconError}
          actions={
            <TextLink onClick={handleCalloutClick} variant='visible'>
              {messages.callout.priceAndAudience}
            </TextLink>
          }
        >
          {getCalloutMessage()}
        </Hint>
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
