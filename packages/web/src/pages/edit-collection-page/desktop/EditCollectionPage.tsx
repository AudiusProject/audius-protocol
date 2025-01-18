import {
  useCollectionByPermalink,
  useUpdateCollection
} from '@audius/common/api'
import { Name, SquareSizes } from '@audius/common/models'
import { CollectionValues } from '@audius/common/schemas'
import {
  EditCollectionValues,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { isEqual } from 'lodash'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'
import { useRouteMatch } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { EditCollectionForm } from 'components/edit-collection/EditCollectionForm'
import { Header } from 'components/header/desktop/Header'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import Page from 'components/page/Page'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useIsUnauthorizedForHandleRedirect } from 'hooks/useManagedAccountNotAllowedRedirect'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { track } from 'services/analytics'
import { replace } from 'utils/navigation'
import { useSelector } from 'utils/reducer'

import { updatePlaylistContents } from '../utils'

const { getCollection } = cacheCollectionsSelectors

type EditCollectionPageParams = {
  handle: string
  slug: string
}

const messages = {
  title: (isAlbum: boolean) => `Edit Your ${isAlbum ? 'Album' : 'Playlist'}`
}

export const EditCollectionPage = () => {
  const { handle, slug } = useParams<EditCollectionPageParams>()
  const isAlbum = Boolean(useRouteMatch('/:handle/album/:slug/edit'))
  const [searchParams] = useSearchParams()
  const focus = searchParams.get('focus')
  const permalink = `/${handle}/${isAlbum ? 'album' : 'playlist'}/${slug}`
  const dispatch = useDispatch()
  useRequiresAccount()
  useIsUnauthorizedForHandleRedirect(handle)

  const {
    data: apiCollection,
    isError,
    isPending
  } = useCollectionByPermalink(permalink)

  const localCollection = useSelector((state) =>
    getCollection(state, { permalink })
  )

  const { mutate: updateCollection } = useUpdateCollection()

  const collection = isError ? localCollection : apiCollection

  const { playlist_id, tracks, description } = collection ?? {}

  const artworkUrl = useCollectionCoverArt({
    collectionId: playlist_id,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const initialValues = {
    ...collection,
    description: description ?? undefined,
    artwork: { url: artworkUrl! },
    tracks: tracks?.map((track) => ({ metadata: track })) ?? [],
    isUpload: false
  } as CollectionValues

  const handleSubmit = (values: CollectionValues) => {
    const { playlist_contents, tracks, ...restValues } = values

    track({
      eventName: Name.COLLECTION_EDIT,
      properties: {
        id: playlist_id
      }
    })

    // We want to pay special attention to access condition changes
    if (!isEqual(values.stream_conditions, initialValues.stream_conditions)) {
      track({
        eventName: Name.COLLECTION_EDIT_ACCESS_CHANGED,
        properties: {
          id: playlist_id,
          from: initialValues.stream_conditions,
          to: values.stream_conditions
        }
      })
    }

    const updatedPlaylistContents = updatePlaylistContents(
      tracks,
      playlist_contents
    )

    const collection = {
      playlist_contents: updatedPlaylistContents,
      ...restValues
    }

    if (playlist_id) {
      updateCollection({
        collectionId: playlist_id,
        userId: playlist_id,
        metadata: collection as EditCollectionValues
      })
    }

    dispatch(replace(permalink))
  }

  return (
    <Page header={<Header primary={messages.title(isAlbum)} showBackButton />}>
      {isPending || !artworkUrl ? (
        <LoadingSpinnerFullPage />
      ) : (
        <EditCollectionForm
          isAlbum={isAlbum}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isUpload={false}
          focus={focus}
        />
      )}
    </Page>
  )
}
