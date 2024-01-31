import { reachabilitySelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import Rive from 'rive-react-native'

import {
  IconCloudDownloadError,
  IconCloudDownloadInactive,
  IconCloudDownloadQueued,
  IconCloudDownload
} from '@audius/harmony-native'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
import { useThemeVariant } from 'app/utils/theme'
const { getIsReachable } = reachabilitySelectors

export type DownloadStatusIndicatorProps = {
  status: Nullable<OfflineDownloadStatus>
  size?: number
  style?: StyleProp<ViewStyle>
}

const useStyles = makeStyles(({ palette }) => ({
  IconCloudDownloadQueued: {
    fill: palette.neutralLight4
  },
  IconCloudDownload: {
    fill: palette.secondary
  },
  iconDownloadFailed: {
    fill: palette.secondary
  },
  IconCloudDownloadInactive: {
    fill: palette.neutralLight4
  }
}))

export const DownloadStatusIndicator = (
  props: DownloadStatusIndicatorProps
) => {
  const { status, size = 24, style } = props
  const styles = useStyles()
  const themeVariant = useThemeVariant()
  const isReachable = useSelector(getIsReachable)

  const renderIndicator = () => {
    // If we are offline, display as download succeeded
    // since we only show the user successfully downloaded things.
    if (!isReachable && status !== OfflineDownloadStatus.INACTIVE) {
      return (
        <IconCloudDownload
          fill={styles.IconCloudDownload.fill}
          height={size}
          width={size}
        />
      )
    }
    switch (status) {
      case OfflineDownloadStatus.INIT:
        return (
          <IconCloudDownloadQueued
            fill={styles.IconCloudDownloadQueued.fill}
            height={size}
            width={size}
          />
        )
      case OfflineDownloadStatus.LOADING:
        return (
          <View>
            <Rive
              style={{ height: size, width: size }}
              resourceName={`downloading_${themeVariant}`}
              autoplay
            />
          </View>
        )
      case OfflineDownloadStatus.SUCCESS:
        return (
          <IconCloudDownload
            fill={styles.IconCloudDownload.fill}
            height={size}
            width={size}
          />
        )
      case OfflineDownloadStatus.ERROR:
      case OfflineDownloadStatus.ABANDONED:
        return (
          <IconCloudDownloadError
            fill={styles.iconDownloadFailed.fill}
            height={size}
            width={size}
          />
        )
      case OfflineDownloadStatus.INACTIVE:
        return (
          <IconCloudDownloadInactive
            fill={styles.IconCloudDownloadInactive.fill}
            height={size}
            width={size}
          />
        )
      default:
        return null
    }
  }
  return <View style={style}>{renderIndicator()}</View>
}
