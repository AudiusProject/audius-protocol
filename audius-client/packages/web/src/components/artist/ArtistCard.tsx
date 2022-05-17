import React from 'react'

import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { CoverPhotoSizes, ProfilePictureSizes } from 'common/models/ImageSizes'
import { Supporting } from 'common/models/Tipping'
import { FeatureFlags } from 'common/services/remote-config'
import FollowButton from 'components/follow-button/FollowButton'
import Stats, { StatProps } from 'components/stats/Stats'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './ArtistCard.module.css'
import { ArtistCover } from './ArtistCover'
import { ArtistSupporting } from './ArtistSupporting'

const { getFeatureEnabled } = remoteConfigInstance

type ArtistCardProps = {
  description: string
  trackCount: number
  playlistCount: number
  followerCount: number
  followingCount: number
  doesFollowCurrentUser: boolean
  userId: number
  name: string
  handle: string
  profilePictureSizes: ProfilePictureSizes
  coverPhotoSizes: CoverPhotoSizes
  isArtist: boolean
  onNameClick: () => void
  following: boolean
  onFollow: () => void
  onUnfollow: () => void
  supportingList: Supporting[]
  supportingCount: number
  onSupportingClick: () => void
  setUsers: (id: ID) => void
  openModal: () => void
} & ReturnType<typeof mapDispatchToProps>

const ArtistCard = ({
  description,
  trackCount,
  playlistCount,
  followerCount,
  followingCount,
  doesFollowCurrentUser,
  userId,
  name,
  handle,
  profilePictureSizes,
  coverPhotoSizes,
  isArtist,
  onNameClick,
  following,
  onFollow,
  onUnfollow,
  supportingList,
  supportingCount,
  onSupportingClick,
  setUsers,
  openModal
}: ArtistCardProps) => {
  const isTippingEnabled = getFeatureEnabled(FeatureFlags.TIPPING_ENABLED)

  const handleClick = (e: any) => {
    // NOTE: Prevents parent div's onClick
    e.stopPropagation()
  }

  const getStats = (): StatProps[] => {
    return isArtist
      ? [
          {
            number: trackCount,
            title: trackCount === 1 ? 'track' : 'tracks',
            key: 'track'
          },
          {
            number: followerCount,
            title: followerCount === 1 ? 'follower' : 'followers',
            key: 'follower'
          },
          { number: followingCount, title: 'following', key: 'following' }
        ]
      : [
          {
            number: playlistCount,
            title: playlistCount === 1 ? 'playlist' : 'playlists',
            key: 'playlist'
          },
          {
            number: followerCount,
            title: followerCount === 1 ? 'follower' : 'followers',
            key: 'follower'
          },
          { number: followingCount, title: 'following', key: 'following' }
        ]
  }

  const handleSupportingClick = () => {
    onSupportingClick()
    setUsers(userId)
    openModal()
  }

  return (
    <div className={styles.popoverContainer} onClick={handleClick}>
      <div className={styles.artistCardContainer}>
        <ArtistCover
          userId={userId}
          name={name}
          handle={handle}
          isArtist={isArtist}
          doesFollowCurrentUser={doesFollowCurrentUser}
          onNameClick={onNameClick}
          profilePictureSizes={profilePictureSizes}
          coverPhotoSizes={coverPhotoSizes}
        />
        <div className={styles.artistStatsContainer}>
          <Stats
            userId={userId}
            stats={getStats()}
            clickable={false}
            size='medium'
          />
        </div>
        <div className={styles.contentContainer}>
          <div>
            {isTippingEnabled && (
              <ArtistSupporting
                supportingList={supportingList}
                supportingCount={supportingCount}
                handleClick={handleSupportingClick}
              />
            )}
            <div className={styles.description}>{description}</div>
            <FollowButton
              className={styles.followButton}
              following={following}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setUsers: (id: ID) =>
    dispatch(
      setUsers({
        userListType: UserListType.SUPPORTING,
        entityType: UserListEntityType.USER,
        id
      })
    ),
  openModal: () => dispatch(setVisibility(true))
})

export default connect(null, mapDispatchToProps)(ArtistCard)
