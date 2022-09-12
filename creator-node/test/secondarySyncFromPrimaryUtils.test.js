import { shouldForceResync } from '../src/services/sync/secondarySyncFromPrimaryUtils'

import assert from 'assert'
import proxyquire from 'proxyquire'

describe('test secondarySyncFromPrimaryUtils', function () {
  const mockedLibs = {
    contracts: { UserReplicaSetManagerClient: null },
    User: { getUsers: null }
  }
  const mockLogContext = { context: 'test' }

  it('if force resync configs are not passed it, will not force resync', async function () {
    assert.deepStrictEqual(
      await shouldForceResync({ libs: mockedLibs, logContext: mockLogContext }),
      false
    )
    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        null
      ),
      false
    )
  })

  it('if force resync configs are not proper, will not force resync', async function () {
    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {}
      ),
      false
    )
    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          signatureData: {
            data: 'theres data but no signing stuff'
          }
        }
      ),
      false
    )
    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          signatureData: {
            timestamp: 'theres a timestamp',
            signature: 'but not data'
          }
        }
      ),
      false
    )
  })

  it('if timestamp from data signature is over the ttl, do not force resync', async function () {
    const { shouldForceResync } = proxyquire(
      '../src/services/sync/secondarySyncFromPrimaryUtils',
      {
        '../../apiSigning': {
          recoverWallet: () => {
            return '0xcorrectprimarywallet'
          }
        },
        '../ContentNodeInfoManager': {
          getReplicaSetEndpointsByWallet: async () => {
            return { primary: 'primary' }
          },
          getContentNodeInfoFromEndpoint: async () => {
            return { delegateOwnerWallet: '0xCorrectPrimaryWallet' }
          }
        }
      }
    )

    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          // dummy signature data
          signatureData: {
            timestamp: '2022-08-02T21:38:42.670Z',
            signature:
              '0xf33f4f9bc242acbd68ecb2c624b132cb606a71c1747253709dcb205406e3bb256be30dde81b6574cec8771f6f68ab175c6d5bf8448664900a73b03efbe16d63c1c',
            data: { key: 'some data' }
          }
        }
      ),
      false
    )
  })

  it('if force resync configs does not recover the correct primary wallet, do not force resync', async function () {
    const { shouldForceResync } = proxyquire(
      '../src/services/sync/secondarySyncFromPrimaryUtils',
      {
        '../ContentNodeInfoManager': {
          getReplicaSetEndpointsByWallet: async () => {
            return { primary: 'primary' }
          },
          getContentNodeInfoFromEndpoint: async () => {
            return { delegateOwnerWallet: '0xCorrectPrimaryWallet' }
          }
        }
      }
    )

    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          // dummy signature data
          signatureData: {
            timestamp: '2022-08-02T21:38:42.670Z',
            signature:
              '0xf33f4f9bc242acbd68ecb2c624b132cb606a71c1747253709dcb205406e3bb256be30dde81b6574cec8771f6f68ab175c6d5bf8448664900a73b03efbe16d63c1c',
            data: { key: 'some data' }
          }
        }
      ),
      false
    )
  })

  it('if force resync configs fails to recover the wallet, do not force resync', async function () {
    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          // dummy signature data
          signatureData: {
            timestamp: '2022-08-02T21:38:42.670Z',
            signature:
              '0xf33f4f9bc242acbd68ecb2c624b132cb606a71c1747253709dcb205406e3bb256be30dde81b6574cec8771f6f68ab175c6d5bf8448664900a73b03efbe16d63c1c',
            data: { key: 'some data' }
          }
        }
      ),
      false
    )
  })

  it('if force resync configs recovers a different wallet, do not force resync', async function () {
    const { shouldForceResync } = proxyquire(
      '../src/services/sync/secondarySyncFromPrimaryUtils',
      {
        '../../apiSigning': {
          recoverWallet: () => {
            return '0xdifferentprimarywallet'
          },
          signatureHasExpired: () => {
            return false
          }
        },
        '../ContentNodeInfoManager': {
          getReplicaSetEndpointsByWallet: async () => {
            return { primary: 'primary' }
          },
          getContentNodeInfoFromEndpoint: async () => {
            return { delegateOwnerWallet: '0xCorrectPrimaryWallet' }
          }
        }
      }
    )

    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          // dummy signature data
          signatureData: {
            timestamp: '2022-08-02T21:38:42.670Z',
            signature:
              '0xf33f4f9bc242acbd68ecb2c624b132cb606a71c1747253709dcb205406e3bb256be30dde81b6574cec8771f6f68ab175c6d5bf8448664900a73b03efbe16d63c1c',
            data: { key: 'some data' }
          }
        }
      ),
      false
    )
  })

  it('if the recovered wallet is equal to the wallet on chain for the user primary spID, return true', async function () {
    const { shouldForceResync } = proxyquire(
      '../src/services/sync/secondarySyncFromPrimaryUtils',
      {
        '../../apiSigning': {
          recoverWallet: () => {
            return '0xcorrectprimarywallet'
          },
          signatureHasExpired: () => {
            return false
          }
        },
        '../ContentNodeInfoManager': {
          getReplicaSetEndpointsByWallet: async () => {
            return { primary: 'primary' }
          },
          getContentNodeInfoFromEndpoint: async () => {
            return { delegateOwnerWallet: '0xCorrectPrimaryWallet' }
          }
        }
      }
    )

    assert.deepStrictEqual(
      await shouldForceResync(
        { libs: mockedLibs, logContext: mockLogContext },
        {
          forceResync: true,
          // dummy signature data
          signatureData: {
            timestamp: '2022-08-02T21:38:42.670Z',
            signature:
              '0xf33f4f9bc242acbd68ecb2c624b132cb606a71c1747253709dcb205406e3bb256be30dde81b6574cec8771f6f68ab175c6d5bf8448664900a73b03efbe16d63c1c',
            data: { key: 'some data' }
          }
        }
      ),
      true
    )
  })
})
