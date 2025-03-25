import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import { SquareSizes, ID } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import RemixCard from 'components/remix-card/RemixCard'
import { useProfilePicture } from 'hooks/useProfilePicture'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { push as pushRoute } from 'utils/navigation'
const { profilePage } = route

type OwnProps = {
  trackId: ID
}

type ConnectedRemixCardProps = OwnProps & ReturnType<typeof mapDispatchToProps>

const ConnectedRemixCard = ({
  trackId,
  goToRoute
}: ConnectedRemixCardProps) => {
  const { data: track } = useTrack(trackId, {
    select: (track) => {
      return {
        permalink: track?.permalink,
        owner_id: track?.owner_id,
        _co_sign: track?._co_sign
      }
    }
  })
  const { data: user } = useUser(track?.owner_id, {
    select: (user) => {
      return {
        handle: user?.handle,
        name: user?.name,
        user_id: user?.user_id
      }
    }
  })
  const profilePictureImage = useProfilePicture({
    userId: user?.user_id,
    size: SquareSizes.SIZE_150_BY_150
  })
  const coverArtImage = useTrackCoverArt({
    trackId,
    size: SquareSizes.SIZE_480_BY_480
  })
  const goToTrackPage = useCallback(() => {
    goToRoute(track?.permalink ?? '')
  }, [goToRoute, track])
  const goToArtistPage = useCallback(() => {
    goToRoute(profilePage(user?.handle ?? ''))
  }, [goToRoute, user])

  if (!track || !user) return null

  return (
    <RemixCard
      profilePictureImage={profilePictureImage}
      coverArtImage={coverArtImage}
      coSign={track?._co_sign}
      artistName={user?.name}
      artistHandle={user?.handle}
      onClick={goToTrackPage}
      onClickArtistName={goToArtistPage}
      userId={user?.user_id}
    />
  )
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(() => {}, mapDispatchToProps)(ConnectedRemixCard)
