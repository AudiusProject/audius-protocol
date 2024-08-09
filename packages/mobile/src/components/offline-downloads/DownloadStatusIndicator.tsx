import { reachabilitySelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import Rive from 'rive-react-native'

import type { IconSize } from '@audius/harmony-native'
import {
  IconCloudDownloadError,
  IconCloudDownloadInactive,
  IconCloudDownloadQueued,
  IconCloudDownload,
  useTheme
} from '@audius/harmony-native'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { useThemeVariant } from 'app/utils/theme'
const { getIsReachable } = reachabilitySelectors

export type DownloadStatusIndicatorProps = {
  status: Nullable<OfflineDownloadStatus>
  size?: IconSize
  style?: StyleProp<ViewStyle>
}

export const DownloadStatusIndicator = (
  props: DownloadStatusIndicatorProps
) => {
  const { status, size = 'l', style } = props
  const themeVariant = useThemeVariant()
  const isReachable = useSelector(getIsReachable)
  const { iconSizes } = useTheme()

  const renderIndicator = () => {
    // If we are offline, display as download succeeded
    // since we only show the user successfully downloaded things.
    if (!isReachable && status !== OfflineDownloadStatus.INACTIVE) {
      return <IconCloudDownload color='accent' size={size} />
    }
    switch (status) {
      case OfflineDownloadStatus.INIT:
        return <IconCloudDownloadQueued color='subdued' size={size} />
      case OfflineDownloadStatus.LOADING:
        return (
          <View>
            <Rive
              style={{ height: iconSizes[size], width: iconSizes[size] }}
              resourceName={`downloading_${themeVariant}`}
              autoplay
            />
          </View>
        )
      case OfflineDownloadStatus.SUCCESS:
        return <IconCloudDownload color='accent' size={size} />
      case OfflineDownloadStatus.ERROR:
      case OfflineDownloadStatus.ABANDONED:
        return <IconCloudDownloadError color='accent' size={size} />
      case OfflineDownloadStatus.INACTIVE:
        return <IconCloudDownloadInactive color='subdued' size={size} />
      default:
        return null
    }
  }

  const indicator = renderIndicator()
  if (!indicator) return null
  return <View style={style}>{indicator}</View>
}
