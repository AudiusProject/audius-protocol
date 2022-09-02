import {
  SupporterResponse,
  SupportingResponse
} from 'services/audius-api-client'

import { UserTip } from '../../models'

import { AudiusBackend } from './AudiusBackend'

export const TIPPING_SUPPORT_DEFAULT_LIMIT = 25

export type SupportRequest = {
  encodedUserId: string
  limit?: number
  offset?: number
  audiusBackendInstance: AudiusBackend
}
export const fetchSupporting = async ({
  encodedUserId,
  limit = TIPPING_SUPPORT_DEFAULT_LIMIT,
  offset = 0,
  audiusBackendInstance
}: SupportRequest): Promise<SupportingResponse[]> => {
  try {
    const audiusLibs = await audiusBackendInstance.getAudiusLibs()
    const response = await audiusLibs.discoveryProvider._makeRequest({
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
  offset = 0,
  audiusBackendInstance
}: SupportRequest): Promise<SupporterResponse[]> => {
  try {
    const audiusLibs = await audiusBackendInstance.getAudiusLibs()
    const response = await audiusLibs.discoveryProvider._makeRequest({
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
  audiusBackendInstance: AudiusBackend
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
  txSignatures,
  audiusBackendInstance
}: UserTipRequest): Promise<UserTipResponse[]> => {
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
    const audiusLibs = await audiusBackendInstance.getAudiusLibs()
    const response = await audiusLibs.discoveryProvider._makeRequest({
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
