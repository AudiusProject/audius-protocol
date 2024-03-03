import { useCallback, useContext } from 'react'

import {
  accountSelectors,
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  duplicateAddConfirmationModalUISelectors
} from '@audius/common/store'
import { fillString } from '@audius/common/utils'
import {
  Button,
  Modal,
  ModalContent,
  ModalContentText,
  ModalHeader,
  ModalTitle,
  ModalFooter
} from '@audius/harmony'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'
import { ToastContext } from 'components/toast/ToastContext'
import ToastLinkContent from 'components/toast/mobile/ToastLinkContent'
import { collectionPage } from 'utils/route'

const { addTrackToPlaylist } = cacheCollectionsActions
const { getCollection } = cacheCollectionsSelectors
const { getPlaylistId, getTrackId } = duplicateAddConfirmationModalUISelectors
const { getAccountUser } = accountSelectors

const messages = {
  title: 'Already Added',
  description: (collectionType: 'album' | 'playlist') =>
    `This is already in your%0 ${collectionType}`,
  cancel: "Don't Add",
  add: 'Add Anyway',
  addedToast: (collectionType: 'album' | 'playlist') =>
    `Added To ${capitalize(collectionType)}!`,
  view: 'View'
}

export const DuplicateAddConfirmationModal = () => {
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)
  const playlistId = useSelector(getPlaylistId)
  const trackId = useSelector(getTrackId)
  const playlist = useSelector((state) =>
    getCollection(state, { id: playlistId })
  )
  const account = useSelector(getAccountUser)
  const [isOpen, setIsOpen] = useModalState('DuplicateAddConfirmation')
  const collectionType = playlist?.is_album ? 'album' : 'playlist'

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleAdd = useCallback(() => {
    if (trackId && playlistId) {
      dispatch(addTrackToPlaylist(trackId, playlistId))
      if (account) {
        toast(
          <ToastLinkContent
            text={messages.addedToast(collectionType)}
            linkText={messages.view}
            link={collectionPage(
              account.handle,
              playlist?.playlist_name,
              playlistId,
              playlist?.permalink,
              playlist?.is_album
            )}
          />
        )
      } else {
        toast(messages.addedToast(collectionType))
      }
    }
    onClose()
  }, [
    trackId,
    playlistId,
    onClose,
    dispatch,
    account,
    toast,
    collectionType,
    playlist?.playlist_name,
    playlist?.permalink,
    playlist?.is_album
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>
          {fillString(
            messages.description(collectionType),
            playlist ? ` "${playlist.playlist_name}"` : ''
          )}
        </ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' fullWidth onClick={handleAdd}>
          {messages.add}
        </Button>
        <Button fullWidth variant='primary' onClick={onClose}>
          {messages.cancel}
        </Button>{' '}
      </ModalFooter>
    </Modal>
  )
}
