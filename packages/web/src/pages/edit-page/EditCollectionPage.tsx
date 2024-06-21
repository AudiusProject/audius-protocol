import { createContext, useState } from 'react'

import {
  useGetCurrentUserId,
  useGetPlaylistByPermalink
} from '@audius/common/api'
import { SquareSizes, Status, CollectionMetadata } from '@audius/common/models'
import {
  CollectionMetadataForUpload,
  EditPlaylistValues,
  cacheCollectionsActions
} from '@audius/common/store'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { DeleteConfirmationModal } from 'components/delete-confirmation'
import Header from 'components/header/desktop/Header'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import Page from 'components/page/Page'
import { useCollectionCoverArt2 } from 'hooks/useCollectionCoverArt'
import { EditCollectionForm } from 'components/edit-collection/desktop/EditCollectionForm'
import { CollectionEditFormValues } from '@audius/common/schemas'

const { editPlaylist, deletePlaylist } = cacheCollectionsActions

const messages = {
  title: 'Edit Your Collection',
  deleteCollection: 'DELETE COLLECTION'
}

type EditPageProps = {
  scrollToTop: () => void
}

export const EditFormScrollContext = createContext(() => {})

// This component is in development, only used behind the EDIT_COLLECTION_REDESIGN feature flag
export const EditCollectionPage = (props: EditPageProps) => {
  const { scrollToTop } = props
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const dispatch = useDispatch()

  const { data: currentUserId } = useGetCurrentUserId({})
  const permalink = `/${handle}/${slug}`
  const { data: collection, status: collectionStatus } =
    useGetPlaylistByPermalink({
      permalink,
      currentUserId
    })
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const onSubmit = (
    formValues: EditPlaylistValues | CollectionEditFormValues
  ) => {
    if ('trackDetails' in formValues) {
      return
    }
    const metadata = { ...formValues }
    if (!metadata.artwork?.file) {
      metadata.artwork = null
    }
    dispatch(editPlaylist(metadata.playlist_id!, metadata))
    dispatch(pushRoute(metadata.permalink))
  }

  const onDeleteCollection = () => {
    if (!collection) return
    dispatch(deletePlaylist(collection.playlist_id))
    setShowDeleteConfirmation(false)
  }

  const coverArtUrl = useCollectionCoverArt2(
    collection?.playlist_id,
    SquareSizes.SIZE_1000_BY_1000
  )

  const collectionAsMetadataForUpload: EditPlaylistValues = {
    ...(collection as CollectionMetadata),
    artwork: {
      url: coverArtUrl || ''
    }
  }

  const initialValues: EditPlaylistValues = collectionAsMetadataForUpload

  return (
    <Page
      title={messages.title}
      header={<Header primary={messages.title} showBackButton />}
    >
      {collectionStatus !== Status.SUCCESS || !coverArtUrl ? (
        <LoadingSpinnerFullPage />
      ) : (
        <EditFormScrollContext.Provider value={scrollToTop}>
          <EditCollectionForm
            initialValues={initialValues}
            onSubmit={onSubmit}
            isAlbum={collection?.is_album}
          />
        </EditFormScrollContext.Provider>
      )}
      <DeleteConfirmationModal
        title={messages.deleteCollection}
        entity='Collection'
        visible={showDeleteConfirmation}
        onDelete={onDeleteCollection}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </Page>
  )
}
