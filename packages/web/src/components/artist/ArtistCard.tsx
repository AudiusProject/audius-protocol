import { MouseEventHandler, useCallback, useMemo } from 'react'

import {
  FollowSource,
  profilePageActions,
  usersSocialActions
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { FollowButton } from 'components/follow-button/FollowButton'
import Stats, { StatProps } from 'components/stats/Stats'
import { trpc } from 'services/trpc'

import styles from './ArtistCard.module.css'
import { ArtistCardCover } from './ArtistCardCover'
import { ArtistSupporting } from './ArtistSupporting'

const { followUser, unfollowUser } = usersSocialActions
const { setNotificationSubscription } = profilePageActions

type ArtistCardProps = {
  userId: number
  onNavigateAway: () => void
}

export const ArtistCard = (props: ArtistCardProps) => {
  const { userId: user_id, onNavigateAway } = props
  const followData = trpc.me.userRelationship.useQuery({
    theirId: user_id.toString()
  })
  const followed = followData.data?.followed || false
  const followsMe = followData.data?.followsMe || false
  const { data } = trpc.users.get.useQuery(user_id.toString())
  const dispatch = useDispatch()
  const isArtist = parseInt(data?.trackCount || '0') > 0
  const track_count = parseInt(data?.trackCount || '0')
  const playlist_count = parseInt(data?.playlistCount || '0')
  const follower_count = parseInt(data?.followerCount || '0')
  const followee_count = parseInt(data?.followingCount || '0')
  const bio = data?.bio || ''

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
    dispatch(followUser(user_id, FollowSource.HOVER_TILE))
  }, [dispatch, user_id])

  const handleUnfollow = useCallback(() => {
    dispatch(unfollowUser(user_id, FollowSource.HOVER_TILE))
    dispatch(setNotificationSubscription(user_id, false, false))
  }, [dispatch, user_id])

  return (
    <div className={styles.popoverContainer} onClick={handleClick}>
      <div className={styles.artistCardContainer}>
        <ArtistCardCover
          artist={data}
          isArtist={isArtist}
          onNavigateAway={onNavigateAway}
          followsMe={followsMe}
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
            <ArtistSupporting
              userId={user_id}
              onNavigateAway={onNavigateAway}
            />
            <div className={styles.description}>{bio}</div>
            <FollowButton
              className={styles.followButton}
              following={followed}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              stopPropagation
            />
          </div>
        </div>
      </div>
    </div>
  )
}
