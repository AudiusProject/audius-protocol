import { useGetTrackById } from '@audius/common/api'
import { Text } from '@audius/harmony'
import { Link } from 'react-router-dom'

import styles from './styles.module.css'

export const TrackLink = ({
  id,
  onClick
}: {
  id: number
  onClick: () => void
}) => {
  const { data: track } = useGetTrackById({ id })
  if (!track) return null
  return (
    <Link onClick={onClick} className={styles.link} to={track.permalink}>
      <Text variant='body' size='l' color='accent'>
        {track.title}
      </Text>
    </Link>
  )
}
