import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import BN from 'bn.js'
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

import { useCurrentUserId } from '..'

import { QUERY_KEYS } from './queryKeys'
import { primeCollectionData } from './utils/primeCollectionData'

type MutationContext = {
  previousCollection: UserCollectionMetadata | undefined
}

type UpdateCollectionParams = {
  collectionId: ID
  metadata: EditCollectionValues
}

// Constants for USDC conversion
const BN_USDC_CENT_WEI = new BN('10000')

export const useUpdateCollection = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const account = useSelector(getAccountUser)
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()

  return useMutation({
    mutationFn: async ({ collectionId, metadata }: UpdateCollectionParams) => {
      const sdk = await audiusSdk()

      if (!collectionId || !currentUserId) throw new Error('Invalid ID')

      const coverArtFile =
        metadata.artwork?.url && 'file' in metadata.artwork
          ? (metadata.artwork.file as File)
          : undefined

      // Handle account collection shortcut update
      if (metadata.playlist_name) {
        dispatch(
          renameAccountPlaylist({
            collectionId,
            name: metadata.playlist_name
          })
        )
      }

      // Handle premium metadata for albums
      if (
        metadata.is_album &&
        isContentUSDCPurchaseGated(metadata.stream_conditions)
      ) {
        const priceCents = Number(
          metadata.stream_conditions.usdc_purchase.price
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
        metadata.stream_conditions = {
          usdc_purchase: {
            price: priceCents,
            splits: {
              [userBankStr]: priceWei
            }
          }
        }
      }

      // TODO: updateCollectionArtwork requires imageUtils context from saga
      // This would need to be reimplemented or provided via context
      // For now, we'll just pass through the artwork as is

      const sdkMetadata = playlistMetadataForUpdateWithSDK(
        metadata as Collection
      )

      const response = await sdk.playlists.updatePlaylist({
        coverArtFile: coverArtFile
          ? fileToSdk(coverArtFile, 'cover_art')
          : undefined,
        playlistId: Id.parse(collectionId),
        userId: Id.parse(currentUserId),
        metadata: sdkMetadata
      })

      // TODO: Track publishing when making private collections public
      // This requires access to track data and dispatch capabilities
      // Consider adding a callback prop for this functionality
      // if (collectionBeforeEdit?.is_private && !collection.is_private) {
      //   Handle publishing tracks
      // }

      return response
    },
    onMutate: async ({
      collectionId,
      metadata
    }: UpdateCollectionParams): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.collection, collectionId]
      })

      // Snapshot the previous values
      const previousCollection =
        queryClient.getQueryData<UserCollectionMetadata>([
          QUERY_KEYS.collection,
          collectionId
        ])

      // Optimistically update collection

      // Optimistically update collectionByPermalink
      if (previousCollection) {
        queryClient.setQueryData(
          [QUERY_KEYS.collectionByPermalink, previousCollection.permalink],
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
      }

      // Return context with the previous collection
      return { previousCollection }
    },
    onError: (_err, { collectionId }, context?: MutationContext) => {
      // If the mutation fails, roll back collection data
      if (context?.previousCollection) {
        queryClient.setQueryData(
          [QUERY_KEYS.collection, collectionId],
          context.previousCollection
        )
        queryClient.setQueryData(
          [
            QUERY_KEYS.collectionByPermalink,
            context.previousCollection.permalink
          ],
          context.previousCollection
        )
      }
    },
    onSettled: (_, __) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
    }
  })
}
