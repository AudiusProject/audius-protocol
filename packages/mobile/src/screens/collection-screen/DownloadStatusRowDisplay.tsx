import { Flex, Text } from '@audius/harmony-native'
import { Switch } from 'app/components/core'
import { DownloadStatusIndicator } from 'app/components/offline-downloads/DownloadStatusIndicator'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

const messages = {
  available: 'Available Offline',
  offlinePlayback: 'Offline Playback',
  queued: 'Download Queued',
  downloading: 'Sync in Progress'
}

type DownloadStatusRowDisplayProps = {
  downloadStatus: OfflineDownloadStatus
  isAvailableForDownload: boolean
  switchValue?: boolean
  handleSwitchChange?: (value: boolean) => void
  disabled?: boolean
  isReadOnly?: boolean
}

export const DownloadStatusRowDisplay = (
  props: DownloadStatusRowDisplayProps
) => {
  const {
    downloadStatus,
    isAvailableForDownload,
    switchValue,
    handleSwitchChange,
    disabled,
    isReadOnly
  } = props

  const getMessage = () => {
    switch (downloadStatus) {
      case OfflineDownloadStatus.LOADING:
        return messages.downloading
      case OfflineDownloadStatus.SUCCESS:
        return messages.available
      case OfflineDownloadStatus.INIT:
        return messages.offlinePlayback
      case OfflineDownloadStatus.INACTIVE:
      default:
        return messages.offlinePlayback
    }
  }

  const getTextColor = () => {
    if (
      downloadStatus === OfflineDownloadStatus.LOADING ||
      downloadStatus === OfflineDownloadStatus.SUCCESS
    ) {
      return 'accent'
    }
    return 'subdued'
  }

  if (!isAvailableForDownload) return null
  return (
    <Flex
      w='100%'
      direction='row'
      justifyContent='space-between'
      alignItems='center'
    >
      <Flex direction='row' gap='s' alignItems='center'>
        <DownloadStatusIndicator status={downloadStatus} size='s' />
        <Text variant='title' size='s' color={getTextColor()}>
          {getMessage()}
        </Text>
      </Flex>
      {!isReadOnly ? (
        <Switch
          value={switchValue}
          onValueChange={handleSwitchChange}
          disabled={disabled}
        />
      ) : null}
    </Flex>
  )
}
