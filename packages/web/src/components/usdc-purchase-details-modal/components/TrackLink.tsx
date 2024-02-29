import { useGetTrackById } from '@audius/common/api'
import { Link } from 'react-router-dom'

import { Text } from 'components/typography'

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
      <Text size='large' color='secondary'>
        {track.title}
      </Text>
    </Link>
  )
}
