import { SquareSizes, ID } from '@audius/common/models'
import {} from '@audius/common'
import { useGetTrackById } from '@audius/common/api'

import { SelectedValue } from 'components/data-entry/ContextualMenu'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Text } from 'components/typography'
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
        <Text variant='inherit' as='span'>
          {track.title}
        </Text>{' '}
        <Text variant='inherit' as='span' color='neutralLight2'>
          {messages.by}
        </Text>{' '}
        <Text variant='inherit' as='span'>
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
