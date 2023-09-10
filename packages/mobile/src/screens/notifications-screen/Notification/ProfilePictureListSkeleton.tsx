import { times } from 'lodash'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    flexDirection: 'row',
    marginRight: spacing(6)
  },
  image: {
    marginRight: spacing(-2),
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.skeleton
  },
  extra: {
    width: spacing(2)
  }
}))

type ProfilePictureListSkeletonProps = {
  count: number
  limit: number
}

export const ProfilePictureListSkeleton = (
  props: ProfilePictureListSkeletonProps
) => {
  const { count, limit } = props
  const styles = useStyles()
  return (
    <View style={styles.root}>
      {times(Math.min(count, limit)).map((index) => (
        <View key={index} style={styles.image} />
      ))}
      {count >= limit ? <View style={styles.extra} /> : null}
    </View>
  )
}
