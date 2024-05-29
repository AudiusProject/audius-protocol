import { useState } from 'react'

import { TrackMetadata } from '@audius/common/models'
import {
  TrackMetadataForUpload,
  editTrackModalSelectors,
  useEditTrackModal
} from '@audius/common/store'
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Modal,
  Flex,
  Button
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'

import { EditTrackForm } from './EditTrackForm'
import { TrackEditFormValues } from './types'

const { getMetadata } = editTrackModalSelectors

const messages = {
  title: 'Edit Track',
  deleteTrack: 'Delete Track'
}

export const EditTrackModalNew = () => {
  const { isOpen, onClose } = useEditTrackModal()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const metadata = useSelector(getMetadata)

  const onDeleteTrack = () => {
    // onDelete()
    setShowDeleteConfirmation(false)
  }

  const onSubmit = () => {
    window.alert('Submit')
    onClose()
  }

  const trackAsMetadataForUpload: TrackMetadataForUpload = {
    ...(metadata as TrackMetadata),
    artwork: {
      url: metadata?.cover_art || ''
    }
    // TODO: Add stems
  }

  const initialValues: TrackEditFormValues = {
    tracks: [
      {
        metadata: trackAsMetadataForUpload
      }
    ],
    trackMetadatas: [
      {
        ...trackAsMetadataForUpload,
        licenseType: {
          allowAttribution: false,
          commercialUse: false,
          derivativeWorks: false
        },
        remix_of: null
      }
    ],
    trackMetadatasIndex: 0
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='large'>
        <ModalHeader>
          <ModalTitle title={messages.title} />
        </ModalHeader>
        <ModalContent>
          <EditTrackForm
            initialValues={initialValues}
            onSubmit={() => {
              // onSubmit()
            }}
            hideContainer
          />
        </ModalContent>
        <ModalFooter>
          <Flex
            direction='row'
            w='100%'
            justifyContent='space-between'
            ph='m'
            pv='s'
          >
            <Button variant='destructive' onClick={onDeleteTrack}>
              Delete Track
            </Button>
            <Flex gap='xl'>
              <Button variant='secondary' onClick={onClose}>
                Cancel
              </Button>
              <Button variant='primary' onClick={onSubmit}>
                Save Changes
              </Button>
            </Flex>
          </Flex>
        </ModalFooter>
      </Modal>
      <DeleteConfirmationModal
        title={messages.deleteTrack}
        entity='Track'
        visible={showDeleteConfirmation}
        onDelete={onDeleteTrack}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </>
  )
}
