import { useEffect, useState } from 'react'

import {
  Collection,
  CollectionMetadata,
  SquareSizes,
  DeepNullable,
  Nullable,
  newCollectionMetadata
} from '@audius/common'

import Input from 'components/data-entry/Input'
import TextArea from 'components/data-entry/TextArea'
import UploadArtwork from 'components/upload/UploadArtwork'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { resizeImage } from 'utils/imageProcessingUtil'

import { CreateActions, EditActions } from './FormActions'
import styles from './PlaylistForm.module.css'

const messages = {
  editPlaylistButtonText: 'Save Changes',
  cancelButtonText: 'Cancel',
  deletePlaylistButtonText: 'Delete Playlist',
  deleteAlbumButtonText: 'Delete Album',
  createPlaylistButtonText: 'Create Playlist'
}

export type PlaylistFormFields = Partial<Collection> & {
  artwork: {
    file: Blob
    url: string
    source: 'unsplash' | 'original'
    error?: string
  }
  is_current: boolean
  mood: Nullable<string>
  created_at: Nullable<string>
  tags: Nullable<string>
  genre: Nullable<string>
  isAlbum: boolean
} & DeepNullable<
    Pick<
      CollectionMetadata,
      | 'is_private'
      | 'updated_at'
      | 'cover_art'
      | 'cover_art_sizes'
      | 'playlist_name'
      | 'playlist_owner_id'
      | 'save_count'
      | 'upc'
      | 'description'
    >
  >

type PlaylistFormProps = {
  metadata?: Nullable<Collection>
  isAlbum?: boolean
  onOpenArtworkPopup?: () => void
  onCloseArtworkPopup?: () => void
  isEditMode?: boolean
  /** Only applies to edit mode */
  onDelete?: () => void
  /** Only applies to edit mode */
  onCancel?: () => void
  onSave: (formFields: PlaylistFormFields) => void
}

const PlaylistForm = ({
  isAlbum = false,
  metadata,
  onSave: onSaveParent,
  onCancel,
  onDelete,
  onOpenArtworkPopup,
  onCloseArtworkPopup,
  isEditMode = false
}: PlaylistFormProps) => {
  const [formFields, setFormFields] = useState<PlaylistFormFields>({
    artwork: {},
    ...newCollectionMetadata(metadata)
  })
  const [errors, setErrors] = useState({
    playlistName: false,
    artwork: false
  })
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const coverArt = useCollectionCoverArt(
    formFields.playlist_id,
    formFields?._cover_art_sizes ? formFields._cover_art_sizes : null,
    SquareSizes.SIZE_1000_BY_1000
  )

  // On receiving new, defined metadata, update the form fields
  useEffect(() => {
    if (metadata) {
      setFormFields((oldFormFields) => ({
        ...newCollectionMetadata(metadata),
        artwork: oldFormFields.artwork,
        playlist_name: oldFormFields.playlist_name,
        description: oldFormFields.description
      }))
    }
  }, [metadata])

  const onDropArtwork = async (selectedFiles: any, source: any) => {
    setErrors({
      ...errors,
      artwork: false
    })
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      setFormFields((formFields: PlaylistFormFields) => ({
        ...formFields,
        artwork: { file, url, source }
      }))
    } catch (err) {
      setFormFields((formFields: PlaylistFormFields) => ({
        ...formFields,
        artwork: {
          ...(formFields.artwork || {}),
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }))
    }
  }

  const onChangePlaylistName = (name: string) => {
    setFormFields((formFields: PlaylistFormFields) => ({
      ...formFields,
      playlist_name: name
    }))
    if (name) {
      setErrors({ ...errors, playlistName: false })
    }
  }

  const onChangeDescription = (description: string) => {
    setFormFields((formFields: PlaylistFormFields) => ({
      ...formFields,
      description
    }))
  }

  const onSave = () => {
    const nameIsEmpty = !formFields.playlist_name
    const artworkIsEmpty = !formFields.artwork.file && !coverArt
    if (nameIsEmpty || artworkIsEmpty) {
      setErrors({
        ...errors,
        artwork: artworkIsEmpty,
        playlistName: nameIsEmpty
      })
    } else {
      setHasSubmitted(true)
      onSaveParent(formFields)
    }
  }

  return (
    <div>
      <div className={styles.playlistForm}>
        <UploadArtwork
          artworkUrl={formFields.artwork.url || coverArt}
          onDropArtwork={onDropArtwork}
          error={errors.artwork}
          imageProcessingError={Boolean(formFields.artwork.error)}
          onOpenPopup={onOpenArtworkPopup}
          onClosePopup={onCloseArtworkPopup}
        />
        <div className={styles.form}>
          <Input
            variant='elevatedPlaceholder'
            placeholder={`${isAlbum ? 'Album' : 'Playlist'} Name`}
            defaultValue={formFields.playlist_name || ''}
            error={errors.playlistName}
            onChange={onChangePlaylistName}
            characterLimit={64}
          />
          <TextArea
            className={styles.description}
            placeholder='Description'
            onChange={onChangeDescription}
            defaultValue={formFields.description || ''}
          />
        </div>
      </div>
      <div className={styles.actionsWrapper}>
        {isEditMode ? (
          <EditActions
            deleteText={
              isAlbum
                ? messages.deleteAlbumButtonText
                : messages.deletePlaylistButtonText
            }
            saveText={messages.editPlaylistButtonText}
            cancelText={messages.cancelButtonText}
            onCancel={onCancel}
            onDelete={onDelete}
            onSave={onSave}
            disabled={hasSubmitted}
          />
        ) : (
          <CreateActions
            onSave={onSave}
            disabled={hasSubmitted}
            saveText={messages.createPlaylistButtonText}
          />
        )}
      </div>
    </div>
  )
}

export default PlaylistForm
