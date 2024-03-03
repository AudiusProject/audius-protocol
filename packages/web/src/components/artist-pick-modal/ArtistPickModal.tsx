import {
  accountSelectors,
  tracksSocialActions,
  useArtistPickModal
} from '@audius/common/store'
import {
  Button,
  Modal,
  ModalContent,
  ModalContentText,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

const { setArtistPick, unsetArtistPick } = tracksSocialActions
const getAccountUser = accountSelectors.getAccountUser

const messagesMap = {
  add: {
    title: 'Set your Artist Pick',
    description:
      'This track will appear at the top of your profile, above your recent uploads, until you change or remove it.',
    confirm: 'Set Track'
  },
  update: {
    title: 'Change your artist pick?',
    description:
      'This track will appear at the top of your profile and replace your previously picked track.',
    confirm: 'Change Track'
  },
  remove: {
    title: 'Unset as Artist Pick',
    description: (
      <div>
        <p>Are you sure you want to remove your pick?</p>
        <p>This track will be displayed based on its release date.</p>
      </div>
    ),
    confirm: 'Unset Track'
  }
}

export const ArtistPickModal = () => {
  const {
    isOpen,
    onClose,
    data: { trackId }
  } = useArtistPickModal()
  const dispatch = useDispatch()

  const currentArtistPickId = useSelector(
    (state) => getAccountUser(state)?.artist_pick_track_id
  )

  const action = !currentArtistPickId ? 'add' : trackId ? 'update' : 'remove'

  const messages = messagesMap[action]

  const handleSubmit = () => {
    if (trackId) {
      dispatch(setArtistPick(trackId))
    } else {
      dispatch(unsetArtistPick())
    }
    onClose()
  }

  return (
    <Modal size='small' isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>{messages.description}</ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' onClick={onClose} fullWidth>
          Cancel
        </Button>
        <Button variant='primary' onClick={handleSubmit} fullWidth>
          {messages.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
