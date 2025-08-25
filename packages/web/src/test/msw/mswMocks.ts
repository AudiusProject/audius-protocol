import { User } from '@audius/common/models'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'

import { mockData } from './mockData'

const { apiEndpoint } = developmentConfig.network

type MockData = ReturnType<typeof mockData>

export const userMswMocks = (user: User, data: MockData['users']) => [
  http.get(`${apiEndpoint}/v1/full/users/handle/${user.handle}`, () => {
    return HttpResponse.json(data.userByHandle)
  }),
  http.get(`${apiEndpoint}/v1/users/${user.user_id}/connected_wallets`, () => {
    return HttpResponse.json(data.connected_wallets)
  }),
  http.get(`${apiEndpoint}/v1/users/${user.user_id}/collectibles`, () => {
    return HttpResponse.json(data.collectibles)
  }),
  http.get(`${apiEndpoint}/v1/full/users/${user.user_id}/supporting`, () => {
    return HttpResponse.json(data.supporting)
  }),
  http.get(`${apiEndpoint}/v1/full/users/${user.user_id}/supporters`, () => {
    return HttpResponse.json(data.supporters)
  }),
  http.get(`${apiEndpoint}/v1/full/users/${user.user_id}/related`, () => {
    return HttpResponse.json(data.related)
  })
]

export const nftMswMocks = () => [
  // ETH NFTs api
  http.get(
    'https://rinkeby-api.opensea.io/api/v2/chain/ethereum/account/0x123/nfts',
    () => {
      return HttpResponse.json({ data: [] })
    }
  )
]

export const eventMswMocks = (data: MockData['events']) => [
  http.get(`${apiEndpoint}/v1/events/entity`, () => {
    return HttpResponse.json(data)
  })
]
