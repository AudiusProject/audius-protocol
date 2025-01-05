import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { ID, User } from '@audius/common/models'
import { route } from '@audius/common/utils'
import {
  IconArrowRight as IconArrow,
  IconRobot,
  PlainButton
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { emptyStringGuard } from 'pages/track-page/utils'
import { push } from 'utils/navigation'
import { profilePageAiAttributedTracks } from 'utils/route'

import styles from './AiTrackSection.module.css'
const { profilePage } = route

const messages = {
  title: 'Generated With AI',
  description: 'This song was made by an AI that has been trained to imitate',
  viewMore: 'View More'
}

type AiTrackSectionProps = {
  attributedUserId: ID
  className?: string
  descriptionClassName?: string
}

export const AiTrackSection = ({
  attributedUserId,
  className,
  descriptionClassName
}: AiTrackSectionProps) => {
  const dispatch = useDispatch()
  const { data: user } = useUser(attributedUserId)

  const renderArtist = useCallback(
    (entity: User) => (
      <ArtistPopover
        component='span'
        handle={entity.handle}
        mouseEnterDelay={0.1}
      >
        <h2
          className={styles.attributedUser}
          onClick={() =>
            dispatch(push(profilePage(emptyStringGuard(entity.handle))))
          }
        >
          {entity.name}
          <UserBadges
            userId={entity.user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
        </h2>
      </ArtistPopover>
    ),
    [dispatch]
  )
  const handleClickViewMore = useCallback(() => {
    dispatch(
      push(profilePageAiAttributedTracks(emptyStringGuard(user?.handle)))
    )
  }, [dispatch, user])

  return (
    <div className={cn(className, styles.root)}>
      <div className={styles.title}>
        <IconRobot className={styles.iconRobot} />
        {messages.title}
      </div>
      <div className={cn(descriptionClassName, styles.description)}>
        {messages.description}
        {user ? renderArtist(user) : null}
      </div>
      <PlainButton iconRight={IconArrow} onClick={handleClickViewMore}>
        {messages.viewMore}
      </PlainButton>
    </div>
  )
}
