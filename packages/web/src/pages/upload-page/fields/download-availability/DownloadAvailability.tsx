import { useCallback } from 'react'

import { DownloadTrackAvailabilityType } from '@audius/common'
import {
  Box,
  Flex,
  IconUserFollowing,
  IconVisibilityPublic,
  IconCart,
  Text
} from '@audius/harmony'
import { SegmentedControl } from '@audius/stems'

import { Divider } from 'components/divider'

import { DownloadPriceField } from './DownloadPriceField'

const messages = {
  downloadAvailability: 'Download Availability',
  customize: 'Customize who has access to download your files.',
  public: 'Public',
  followers: 'Followers',
  premium: 'Premium'
}

type DownloadAvailabilityProps = {
  value: DownloadTrackAvailabilityType
  setValue: (value: DownloadTrackAvailabilityType) => void
}

export const DownloadAvailability = ({
  value,
  setValue
}: DownloadAvailabilityProps) => {
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

  return (
    <>
      <Flex direction='column'>
        <Text variant='title' size='l'>
          {messages.downloadAvailability}
        </Text>
        <Box mt='s'>
          <Text variant='body'>{messages.customize}</Text>
        </Box>
      </Flex>
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
      <Divider />
    </>
  )
}
