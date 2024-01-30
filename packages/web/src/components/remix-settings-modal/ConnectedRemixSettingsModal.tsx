import { useEffect } from 'react'

import {
  remixSettingsSelectors,
  remixSettingsActions,
  Nullable
} from '@audius/common'
import { Status, ID, AccessConditions } from '@audius/common/models'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import RemixSettingsModal from 'components/remix-settings-modal/RemixSettingsModal'
import { AppState } from 'store/types'

const { getTrack, getUser, getStatus } = remixSettingsSelectors
const { fetchTrack, fetchTrackSucceeded, reset } = remixSettingsActions

type OwnProps = {
  isStreamGated: boolean
  streamConditions: Nullable<AccessConditions>
  isRemix: boolean
  setIsRemix: (isRemix: boolean) => void
  isOpen: boolean
  onClose: () => void
  onChangeField: (field: string, value: any) => void
  hideRemixes?: boolean
  onToggleHideRemixes?: () => void
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
  isStreamGated,
  streamConditions,
  isRemix,
  setIsRemix,
  isOpen,
  onClose,
  onChangeField,
  track,
  user,
  status,
  setInitialTrackId,
  reset,
  onEditUrl,
  hideRemixes,
  onToggleHideRemixes
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
      isStreamGated={isStreamGated}
      streamConditions={streamConditions}
      isRemix={isRemix}
      setIsRemix={setIsRemix}
      onChangeField={onChangeField}
      reset={reset}
      track={track}
      user={user}
      isInvalidTrack={status === Status.ERROR}
      onEditUrl={onEditUrl}
      hideRemixes={hideRemixes}
      onToggleHideRemixes={onToggleHideRemixes}
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
