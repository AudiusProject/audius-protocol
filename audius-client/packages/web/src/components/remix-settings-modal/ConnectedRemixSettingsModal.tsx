import { useEffect } from 'react'

import { ID } from '@audius/common'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import Status from 'common/models/Status'
import RemixSettingsModal from 'components/remix-settings-modal/RemixSettingsModal'
import { AppState } from 'store/types'

import { getTrack, getUser, getStatus } from './store/selectors'
import { fetchTrack, fetchTrackSucceeded, reset } from './store/slice'

type OwnProps = {
  isOpen: boolean
  onClose: () => void
  // When opening the modal from a track that already has remix_of set,
  // the initial track id should be set to the first remix parent's track id.
  // This is used in the "edit track" flow.
  initialTrackId?: ID
}

type ConnectedRemixSettingsModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedRemixSettingsModal = ({
  initialTrackId,
  isOpen,
  onClose,
  track,
  user,
  status,
  setInitialTrackId,
  reset,
  onEditUrl
}: ConnectedRemixSettingsModalProps) => {
  useEffect(() => {
    if (isOpen && initialTrackId) {
      setInitialTrackId(initialTrackId)
    }
  }, [isOpen, initialTrackId, setInitialTrackId])

  // Reset the connected modal state as soon as it closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  return (
    <RemixSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      track={track}
      user={user}
      isInvalidTrack={status === Status.ERROR}
      onEditUrl={onEditUrl}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    track: getTrack(state),
    user: getUser(state),
    status: getStatus(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onEditUrl: (url: string) => dispatch(fetchTrack({ url })),
    setInitialTrackId: (trackId: ID) =>
      dispatch(fetchTrackSucceeded({ trackId })),
    reset: () => dispatch(reset())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedRemixSettingsModal)
