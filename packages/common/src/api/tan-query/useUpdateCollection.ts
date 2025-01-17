import { OptionalId, Playlist } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { playlistMetadataForUpdateWithSDK } from '~/adapters/collection'
import { fileToSdk } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { isContentUSDCPurchaseGated } from '~/models'
import { Collection } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { getAccountUser } from '~/store/account/selectors'
import { renameAccountPlaylist } from '~/store/account/slice'

import { QUERY_KEYS } from './queryKeys'

type MutationContext = {
  previousCollection: Playlist | undefined
}

type UpdateCollectionParams = {
  collectionId: ID
  userId: ID
  metadata: Partial<Collection>
  coverArtFile?: File
}

// Constants for USDC conversion
const BN_USDC_CENT_WEI = new BN('10000')

export const useUpdateCollection = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const account = useSelector(getAccountUser)
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({
      collectionId,
      userId,
      metadata,
      coverArtFile
    }: UpdateCollectionParams) => {
      const sdk = await audiusSdk()

      const encodedCollectionId = OptionalId.parse(collectionId)
      const encodedUserId = OptionalId.parse(userId)
      if (!encodedCollectionId || !encodedUserId) throw new Error('Invalid ID')

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
        playlistId: encodedCollectionId,
        userId: encodedUserId,
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
    onMutate: async ({ collectionId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.collection, collectionId]
      })

      // Snapshot the previous values
      const previousCollection = queryClient.getQueryData<Playlist>([
        QUERY_KEYS.collection,
        collectionId
      ])

      // Optimistically update collection
      queryClient.setQueryData(
        [QUERY_KEYS.collection, collectionId],
        (old: any) => ({
          ...old,
          ...metadata
        })
      )

      // Optimistically update collectionByPermalink
      queryClient.setQueryData(
        [QUERY_KEYS.collectionByPermalink, metadata.permalink],
        (old: any) => ({
          ...old,
          ...metadata
        })
      )

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
