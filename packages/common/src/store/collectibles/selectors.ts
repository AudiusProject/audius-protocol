import { createSelector } from 'reselect'

import { removeNullable } from '~/utils/typeUtils'

import {
  Chain,
  Collectible,
  EthCollectionMap,
  ID,
  SolCollectionMap
} from '../../models'
import { getUserId } from '../account/selectors'
import { CommonState } from '../commonStore'

export const getAllUserCollectibles = (state: CommonState) =>
  state.collectibles.userCollectibles

export const getUserCollectibles = (state: CommonState, props: { id: ID }) =>
  state.collectibles.userCollectibles[props.id]

export const getSolCollections = (state: CommonState) =>
  state.collectibles.solCollections

export const getHasUnsupportedCollection = (state: CommonState) =>
  state.collectibles.hasUnsupportedCollection

const defaultCollectibles = { [Chain.Eth]: [], [Chain.Sol]: [] }

export const getSupportedUserCollections = createSelector(
  getUserId,
  getAllUserCollectibles,
  getSolCollections,
  (accountUserId, allUserCollectibles, solCollections) => {
    const getCollectionMintAddress = (collectible: Collectible) => {
      if (collectible.heliusCollection) {
        return collectible.heliusCollection.address
      }
      const key = collectible.solanaChainMetadata?.collection?.key
      if (!key) return null
      return typeof key === 'string' ? key : key.toBase58()
    }

    const findExternalLink = (mint: string) => {
      const solCollectibles = collectibles[Chain.Sol] ?? []
      const matchingCollectibles = solCollectibles.filter(
        (collectible) => getCollectionMintAddress(collectible) === mint
      )
      const collectibleWithLink = matchingCollectibles.find(
        (collectible) => !!collectible.externalLink
      )
      return collectibleWithLink?.externalLink ?? null
    }

    const collectibles = accountUserId
      ? (allUserCollectibles[accountUserId] ?? defaultCollectibles)
      : defaultCollectibles

    const isLoading =
      !accountUserId ||
      !allUserCollectibles[accountUserId] ||
      collectibles[Chain.Eth] === undefined ||
      collectibles[Chain.Sol] === undefined

    // Ethereum collections
    const ethCollectionMap: EthCollectionMap = {}
    const userEthCollectibles = collectibles[Chain.Eth] ?? []
    userEthCollectibles.forEach((collectible) => {
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
    const userSolCollectibles = collectibles[Chain.Sol] ?? []
    const validSolCollectionMints = [
      ...new Set(
        userSolCollectibles
          .filter(
            (collectible: Collectible) =>
              !!collectible.heliusCollection ||
              !!collectible.solanaChainMetadata?.collection?.verified
          )
          .map(getCollectionMintAddress)
          .filter(removeNullable)
      )
    ]
    validSolCollectionMints.forEach((mint) => {
      const { data, imageUrl } = solCollections[mint] ?? {}
      if (!data?.name || solCollectionMap[mint]) return
      solCollectionMap[mint] = {
        name: data.name.replaceAll('\x00', ''),
        img: imageUrl ?? null,
        externalLink: findExternalLink(mint)
      }
    })

    // Collection images
    const collectionImageMap: { [address: string]: string } = {}
    Object.keys(ethCollectionMap).forEach((slug) => {
      const image = ethCollectionMap[slug].img
      if (image) {
        collectionImageMap[slug] = image
      }
    })
    Object.keys(solCollectionMap).forEach((mint) => {
      const image = solCollectionMap[mint].img
      if (image) {
        collectionImageMap[mint] = image
      }
    })

    return { isLoading, ethCollectionMap, solCollectionMap, collectionImageMap }
  }
)
