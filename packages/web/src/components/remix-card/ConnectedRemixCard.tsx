import { useCallback } from 'react'

import { SquareSizes, ID } from '@audius/common/models'
import { cacheTracksSelectors, cacheUsersSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import RemixCard from 'components/remix-card/RemixCard'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { withNullGuard } from 'utils/withNullGuard'
const { profilePage } = route
const { getTrack } = cacheTracksSelectors
const { getUserFromTrack } = cacheUsersSelectors

type OwnProps = {
  trackId: ID
}

type ConnectedRemixCardProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard(
  ({ track, user, ...p }: ConnectedRemixCardProps) =>
    track && user && { ...p, track, user }
)

const ConnectedRemixCard = g(({ track, user, goToRoute }) => {
  const profilePictureImage = useProfilePicture({
    userId: user.user_id,
    size: SquareSizes.SIZE_150_BY_150
  })
  const coverArtImage = useTrackCoverArt({
    trackId: track.track_id,
    size: SquareSizes.SIZE_480_BY_480
  })
  const goToTrackPage = useCallback(() => {
    goToRoute(track.permalink)
  }, [goToRoute, track])
  const goToArtistPage = useCallback(() => {
    goToRoute(profilePage(user.handle))
  }, [goToRoute, user])

  return (
    <RemixCard
      profilePictureImage={profilePictureImage}
      coverArtImage={coverArtImage}
      coSign={track._co_sign}
      artistName={user.name}
      artistHandle={user.handle}
      onClick={goToTrackPage}
      onClickArtistName={goToArtistPage}
      userId={user.user_id}
    />
  )
})

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    track: getTrack(state, { id: ownProps.trackId }),
    user: getUserFromTrack(state, { id: ownProps.trackId })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedRemixCard)
