import { useCallback } from 'react'

import {
  AccessConditions,
  DownloadTrackAvailabilityType,
  Nullable,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '@audius/common'
import {
  Box,
  Flex,
  IconUserFollowing,
  IconVisibilityPublic,
  IconCart,
  Text,
  TextLink,
  IconError
} from '@audius/harmony'
import { SegmentedControl } from '@audius/stems'
import { useFormikContext } from 'formik'

import { MenuFormCallbackStatus } from 'components/data-entry/ContextualMenu'
import { Divider } from 'components/divider'
import { HelpCallout } from 'components/help-callout/HelpCallout'
import { useTrackField } from 'pages/upload-page/hooks'

import { STREAM_CONDITIONS } from '../AccessAndSaleField'

import { DownloadPriceField } from './DownloadPriceField'

const messages = {
  downloadAvailability: 'Download Availability',
  customize: 'Customize who has access to download your files.',
  public: 'Public',
  followers: 'Followers',
  premium: 'Premium',
  callout: {
    premium:
      "You're uploading a Premium track. By default, purchasers will be able to download your available files. If you'd like to sell your files, set your track to Public or Hidden in the",
    specialAccess:
      "You're uploading a Special Access track. By default, users who unlock your track will be able to download your available files. If you'd like to sell your files, set your track to Public or Hidden in the",
    collectibleGated:
      "You're uploading a Collectible Gated track. By default, users who unlock your track will be able to download your available files. If you'd like to sell your files, set your track to Public or Hidden in the",
    accessAndSale: 'Access & Sale Settings'
  }
}

type DownloadAvailabilityProps = {
  value: DownloadTrackAvailabilityType
  setValue: (value: DownloadTrackAvailabilityType) => void
}

export const DownloadAvailability = ({
  value,
  setValue
}: DownloadAvailabilityProps) => {
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

  const options = [
    {
      key: DownloadTrackAvailabilityType.PUBLIC,
      text: messages.public,
      icon: <IconVisibilityPublic size='s' fill='#858199' />
    },
    {
      key: DownloadTrackAvailabilityType.FOLLOWERS,
      text: messages.followers,
      icon: <IconUserFollowing size='s' fill='#858199' />
    },
    {
      key: DownloadTrackAvailabilityType.USDC_PURCHASE,
      text: messages.premium,
      icon: <IconCart size='s' fill='#858199' />
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
              <TextLink onClick={handleCalloutClick} css={{ color: '#a30cb3' }}>
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
          {value === DownloadTrackAvailabilityType.USDC_PURCHASE ? (
            <DownloadPriceField disabled={false} />
          ) : null}
        </>
      )}
      <Divider />
    </>
  )
}
