import {
  SquareSizes,
  statusIsNotFinalized,
  useGetTrackById
} from '@audius/common'
import cn from 'classnames'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Text } from 'components/typography'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

import styles from './TrackNameWithArtwork.module.css'

type TrackNameWithArtworkProps = {
  id: number
  wrapperClassName?: string
  textClassName?: string
}
export const TrackNameWithArtwork = ({
  id,
  wrapperClassName,
  textClassName
}: TrackNameWithArtworkProps) => {
  const { status, data: track } = useGetTrackById({ id })
  const image = useTrackCoverArt2(id, SquareSizes.SIZE_150_BY_150)
  const loading = statusIsNotFinalized(status) || !track
  return loading ? null : (
    <div className={cn(styles.container, wrapperClassName)}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text className={textClassName} variant='body' size='small'>
        {track.title}
      </Text>
    </div>
  )
}
