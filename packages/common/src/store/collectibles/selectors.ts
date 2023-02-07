import { createSelector } from 'reselect'
import { getUserId } from '../account/selectors'
import { Chain, Collectible, EthCollectionMap, ID, SolCollectionMap } from '../../models'
import { CommonState } from '../commonStore'

export const getAllUserCollectibles = (state: CommonState) =>
  state.collectibles.userCollectibles

export const getUserCollectibles = (state: CommonState, props: { id: ID }) =>
  state.collectibles.userCollectibles[props.id]

export const getSolCollections = (state: CommonState) =>
  state.collectibles.solCollections

const defaultCollectibles = { [Chain.Eth]: [], [Chain.Sol]: [] }

export const getVerifiedUserCollections = createSelector(
  getUserId,
  getAllUserCollectibles,
  getSolCollections,
  (accountUserId, allUserCollectibles, solCollections) => {
    const collectibles = accountUserId ? allUserCollectibles[accountUserId] ?? defaultCollectibles : defaultCollectibles

    // Ethereum collections
    const ethCollectionMap: EthCollectionMap = {}
    collectibles[Chain.Eth].forEach((collectible) => {
      const {
        collectionSlug,
        collectionName,
        collectionImageUrl,
        assetContractAddress,
        standard,
        externalLink
      } = collectible
      if (
        !collectionName ||
        !collectionSlug ||
        !assetContractAddress ||
        !standard ||
        ethCollectionMap[collectionSlug]
      ) {
        return
      }
      ethCollectionMap[collectionSlug] = {
        name: collectionName,
        img: collectionImageUrl,
        address: assetContractAddress,
        standard,
        externalLink
      }
    })

    // Solana collections
    const solCollectionMap: SolCollectionMap = {}
    const validSolCollectionMints = [
      ...new Set(
        (collectibles[Chain.Sol] ?? [])
          .filter(
            (collectible: Collectible) =>
              !!collectible.solanaChainMetadata?.collection?.verified
          )
          .map((collectible: Collectible) => {
            const key = collectible.solanaChainMetadata!.collection!.key
            return typeof key === 'string' ? key : key.toBase58()
          })
      )
    ]
    validSolCollectionMints.forEach((mint) => {
      const { data, imageUrl } = solCollections[mint] ?? {}
      if (!data?.name || solCollectionMap[data.name]) return
      solCollectionMap[mint] = {
        name: data.name.replaceAll('\x00', ''),
        img: imageUrl ?? null,
        externalLink: null
      }
    })

    // Collection images
    const collectionImageMap: { [address: string]: string } = {}
    Object.keys(ethCollectionMap).forEach((slug) => {
      if (ethCollectionMap[slug].img) {
        collectionImageMap[slug] = ethCollectionMap[slug].img!
      }
    })
    Object.keys(solCollectionMap).forEach((mint) => {
      if (solCollectionMap[mint].img) {
        collectionImageMap[mint] = solCollectionMap[mint].img!
      }
    })

    return { ethCollectionMap, solCollectionMap, collectionImageMap }
  }
)
