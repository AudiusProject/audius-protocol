import { Supporter, Supporting } from 'common/models/Tipping'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

const LIMIT = 25

// @ts-ignore
const libs = () => window.audiusLibs

type SupportingResponse = Omit<Supporter, 'receiver_id'> & { receiver: any }
type SupporterResponse = Omit<Supporting, 'sender_id'> & { sender: any }
type SupportRequest = {
  encodedUserId: string
  limit?: number
  offset?: number
}
export const fetchSupporting = async ({
  encodedUserId,
  limit = LIMIT,
  offset = 0
}: SupportRequest): Promise<SupportingResponse[]> => {
  try {
    await waitForLibsInit()
    const response = await libs().discoveryProvider._makeRequest({
      endpoint: `/v1/full/users/${encodedUserId}/supporting`,
      queryParams: { limit, offset }
    })
    return response
  } catch (e) {
    console.error(
      `Could not fetch supporting for encoded user id ${encodedUserId}: ${
        (e as Error).message
      }`
    )
    return []
  }
}

export const fetchSupporters = async ({
  encodedUserId,
  limit = LIMIT,
  offset = 0
}: SupportRequest): Promise<SupporterResponse[]> => {
  try {
    await waitForLibsInit()
    const response = await libs().discoveryProvider._makeRequest({
      endpoint: `/v1/full/users/${encodedUserId}/supporters`,
      queryParams: { limit, offset }
    })
    return response
  } catch (e) {
    console.error(
      `Could not fetch supporters for encoded user id ${encodedUserId}: ${
        (e as Error).message
      }`
    )
    return []
  }
}
