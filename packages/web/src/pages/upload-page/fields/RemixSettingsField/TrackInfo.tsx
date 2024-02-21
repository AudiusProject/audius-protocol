import { useGetTrackById } from '@audius/common/api'
import { SquareSizes, ID } from '@audius/common/models'
import { Text } from '@audius/harmony'

import { SelectedValue } from 'components/data-entry/ContextualMenu'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'

import styles from './RemixSettingsField.module.css'

const messages = {
  by: 'By'
}

type TrackInfoProps = {
  trackId: ID
}

export const TrackInfo = (props: TrackInfoProps) => {
  const { trackId } = props
  const image = useTrackCoverArt2(trackId, SquareSizes.SIZE_150_BY_150)

  const { data: track } = useGetTrackById({ id: trackId })

  if (!track) return null

  const { user } = track

  return (
    <SelectedValue>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text strength='strong'>
        <Text variant='inherit' tag='span'>
          {track.title}
        </Text>{' '}
        <Text variant='inherit' tag='span' color='subdued'>
          {messages.by}
        </Text>{' '}
        <Text variant='inherit' tag='span'>
          {user.name}
        </Text>
      </Text>
      <UserBadges
        className={styles.iconVerified}
        userId={user.user_id}
        badgeSize={14}
      />
    </SelectedValue>
  )
}
