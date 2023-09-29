import { useCallback } from 'react'

import { SquareSizes, WidthSizes, User } from '@audius/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { ReactComponent as BadgeArtist } from 'assets/img/badgeArtist.svg'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto, useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import {
  useProfilePicture,
  useUserProfilePicture
} from 'hooks/useUserProfilePicture'
import { profilePage } from 'utils/route'

import styles from './ArtistCardCover.module.css'

const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type TRPCUser = {
  allowAiAttribution?: boolean | null
  artistPickTrackId?: number | null | undefined
  bio?: string | null
  blockhash?: string | null
  blocknumber?: number | null
  coverPhoto?: string | null
  coverPhotoSizes?: string | null
  createdAt?: string
  creatorNodeEndpoint?: string | null
  handle?: string | null | undefined
  handleLc?: string | null
  hasCollectibles?: boolean
  isAvailable?: boolean
  isCurrent?: boolean
  isDeactivated?: boolean
  isStorageV2?: boolean
  isVerified?: boolean
  location?: string | null
  metadataMultihash?: string | null
  name?: string | null
  primaryId?: number | null
  profilePicture?: string | null
  profilePictureSizes?: string | null
  replicaSetUpdateSigner?: string | null
  slot?: number | null
  txhash?: string
  updatedAt?: string
  userAuthorityAccount?: string | null
  userId?: number | null
  userStorageAccount?: string | null
  wallet?: string | null
}

type ArtistCoverProps = {
  artist: TRPCUser | undefined
  isArtist: boolean
  onNavigateAway?: () => void
  followsMe: boolean
}

export const ArtistCardCover = (props: ArtistCoverProps) => {
  const { isArtist, artist, onNavigateAway, followsMe } = props
  if (!artist) return <></>

  const {
    userId: user_id,
    name,
    handle,
    coverPhotoSizes: _cover_photo_sizes,
    profilePictureSizes: _profile_picture_sizes
  } = artist
  const dispatch = useDispatch()

  const coverPhoto = useCoverPhoto(
    user_id || 0,
    WidthSizes.SIZE_640,
    _cover_photo_sizes || ''
  )
  const profilePicture = useProfilePicture(
    user_id || 0,
    SquareSizes.SIZE_150_BY_150,
    _profile_picture_sizes || ''
  )

  const darkenedCoverPhoto = `${gradient}, url(${coverPhoto})`

  const handleClickUser = useCallback(() => {
    if (onNavigateAway) {
      onNavigateAway()
    }
    dispatch(push(profilePage(handle || '')))
  }, [dispatch, handle, onNavigateAway])

  return (
    <DynamicImage
      wrapperClassName={styles.artistCoverPhoto}
      image={darkenedCoverPhoto}
      immediate
    >
      <div className={styles.coverPhotoContentContainer}>
        {isArtist ? <BadgeArtist className={styles.badgeArtist} /> : null}
        <DynamicImage
          wrapperClassName={styles.profilePictureWrapper}
          skeletonClassName={styles.profilePictureSkeleton}
          className={styles.profilePicture}
          image={profilePicture}
          immediate
        />
        <div className={styles.headerTextContainer}>
          <div className={styles.nameContainer}>
            <div className={styles.artistName} onClick={handleClickUser}>
              {name}
            </div>
            <UserBadges
              userId={user_id || 0}
              badgeSize={14}
              className={styles.iconVerified}
              useSVGTiers
            />
          </div>
          <div className={styles.artistHandleWrapper}>
            <div
              className={styles.artistHandle}
              onClick={handleClickUser}
            >{`@${handle}`}</div>
            {followsMe ? <FollowsYouBadge /> : null}
          </div>
        </div>
      </div>
    </DynamicImage>
  )
}
