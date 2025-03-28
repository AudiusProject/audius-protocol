import { MouseEventHandler, useCallback, useMemo } from 'react'

import { useFollowUser, useUnfollowUser } from '@audius/common/api'
import { FollowSource, User } from '@audius/common/models'
import { profilePageActions } from '@audius/common/store'
import { FollowButton } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import Stats, { StatProps } from 'components/stats/Stats'

import styles from './ArtistCard.module.css'
import { ArtistCardCover } from './ArtistCardCover'
import { ArtistSupporting } from './ArtistSupporting'

const { setNotificationSubscription } = profilePageActions

type ArtistCardProps = {
  artist: User
  onNavigateAway: () => void
}

export const ArtistCard = (props: ArtistCardProps) => {
  const { artist, onNavigateAway } = props
  const {
    user_id,
    bio,
    track_count,
    playlist_count,
    follower_count,
    followee_count,
    does_current_user_follow
  } = artist

  const dispatch = useDispatch()
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()
  const isArtist = track_count > 0

  const handleClick: MouseEventHandler = useCallback((event) => {
    event.stopPropagation()
  }, [])

  const stats = useMemo((): StatProps[] => {
    if (isArtist) {
      return [
        {
          number: track_count,
          title: track_count === 1 ? 'track' : 'tracks',
          key: 'track'
        },
        {
          number: follower_count,
          title: follower_count === 1 ? 'follower' : 'followers',
          key: 'follower'
        },
        { number: followee_count, title: 'following', key: 'following' }
      ]
    }
    return [
      {
        number: playlist_count,
        title: playlist_count === 1 ? 'playlist' : 'playlists',
        key: 'playlist'
      },
      {
        number: follower_count,
        title: follower_count === 1 ? 'follower' : 'followers',
        key: 'follower'
      },
      { number: followee_count, title: 'following', key: 'following' }
    ]
  }, [isArtist, track_count, follower_count, followee_count, playlist_count])

  const handleFollow = useCallback(() => {
    followUser({ followeeUserId: user_id, source: FollowSource.HOVER_TILE })
  }, [followUser, user_id])

  const handleUnfollow = useCallback(() => {
    unfollowUser({ followeeUserId: user_id, source: FollowSource.HOVER_TILE })
    dispatch(setNotificationSubscription(user_id, false, false))
  }, [dispatch, user_id, unfollowUser])

  return (
    <div className={styles.popoverContainer} onClick={handleClick}>
      <div className={styles.artistCardContainer}>
        <ArtistCardCover
          artist={artist}
          isArtist={isArtist}
          onNavigateAway={onNavigateAway}
        />
        <div className={styles.artistStatsContainer}>
          <Stats
            userId={user_id}
            stats={stats}
            clickable={false}
            size='medium'
          />
        </div>
        <div className={styles.contentContainer}>
          <div>
            <ArtistSupporting artist={artist} onNavigateAway={onNavigateAway} />
            <div className={styles.description}>{bio}</div>
            <FollowButton
              isFollowing={does_current_user_follow}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
