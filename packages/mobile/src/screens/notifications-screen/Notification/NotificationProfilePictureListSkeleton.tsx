import { times } from 'lodash'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import { DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT } from './constants'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    flexDirection: 'row'
  },
  image: {
    marginRight: spacing(-2),
    backgroundColor: palette.skeleton
  }
}))

type ProfilePictureListSkeletonProps = {
  count: number
  limit: number
  imageStyles?: {
    width?: number
    height?: number
  }
}

export const ProfilePictureListSkeleton = ({
  count,
  limit,
  imageStyles
}: ProfilePictureListSkeletonProps) => {
  const styles = useStyles()
  const imageWidth = imageStyles?.width ?? DEFAULT_IMAGE_WIDTH
  const imageHeight = imageStyles?.height ?? DEFAULT_IMAGE_HEIGHT

  return (
    <View style={styles.root}>
      {times(Math.min(count, limit)).map((index) => (
        <View
          key={index}
          style={[
            styles.image,
            {
              width: imageWidth,
              height: imageHeight,
              borderRadius: Math.ceil(imageWidth / 2)
            }
          ]}
        />
      ))}
    </View>
  )
}
