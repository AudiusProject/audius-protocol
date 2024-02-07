import { useEffect, useState } from 'react'

import {
  StemCategory,
  ID,
  StemUploadWithFile,
  Track
} from '@audius/common/models'
import {
  cacheTracksActions as cacheTrackActions,
  stemsUploadActions,
  stemsUploadSelectors,
  publishTrackConfirmationModalUIActions,
  editTrackModalSelectors,
  useEditTrackModal
} from '@audius/common/store'
import { Nullable, removeNullable, uuid } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { connect, useDispatch } from 'react-redux'
import { matchPath } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'
import EditTrackModalComponent from 'components/track/EditTrackModal'
import { processFiles } from 'pages/upload-page/store/utils/processFiles'
import { AppState } from 'store/types'
import { FEED_PAGE, getPathname } from 'utils/route'
import { stemDropdownRows } from 'utils/stems'
const { startStemUploads } = stemsUploadActions
const { getCurrentUploads } = stemsUploadSelectors
const { getMetadata, getStems } = editTrackModalSelectors
const { requestOpen: openPublishTrackConfirmationModal } =
  publishTrackConfirmationModalUIActions

const messages = {
  deleteTrack: 'DELETE TRACK'
}

type OwnProps = {}

type EditTrackModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const EditTrackModal = ({
  metadata,
  onEdit,
  onDelete,
  goToRoute,
  history,
  stems,
  uploadStems,
  currentUploads
}: EditTrackModalProps) => {
  const dispatch = useDispatch()
  const { isOpen, onClose } = useEditTrackModal()
  const [isModalOpen, setIsModalOpen] = useState(false)
  useEffect(() => {
    // Delay opening the modal until after we have track metadata as well
    if (isOpen && metadata) {
      setIsModalOpen(true)
    }
    if (!isOpen && isModalOpen) {
      setIsModalOpen(false)
    }
  }, [isOpen, metadata, isModalOpen])

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const [pendingUploads, setPendingUploads] = useState<StemUploadWithFile[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<ID[]>([])
  const onSaveEdit = (formFields: Track) => {
    if (!metadata) return

    const confirmEdit = (metadata: Track, formFields: Track) => {
      const isDownloadable = !!formFields.download?.is_downloadable
      const isDownloadGated = formFields.is_stream_gated
      const downloadConditions = formFields.stream_conditions
      const formFieldsToUpdate = {
        ...formFields,
        is_downloadable: isDownloadable,
        is_download_gated: isDownloadGated,
        download_conditions: downloadConditions
      }
      onEdit(metadata.track_id, formFieldsToUpdate)
      if (pendingUploads.length) {
        uploadStems(
          metadata.track_id,
          pendingUploads.map((stem) => ({
            ...stem,
            category: stem.category ?? StemCategory.OTHER
          }))
        )
        setPendingUploads([])
      }
      if (pendingDeletes.length) {
        pendingDeletes.forEach((id) => onDelete(id))
        setPendingDeletes([])
      }
      onClose()
    }

    if (metadata.is_unlisted === true && formFields.is_unlisted === false) {
      // confirm for unlisted -> listed
      dispatch(
        openPublishTrackConfirmationModal({
          confirmCallback: () => {
            confirmEdit(metadata, formFields)
          }
        })
      )
    } else {
      confirmEdit(metadata, formFields)
    }
  }
  const onSelectDelete = () => {
    setShowDeleteConfirmation(true)
  }

  // Cleanup after ourselves if we cancel
  const onCancel = () => {
    setPendingUploads([])
    setPendingDeletes([])
    onClose()
  }

  const onDeleteTrack = () => {
    if (!metadata) return
    onDelete(metadata.track_id)
    setShowDeleteConfirmation(false)
    onClose()
    const match = matchPath<{ name: string; handle: string }>(
      getPathname(history.location),
      {
        path: '/:handle/:name',
        exact: true
      }
    )
    if (match) {
      goToRoute(FEED_PAGE)
    }
  }

  const getStemsFilteringPendingDeletes = () =>
    stems.filter((s) => !pendingDeletes.includes(s.track_id))

  const onSelectStemCategory = (category: StemCategory, stemIndex: number) => {
    setPendingUploads((u) => {
      const newState = [...u]

      const pendingStemsLength = getStemsFilteringPendingDeletes().length
      const uploadingStemsLength = currentUploads.length
      // Have to take into account existing stems
      // in the edit modal
      const index = stemIndex - pendingStemsLength - uploadingStemsLength
      newState[index].category = category
      return newState
    })
  }

  const onAddStems = async (selectedStems: File[]) => {
    const detectCategory = (filename: string): Nullable<StemCategory> => {
      const lowerCaseFilename = filename.toLowerCase()
      return (
        stemDropdownRows.find((category) =>
          lowerCaseFilename.includes(category.toString().toLowerCase())
        ) ?? null
      )
    }
    const processedFiles = processFiles(selectedStems, () => {})
    const newStems = (await Promise.all(processedFiles))
      .filter(removeNullable)
      .map((processedFile) => {
        const category = detectCategory(processedFile.file.name)
        return {
          ...processedFile,
          category,
          allowDelete: true,
          allowCategorySwitch: true
        }
      })

    setPendingUploads((s) => [...s, ...newStems])
  }

  const { combinedStems, onDeleteStem } = (() => {
    // Filter out pending deletes from the existing stems
    const existingStems = getStemsFilteringPendingDeletes().map((s) => ({
      metadata: s,
      category: s.stem_of.category,
      allowDelete: true,
      allowCategorySwitch: false
    }))

    const uploadingStems = currentUploads.map((s) => ({
      metadata: s.metadata,
      category: s.category,
      allowDelete: false,
      allowCategorySwitch: false
    }))

    const pendingStems = pendingUploads.map((u) => ({
      metadata: u.metadata,
      category: u.category,
      allowCategorySwitch: true,
      allowDelete: true
    }))

    const combinedStems = [...existingStems, ...uploadingStems, ...pendingStems]

    const onDeleteStem = (index: number) => {
      if (index < existingStems.length) {
        // If it's an existing stem, set is as a pending delete
        const id = existingStems[index].metadata.track_id
        setPendingDeletes((s) => [...s, id])
      } else {
        // If it's a pending stem, delete it from local state
        const indexToDelete = index - existingStems.length
        setPendingUploads((s) => {
          const newState = [...s]
          newState.splice(indexToDelete, 1)
          return newState
        })
      }
    }

    return { combinedStems, onDeleteStem }
  })()

  return (
    <>
      <EditTrackModalComponent
        visible={isModalOpen}
        metadata={metadata}
        onSave={onSaveEdit}
        onDelete={onSelectDelete}
        onCancel={onCancel}
        showUnlistedToggle={
          metadata ? metadata.is_unlisted || metadata.is_stream_gated : false
        }
        stems={combinedStems}
        onDeleteStem={onDeleteStem}
        onSelectStemCategory={onSelectStemCategory}
        onAddStems={onAddStems}
      />
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

const noUploads: StemUploadWithFile[] = []

function mapStateToProps(state: AppState) {
  const metadata = getMetadata(state)
  return {
    metadata,
    stems: getStems(state),
    currentUploads: metadata?.track_id
      ? getCurrentUploads(state, metadata.track_id)
      : noUploads
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    onEdit: (trackId: ID, formFields: any) =>
      dispatch(cacheTrackActions.editTrack(trackId, formFields)),
    onDelete: (trackId: ID) => dispatch(cacheTrackActions.deleteTrack(trackId)),
    uploadStems: (parentId: ID, uploads: StemUploadWithFile[]) =>
      dispatch(startStemUploads({ parentId, uploads, batchUID: uuid() }))
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(EditTrackModal)
)
