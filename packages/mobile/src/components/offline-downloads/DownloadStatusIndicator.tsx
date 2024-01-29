import type { Nullable } from '@audius/common'
import { reachabilitySelectors } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import Rive from 'rive-react-native'

import { IconDownloadFailed } from '@audius/harmony-native'
import { IconDownloadInactive } from '@audius/harmony-native'
import { IconDownloadQueued } from '@audius/harmony-native'
import { IconDownloaded } from '@audius/harmony-native'
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
  iconDownloadQueued: {
    fill: palette.neutralLight4
  },
  iconDownloaded: {
    fill: palette.secondary
  },
  iconDownloadFailed: {
    fill: palette.secondary
  },
  iconDownloadInactive: {
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
        <IconDownloaded
          fill={styles.iconDownloaded.fill}
          height={size}
          width={size}
        />
      )
    }
    switch (status) {
      case OfflineDownloadStatus.INIT:
        return (
          <IconDownloadQueued
            fill={styles.iconDownloadQueued.fill}
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
          <IconDownloaded
            fill={styles.iconDownloaded.fill}
            height={size}
            width={size}
          />
        )
      case OfflineDownloadStatus.ERROR:
      case OfflineDownloadStatus.ABANDONED:
        return (
          <IconDownloadFailed
            fill={styles.iconDownloadFailed.fill}
            height={size}
            width={size}
          />
        )
      case OfflineDownloadStatus.INACTIVE:
        return (
          <IconDownloadInactive
            fill={styles.iconDownloadInactive.fill}
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
