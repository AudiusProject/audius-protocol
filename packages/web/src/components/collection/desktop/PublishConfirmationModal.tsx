import { useCallback, useMemo } from 'react'

import { useGetCurrentUserId, useGetTracksByIds } from '@audius/common/api'
import { Collection } from '@audius/common/models'
import {
  cacheCollectionsActions,
  collectionPageSelectors,
  CommonState
} from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalProps,
  ModalFooter,
  IconRocket,
  Button,
  Text,
  Flex
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PublishConfirmationModal.module.css'
const { getCollection } = collectionPageSelectors

const { publishPlaylist } = cacheCollectionsActions

const getMessages = (isAlbum: boolean, isEarlyRelease: boolean) => ({
  title: isEarlyRelease ? 'Confirm Early Release' : 'Confirm Release',
  description: isAlbum
    ? isEarlyRelease
      ? `Do you want to release your album now? All scheduled tracks will become public, and your followers will be notified.`
      : `Are you sure you want to release this album? All hidden tracks will go public, and your followers will be notified.`
    : `Do you want to release your playlist now? Your followers will be notified.`,
  cancel: 'Go Back',
  publish: `Release My ${isAlbum ? 'Album' : 'Playlist'}`
})

type PublishConfirmationModalProps = Omit<ModalProps, 'children'> & {
  collectionId: number
}

export const PublishConfirmationModal = (
  props: PublishConfirmationModalProps
) => {
  const { collectionId, ...other } = props
  const { onClose } = other
  const dispatch = useDispatch()

  const { is_album, is_scheduled_release, playlist_contents } = useSelector(
    (state: CommonState) => getCollection(state, { id: collectionId })
  ) as Collection

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: tracks } = useGetTracksByIds({
    ids: playlist_contents.track_ids.map((track) => track.track),
    currentUserId
  })

  const isEarlyRelease = useMemo(() => {
    const isEachTrackScheduled = tracks?.every(
      (track) => track.is_unlisted && track.is_scheduled_release
    )
    return !!(is_scheduled_release && isEachTrackScheduled)
  }, [is_scheduled_release, tracks])

  const handlePublish = useCallback(() => {
    dispatch(publishPlaylist(collectionId, undefined, is_album))
    onClose()
  }, [dispatch, collectionId, is_album, onClose])

  const messages = getMessages(is_album, isEarlyRelease)

  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconRocket />} />
      </ModalHeader>
      <ModalContent>
        <Flex justifyContent='center'>
          <Text size='l' textAlign='center'>
            {messages.description}
          </Text>
        </Flex>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.cancel}
        </Button>
        <Button
          variant='primary'
          iconLeft={IconRocket}
          onClick={handlePublish}
          fullWidth
        >
          {messages.publish}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
