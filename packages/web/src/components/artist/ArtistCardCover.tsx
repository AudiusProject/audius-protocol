import { useCallback } from 'react'

import { SquareSizes, WidthSizes, User } from '@audius/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { ReactComponent as BadgeArtist } from 'assets/img/badgeArtist.svg'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { profilePage } from 'utils/route'

import styles from './ArtistCardCover.module.css'

const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type TRPCUser = {
  allowAiAttribution: boolean
  artistPickTrackId: number | null
  bio: string | null
  blockhash: string | null
  blocknumber: number | null
  coverPhoto: string | null
  coverPhotoSizes: string | null
  createdAt: Date
  creatorNodeEndpoint: string | null
  handle: string
  handleLc: string | null
  hasCollectibles: boolean
  isAvailable: boolean
  isCurrent: boolean;
  isDeactivated: boolean
  isStorageV2: boolean
  isVerified: boolean
  location: string | null
  metadataMultihash: string | null
  name: string | null
  playlistLibrary: any | null
  primaryId: number | null
  profilePicture: string | null
  profilePictureSizes: string | null
  replicaSetUpdateSigner: string | null
  secondaryIds: any | null
  slot: number | null
  txhash: string
  updatedAt: Date
  userAuthorityAccount: string | null
  userId: number;
  userStorageAccount: string | null
  wallet: string | null
}

type ArtistCoverProps = {
  artist: User
  // artist: TRPCUser | null
  isArtist: boolean
  onNavigateAway?: () => void
  followsMe: boolean
}

export const ArtistCardCover = (props: ArtistCoverProps) => {
  const { isArtist, artist, onNavigateAway, followsMe } = props
  if (!artist) return <></>
  const {
    user_id,
    name,
    handle,
    _cover_photo_sizes,
    _profile_picture_sizes,
  } = artist

  // const {
  //   userId: user_id,
  //   name,
  //   handle,
  //   coverPhotoSizes: _cover_photo_sizes,
  //   profilePictureSizes: _profile_picture_sizes,
  //   // does_follow_current_user
  // } = artist
  const dispatch = useDispatch()

  const coverPhoto = useUserCoverPhoto(
    user_id,
    _cover_photo_sizes,
    WidthSizes.SIZE_640
  )
  const profilePicture = useUserProfilePicture(
    user_id,
    _profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  const darkenedCoverPhoto = `${gradient}, url(${coverPhoto})`

  const handleClickUser = useCallback(() => {
    if (onNavigateAway) {
      onNavigateAway()
    }
    dispatch(push(profilePage(handle)))
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
              userId={user_id}
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
