import { checkHandle } from './verifiedChecker'

describe('verifiedChecker', () => {
  it('works for an unverified user that is not reserved', () => {
    const status = checkHandle(
      false,
      { verified: false },
      { is_verified: false }
    )
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when twitter request fails', () => {
    const status = checkHandle(false, null, {
      is_verified: false
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when instagram request fails', () => {
    const status = checkHandle(false, { verified: false }, null)
    expect(status).toEqual('notReserved')
  })

  it('works for an unverified user when both request fails', () => {
    const status = checkHandle(false, null, null)
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user', () => {
    const status = checkHandle(
      'hannibalburess',
      true,
      { verified: true },
      { is_verified: true }
    )
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when twitter request fails', () => {
    const status = checkHandle(true, null, {
      is_verified: true
    })
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when instagram request fails', () => {
    const status = checkHandle(true, { verified: true }, null)
    expect(status).toEqual('notReserved')
  })

  it('works for an oauth verified user when twitter and instagram say not verified. this should not happen.', () => {
    const status = checkHandle(
      true,
      { verified: false },
      { is_verified: false }
    )
    expect(status).toEqual('notReserved')
  })

  it('shows that a matching twitter handle is reserved', () => {
    const status = checkHandle(
      false,
      { verified: true },
      { is_verified: false }
    )
    expect(status).toEqual('twitterReserved')
  })

  it('shows that a matching instagram handle is reserved', () => {
    const status = checkHandle(
      false,
      { verified: false },
      { is_verified: true }
    )
    expect(status).toEqual('instagramReserved')
  })

  it('shows that a matching twitter or instagram handle is reserved', () => {
    const status = checkHandle(false, { verified: true }, { is_verified: true })
    expect(status).toEqual(
      expect.stringMatching(/instagramReserved|twitterReserved/)
    )
  })

  it('shows that we can claim a verified handle if both requests fail', () => {
    const status = checkHandle(false, null, null)
    expect(status).toEqual('notReserved')
  })
})
