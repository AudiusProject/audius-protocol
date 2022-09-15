import type { Credentials as TikTokCredentials } from '@audius/common'

export type InstagramCredentials = {
  code: string
}

export type TwitterCredentials = {
  oauthVerifier: string
  oauthToken: string
}

// Expand this type as more types of oauth are done on the native side
export type Credentials = (
  | TikTokCredentials
  | InstagramCredentials
  | TwitterCredentials
) & {
  error?: string
}

export const AUTH_RESPONSE_MESSAGE_TYPE = 'auth-response' as const
