import { UserTip, SupporterResponse, SupportingResponse } from '@audius/common'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

export const TIPPING_SUPPORT_DEFAULT_LIMIT = 25

// @ts-ignore
const libs = () => window.audiusLibs

export type SupportRequest = {
  encodedUserId: string
  limit?: number
  offset?: number
}
export const fetchSupporting = async ({
  encodedUserId,
  limit = TIPPING_SUPPORT_DEFAULT_LIMIT,
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
  limit = TIPPING_SUPPORT_DEFAULT_LIMIT,
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

export type UserTipRequest = {
  userId?: string
  limit?: number
  offset?: number
  receiverMinFollowers?: number
  receiverIsVerified?: boolean
  currentUserFollows?: 'sender' | 'receiver' | 'sender_or_receiver'
  uniqueBy?: 'sender' | 'receiver'
  minSlot?: number
  maxSlot?: number
  txSignatures?: string[]
}
type UserTipOmitIds = 'sender_id' | 'receiver_id' | 'followee_supporter_ids'
type UserTipResponse = Omit<UserTip, UserTipOmitIds> & {
  sender: any
  receiver: any
  followee_supporters: any[]
}

export const fetchRecentUserTips = async ({
  userId,
  limit,
  offset,
  receiverMinFollowers,
  receiverIsVerified,
  currentUserFollows,
  uniqueBy,
  minSlot,
  maxSlot,
  txSignatures
}: UserTipRequest): Promise<UserTipResponse[]> => {
  await waitForLibsInit()
  const queryParams = {
    user_id: userId,
    limit,
    offset,
    receiver_min_followers: receiverMinFollowers,
    receiver_is_verififed: receiverIsVerified,
    current_user_follows: currentUserFollows,
    unique_by: uniqueBy,
    min_slot: minSlot,
    max_slot: maxSlot,
    tx_signatures: txSignatures
  }
  try {
    const response = await libs().discoveryProvider._makeRequest({
      endpoint: `/v1/full/tips`,
      queryParams
    })
    return response
  } catch (e) {
    console.error(
      `Could not fetch recent tips for ${JSON.stringify(
        queryParams,
        null,
        2
      )}. Error: ${(e as Error).message}`
    )
    return []
  }
}
