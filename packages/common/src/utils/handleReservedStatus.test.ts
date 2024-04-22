import { describe, it, expect } from 'vitest'

import { parseHandleReservedStatusFromSocial } from './handleReservedStatus'

describe('verifiedChecker', () => {
  it('works for an unverified user that is not reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpTikTokUser: { verified: false },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when twitter request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: null,
      lookedUpTikTokUser: { verified: false },
      lookedUpInstagramUser: {
        is_verified: false
      }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when instagram request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTikTokUser: { verified: false },
      lookedUpTwitterUser: { verified: false },
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when tik tok request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpTikTokUser: null,
      lookedUpInstagramUser: {
        is_verified: false
      }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when all requests fail', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: null,
      lookedUpTikTokUser: null,
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: { verified: true },
      lookedUpInstagramUser: { is_verified: true },
      lookedUpTikTokUser: { verified: true }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when twitter request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: null,
      lookedUpInstagramUser: { is_verified: true },
      lookedUpTikTokUser: { verified: true }
    })

    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when instagram request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: { verified: true },
      lookedUpInstagramUser: null,
      lookedUpTikTokUser: { verified: true }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when tik tok request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: { verified: true },
      lookedUpInstagramUser: { is_verified: true },
      lookedUpTikTokUser: null
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when all apps say not verified. this should not happen.', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: { verified: false },
      lookedUpTikTokUser: { verified: false },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('notReserved')
  })

  it('shows that a matching twitter handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: true },
      lookedUpTikTokUser: { verified: false },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('twitterReserved')
  })

  it('shows that a matching instagram handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpTikTokUser: { verified: false },
      lookedUpInstagramUser: { is_verified: true }
    })
    expect(status).toEqual('instagramReserved')
  })

  it('shows that a matching tik tok handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpTikTokUser: { verified: true },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('tikTokReserved')
  })

  it('shows that a matching twitter, tik tok, or instagram handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: true },
      lookedUpTikTokUser: { verified: true },
      lookedUpInstagramUser: { is_verified: true }
    })
    expect(status).toEqual(
      expect.stringMatching(/instagramReserved|twitterReserved|tikTokReserved/)
    )
  })

  it('shows that we can claim a verified handle if all requests fail', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: null,
      lookedUpTikTokUser: null,
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })
})
