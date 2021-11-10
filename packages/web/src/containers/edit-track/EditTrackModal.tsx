import React, { useEffect, useState } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { StemCategory } from 'common/models/Stems'
import { Track } from 'common/models/Track'
import * as cacheTrackActions from 'common/store/cache/tracks/actions'
import { removeNullable } from 'common/utils/typeUtils'
import { uuid } from 'common/utils/uid'
import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'
import {
  StemUploadWithFile,
  dropdownRows
} from 'components/source-files-modal/SourceFilesModal'
import EditTrackModalComponent from 'components/track/EditTrackModal'
import { processFiles } from 'containers/upload-page/store/utils/processFiles'
import * as editTrackModalActions from 'store/application/ui/editTrackModal/actions'
import {
  getMetadata,
  getIsOpen,
  getStems
} from 'store/application/ui/editTrackModal/selectors'
import { getCurrentUploads } from 'store/application/ui/stemsUpload/selectors'
import { startStemUploads } from 'store/application/ui/stemsUpload/slice'
import { AppState } from 'store/types'
import { FEED_PAGE, getPathname } from 'utils/route'

const messages = {
  deleteTrack: 'DELETE TRACK'
}

type OwnProps = {}

type EditTrackModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const EditTrackModal = ({
  isOpen,
  metadata,
  onEdit,
  onDelete,
  close,
  goToRoute,
  history,
  stems,
  uploadStems,
  currentUploads
}: EditTrackModalProps) => {
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
    onEdit(metadata.track_id, formFields)
    if (pendingUploads.length) {
      uploadStems(metadata.track_id, pendingUploads)
      setPendingUploads([])
    }
    if (pendingDeletes.length) {
      pendingDeletes.forEach(id => onDelete(id))
      setPendingDeletes([])
    }
    close()
  }
  const onSelectDelete = () => {
    setShowDeleteConfirmation(true)
  }

  // Cleanup after ourselves if we cancel
  const onCancel = () => {
    setPendingUploads([])
    setPendingDeletes([])
    close()
  }

  const onDeleteTrack = () => {
    if (!metadata) return
    onDelete(metadata.track_id)
    setShowDeleteConfirmation(false)
    close()
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
    stems.filter(s => !pendingDeletes.includes(s.track_id))

  const onSelectStemCategory = (category: StemCategory, stemIndex: number) => {
    setPendingUploads(u => {
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
    const processed = (
      await Promise.all(processFiles(selectedStems, false, () => {}))
    )
      .filter(removeNullable)
      .map(p => ({
        ...p,
        allowDelete: true,
        allowCategorySwitch: true,
        category: dropdownRows[0]
      }))

    setPendingUploads(s => [...s, ...processed])
  }

  const { combinedStems, onDeleteStem } = (() => {
    // Filter out pending deletes from the existing stems
    const existingStems = getStemsFilteringPendingDeletes().map(s => ({
      metadata: s,
      category: s.stem_of.category,
      allowDelete: true,
      allowCategorySwitch: false
    }))

    const uploadingStems = currentUploads.map(s => ({
      metadata: s.metadata,
      category: s.category,
      allowDelete: false,
      allowCategorySwitch: false
    }))

    const pendingStems = pendingUploads.map(u => ({
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
        setPendingDeletes(s => [...s, id])
      } else {
        // If it's a pending stem, delete it from local state
        const indexToDelete = index - existingStems.length
        setPendingUploads(s => {
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
        showUnlistedToggle={metadata ? metadata.is_unlisted : false}
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

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  const metadata = getMetadata(state)
  return {
    metadata,
    isOpen: getIsOpen(state),
    stems: getStems(state),
    currentUploads: metadata?.track_id
      ? getCurrentUploads(state, metadata.track_id)
      : []
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    onEdit: (trackId: ID, formFields: any) =>
      dispatch(cacheTrackActions.editTrack(trackId, formFields)),
    onDelete: (trackId: ID) => dispatch(cacheTrackActions.deleteTrack(trackId)),
    close: () => dispatch(editTrackModalActions.close()),
    uploadStems: (parentId: ID, uploads: StemUploadWithFile[]) =>
      dispatch(startStemUploads({ parentId, uploads, batchUID: uuid() }))
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(EditTrackModal)
)
