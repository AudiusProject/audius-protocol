import type { Credentials as TikTokCredentials } from '@audius/common/hooks'

export type InstagramCredentials = {
  code: string
}

export type TwitterCredentials = {
  oauthVerifier: string
  oauthToken: string
}

export type Credentials = (
  | TikTokCredentials
  | InstagramCredentials
  | TwitterCredentials
) & {
  error?: string
}

export const AUTH_RESPONSE_MESSAGE_TYPE = 'auth-response' as const
