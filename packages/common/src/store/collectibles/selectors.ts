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
      ? allUserCollectibles[accountUserId] ?? defaultCollectibles
      : defaultCollectibles

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
    const validSolCollectionMints = [
      ...new Set(
        (collectibles[Chain.Sol] ?? [])
          .filter(
            (collectible: Collectible) =>
              !!collectible.solanaChainMetadata?.collection?.verified
          )
          .map(getCollectionMintAddress)
          .filter(removeNullable)
      )
    ]
    validSolCollectionMints.forEach((mint) => {
      const { data, imageUrl } = solCollections[mint] ?? {}
      if (!data?.name || solCollectionMap[data.name]) return
      solCollectionMap[mint] = {
        name: data.name.replaceAll('\x00', ''),
        img: imageUrl ?? null,
        externalLink: findExternalLink(mint)
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
