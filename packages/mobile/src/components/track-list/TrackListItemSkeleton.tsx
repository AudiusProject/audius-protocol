import { View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

import type { TrackListItemProps } from './TrackListItem'

const useStyles = makeStyles(({ palette, spacing }) => ({
  trackContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    justifyContent: 'center'
  },
  trackTitle: { height: spacing(4), marginBottom: 2 },
  trackArtist: { height: spacing(4) },
  divider: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1,
    marginVertical: 0,
    marginHorizontal: spacing(6)
  },
  noMarginDivider: {
    borderBottomColor: palette.neutralLight8,
    marginHorizontal: 0
  },
  hideDivider: {
    opacity: 0
  }
}))

type TrackListItemSkeletonProps = { index: number } & Pick<
  TrackListItemProps,
  'noDividerMargin' | 'showDivider' | 'showTopDivider'
>

export const TrackListItemSkeleton = (props: TrackListItemSkeletonProps) => {
  const { index, showDivider, showTopDivider, noDividerMargin } = props
  const styles = useStyles()

  return (
    <View>
      {showDivider && (showTopDivider || index > 0) ? (
        <View
          style={[styles.divider, noDividerMargin && styles.noMarginDivider]}
        />
      ) : null}
      <View style={styles.trackContainer}>
        <Skeleton style={styles.trackTitle} width='54%' />
        <Skeleton style={styles.trackArtist} width='30%' />
      </View>
    </View>
  )
}
