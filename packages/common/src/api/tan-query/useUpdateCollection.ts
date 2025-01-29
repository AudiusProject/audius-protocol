import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import BN from 'bn.js'
import { isEqual } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { playlistMetadataForUpdateWithSDK } from '~/adapters/collection'
import { fileToSdk } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { isContentUSDCPurchaseGated } from '~/models'
import { Collection, UserCollectionMetadata } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { getAccountUser } from '~/store/account/selectors'
import { renameAccountPlaylist } from '~/store/account/slice'
import { EditCollectionValues } from '~/store/cache/collections/types'
import { updatePlaylistArtwork } from '~/utils/updatePlaylistArtwork'

import {
  getCollectionByPermalinkQueryKey,
  getCollectionQueryKey,
  useCurrentUserId
} from '..'

import { QUERY_KEYS } from './queryKeys'
import { primeCollectionData } from './utils/primeCollectionData'

type MutationContext = {
  previousCollection: UserCollectionMetadata | undefined
  collectionUpdate: EditCollectionValues
}

type UpdateCollectionParams = {
  collectionId: ID
  metadata: EditCollectionValues
}

// Constants for USDC conversion
const BN_USDC_CENT_WEI = new BN('10000')

export const useUpdateCollection = () => {
  const {
    audiusSdk,
    imageUtils: { generatePlaylistArtwork }
  } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const account = useSelector(getAccountUser)
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()

  return useMutation({
    mutationFn: async ({ collectionId, metadata }: UpdateCollectionParams) => {
      const sdk = await audiusSdk()

      if (!collectionId || !currentUserId) throw new Error('Invalid ID')

      const collectionUpdate = (await updatePlaylistArtwork(
        metadata,
        [],
        { updated: metadata.tracks },
        { generateImage: generatePlaylistArtwork }
      )) as EditCollectionValues

      const coverArtFile =
        collectionUpdate?.artwork?.url && 'file' in collectionUpdate.artwork
          ? (collectionUpdate.artwork.file as File)
          : undefined

      // Handle account collection shortcut update
      if (collectionUpdate?.playlist_name) {
        dispatch(
          renameAccountPlaylist({
            collectionId,
            name: collectionUpdate.playlist_name
          })
        )
      }

      // Handle premium metadata for albums
      if (
        collectionUpdate.is_album &&
        isContentUSDCPurchaseGated(collectionUpdate.stream_conditions)
      ) {
        const priceCents = Number(
          collectionUpdate.stream_conditions.usdc_purchase.price
        )
        const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()

        const wallet = account?.erc_wallet ?? account?.wallet
        if (!wallet) {
          throw new Error('No wallet found for user')
        }

        // Get the user's USDC bank address from the wallet
        const { userBank } =
          await sdk.services.claimableTokensClient.getOrCreateUserBank({
            ethWallet: wallet,
            mint: 'USDC'
          })
        const userBankStr = userBank.toString()

        // Update the stream conditions with the price and splits
        collectionUpdate.stream_conditions = {
          usdc_purchase: {
            price: priceCents,
            splits: {
              [userBankStr]: priceWei
            }
          }
        }
      }

      const sdkMetadata = playlistMetadataForUpdateWithSDK(
        collectionUpdate as Collection
      )

      const response = await sdk.playlists.updatePlaylist({
        coverArtFile: coverArtFile
          ? fileToSdk(coverArtFile, 'cover_art')
          : undefined,
        playlistId: Id.parse(collectionId),
        userId: Id.parse(currentUserId),
        metadata: sdkMetadata
      })

      // feature-tan-query TODO: Track publishing when making private collections public

      return response
    },
    onMutate: async ({
      collectionId,
      metadata
    }: UpdateCollectionParams): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: getCollectionQueryKey(collectionId)
      })

      // Snapshot the previous values
      const previousCollection =
        queryClient.getQueryData<UserCollectionMetadata>(
          getCollectionQueryKey(collectionId)
        )

      // Optimistically update collection
      const mergedCollection = { ...previousCollection, ...metadata }
      const collectionUpdate = (await updatePlaylistArtwork(
        mergedCollection,
        previousCollection?.tracks ?? [],
        { updated: mergedCollection.tracks },
        { generateImage: generatePlaylistArtwork }
      )) as EditCollectionValues

      // Optimistically update collectionByPermalink
      if (previousCollection) {
        queryClient.setQueryData(
          getCollectionByPermalinkQueryKey(previousCollection.permalink),
          (old: any) => ({
            ...old,
            ...metadata
            // TODO: add optimistic update for artwork
          })
        )
      }

      if (previousCollection) {
        primeCollectionData({
          collections: [{ ...previousCollection, ...metadata }],
          queryClient,
          dispatch,
          forceReplace: true
        })

        const previousTrackIds = previousCollection.tracks?.map(
          (track) => track.track_id
        )
        const updatedTrackIds = collectionUpdate.tracks?.map(
          (track) => track.track_id
        )
        if (!isEqual(previousTrackIds, updatedTrackIds)) {
          // feature-tan-query TODO: reset lineup on tracks changed
        }
      }

      // Return context with the previous collection
      return { previousCollection, collectionUpdate }
    },
    onError: (_err, { collectionId }, context?: MutationContext) => {
      // If the mutation fails, roll back collection data
      if (context?.previousCollection) {
        queryClient.setQueryData(
          getCollectionQueryKey(collectionId),
          context.previousCollection
        )
        queryClient.setQueryData(
          getCollectionByPermalinkQueryKey(
            context.previousCollection.permalink
          ),
          context.previousCollection
        )
      }
    },
    onSettled: (_, __, { collectionId }) => {
      // Always refetch after error or success to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
    }
  })
}
