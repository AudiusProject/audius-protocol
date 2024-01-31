import { accountSelectors, tracksSocialActions } from '@audius/common/store'

import { memo } from 'react'

import {} from '@audius/common'
import { ID } from '@audius/common/models'
import { Modal, Button, ButtonSize, ButtonType } from '@audius/stems'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { cancelSetAsArtistPick } from 'store/application/ui/setAsArtistPickConfirmation/actions'
import { getSetAsArtistPickConfirmation } from 'store/application/ui/setAsArtistPickConfirmation/selectors'
import { PinTrackAction } from 'store/application/ui/setAsArtistPickConfirmation/types'
import { AppState } from 'store/types'

import styles from './PinTrackConfirmation.module.css'
const { setArtistPick, unsetArtistPick } = tracksSocialActions
const getAccountUser = accountSelectors.getAccountUser

type PinTrackConfirmationProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const pinTrackActionMessages = {
  [PinTrackAction.ADD]: {
    title: 'SET YOUR ARTIST PICK',
    description:
      'This track will appear at the top of your profile, above your recent uploads, until you change or remove it.',
    confirm: 'PICK TRACK'
  },
  [PinTrackAction.UPDATE]: {
    title: 'CHANGE YOUR ARTIST PICK?',
    description:
      'This track will appear at the top of your profile and replace your previously picked track.',
    confirm: 'CHANGE TRACK'
  },
  [PinTrackAction.REMOVE]: {
    title: 'UNSET AS ARTIST PICK',
    description: (
      <div className={styles.multiline}>
        <p>{'Are you sure you want to remove your pick?'}</p>
        <p>{'This track will be displayed based on its release date.'}</p>
      </div>
    ),
    confirm: 'UNSET TRACK'
  }
}

const getMessages = (action?: PinTrackAction) => {
  return {
    ...(action
      ? pinTrackActionMessages[action]
      : { title: '', description: '', confirm: '' }),
    cancel: 'CANCEL'
  }
}

const PinTrackConfirmation = (props: PinTrackConfirmationProps) => {
  const { artist_pick_track_id: artistPick } = props.user || {
    artist_pick_track_id: null
  }
  const pinAction = !artistPick
    ? PinTrackAction.ADD
    : props.pinTrack.trackId
    ? PinTrackAction.UPDATE
    : PinTrackAction.REMOVE
  const messages = getMessages(pinAction)

  const onConfirm = () => {
    props.setArtistPick(props.pinTrack.trackId)
    props.onCancel()
  }

  return (
    <Modal
      title={messages.title}
      showTitleHeader
      showDismissButton
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
      isOpen={props.pinTrack.isVisible}
      onClose={props.onCancel}
    >
      <div className={styles.container}>
        <div className={styles.description}>{messages.description}</div>
        <div className={styles.buttons}>
          <Button
            className={styles.deleteButton}
            text={messages.cancel}
            size={ButtonSize.MEDIUM}
            type={ButtonType.COMMON}
            onClick={props.onCancel}
          />
          <Button
            className={styles.nevermindButton}
            text={messages.confirm}
            size={ButtonSize.MEDIUM}
            type={ButtonType.PRIMARY_ALT}
            onClick={onConfirm}
          />
        </div>
      </div>
    </Modal>
  )
}

PinTrackConfirmation.defaultProps = {
  visible: false
}

function mapStateToProps(state: AppState) {
  return {
    user: getAccountUser(state),
    pinTrack: getSetAsArtistPickConfirmation(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onCancel: () => dispatch(cancelSetAsArtistPick()),
    setArtistPick: (trackId?: ID) =>
      dispatch(trackId ? setArtistPick(trackId) : unsetArtistPick())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(PinTrackConfirmation))
