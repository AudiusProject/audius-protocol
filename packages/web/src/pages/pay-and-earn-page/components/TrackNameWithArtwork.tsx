import { SquareSizes, statusIsNotFinalized } from '@audius/common'
import { useGetTrackById } from '@audius/common/api'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Text } from 'components/typography'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

import styles from './TrackNameWithArtwork.module.css'

export const TrackNameWithArtwork = ({ id }: { id: number }) => {
  const { status, data: track } = useGetTrackById({ id })
  const image = useTrackCoverArt2(id, SquareSizes.SIZE_150_BY_150)
  const loading = statusIsNotFinalized(status) || !track
  return loading ? null : (
    <div className={styles.container}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text className={styles.text} variant='body' size='small'>
        {track.title}
      </Text>
    </div>
  )
}
