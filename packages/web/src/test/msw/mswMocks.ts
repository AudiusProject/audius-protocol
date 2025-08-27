import { Collectible, User } from '@audius/common/models'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'

import { mockArtistCoin } from 'test/mocks/fixtures/artistCoin'
import { artistUser } from 'test/mocks/fixtures/userPersonas'

const { apiEndpoint } = developmentConfig.network

/**
 *  User mocks
 */
// TODO: better user type here
export const mockUserByHandle = (user: typeof artistUser) => {
  return http.get(`${apiEndpoint}/v1/full/users/handle/${user.handle}`, () => {
    return HttpResponse.json({ data: [user] })
  })
}

export const mockUserCollectibles = (
  user: typeof artistUser,
  collectibles?: Collectible[]
) => {
  return http.get(`${apiEndpoint}/v1/users/${user.id}/collectibles`, () => {
    return HttpResponse.json({ data: collectibles ?? null })
  })
}

export const mockUserSupporting = (
  user: typeof artistUser,
  supportingUsers?: User[]
) => {
  return http.get(`${apiEndpoint}/v1/full/users/${user.id}/supporting`, () => {
    return HttpResponse.json({ data: supportingUsers ?? [] })
  })
}

export const mockUserSupporters = (
  user: typeof artistUser,
  supporterUsers?: User[]
) => {
  return http.get(`${apiEndpoint}/v1/full/users/${user.id}/supporters`, () => {
    return HttpResponse.json({ data: supporterUsers ?? [] })
  })
}

export const mockUserRelated = (
  user: typeof artistUser,
  relatedUsers?: User[]
) => {
  return http.get(`${apiEndpoint}/v1/full/users/${user.id}/related`, () => {
    return HttpResponse.json({ data: relatedUsers ?? [] })
  })
}

export const nftMswMocks = () => [
  // ETH NFTs api
  http.get(
    'https://rinkeby-api.opensea.io/api/v2/chain/ethereum/account/0x123/nfts',
    () => {
      return HttpResponse.json({ data: [] })
    }
  )
]

/**
 * Wallets
 */
export const mockUserConnectedWallets = (user: typeof artistUser) => {
  return http.get(
    `${apiEndpoint}/v1/users/${user.id}/connected_wallets`,
    () => {
      return HttpResponse.json({
        data: { erc_wallets: [], spl_wallets: [] }
      })
    }
  )
}

/**
 * Events
 */
export const eventMswMocks = (/* todo: */) => [
  http.get(`${apiEndpoint}/v1/events/entity`, () => {
    return HttpResponse.json({ data: [] })
  })
]

/**
 * Artist Coins
 */
export const artistCoinMswMocks = (coin: typeof mockArtistCoin) => [
  http.get(`${apiEndpoint}/v1/coins/${coin.mint}`, () => {
    return HttpResponse.json({ data: coin })
  })
]
