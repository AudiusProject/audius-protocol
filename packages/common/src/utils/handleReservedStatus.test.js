import { parseHandleReservedStatusFromSocial } from './handleReservedStatus'

describe('verifiedChecker', () => {
  it('works for an unverified user that is not reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when twitter request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: null,
      lookedUpInstagramUser: {
        is_verified: false
      }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when instagram request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when both request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: null,
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: 'hannibalburess',
      lookedUpTwitterUser: true,
      lookedUpInstagramUser: { verified: true },
      lookedUpTikTokUser: { is_verified: true }
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when twitter request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: null,
      lookedUpInstagramUser: { is_verified: true }
    })

    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when instagram request fails', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: { verified: true },
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when twitter and instagram say not verified. this should not happen.', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: true,
      lookedUpTwitterUser: { verified: false },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('notReserved')
  })

  it('shows that a matching twitter handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: true },
      lookedUpInstagramUser: { is_verified: false }
    })
    expect(status).toEqual('twitterReserved')
  })

  it('shows that a matching instagram handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: false },
      lookedUpInstagramUser: { is_verified: true }
    })
    expect(status).toEqual('instagramReserved')
  })

  it('shows that a matching twitter or instagram handle is reserved', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: { verified: true },
      lookedUpInstagramUser: { is_verified: true }
    })
    expect(status).toEqual(
      expect.stringMatching(/instagramReserved|twitterReserved/)
    )
  })

  it('shows that we can claim a verified handle if both requests fail', () => {
    const status = parseHandleReservedStatusFromSocial({
      isOauthVerified: false,
      lookedUpTwitterUser: null,
      lookedUpInstagramUser: null
    })
    expect(status).toEqual('notReserved')
  })
})
