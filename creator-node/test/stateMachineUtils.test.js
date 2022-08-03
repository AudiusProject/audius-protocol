/* eslint-disable no-unused-expressions */
const nock = require('nock')
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')

const config = require('../src/config')

describe('test retrieveUserInfoFromReplicaSet()', function () {
  beforeEach(function () {
    nock.disableNetConnect()
  })

  afterEach(function () {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('returns expected user info and updates unhealthyPeers', async function () {
    const healthyCn1 = 'http://healthyCn1.co'
    const healthyCn2 = 'http://healthyCn2.co'
    const unhealthyCn = 'http://unhealthyCn.co'
    const replicaToWalletMap = {
      [healthyCn1]: ['wallet1', 'wallet2', 'wallet3', 'wallet4', 'wallet5'],
      [healthyCn2]: ['wallet1', 'wallet2'],
      [unhealthyCn]: ['wallet1', 'wallet2']
    }
    const expectedreplicaToAllUserInfoMaps = {
      [healthyCn1]: {
        wallet1: { clock: 1, filesHash: '0x1' },
        wallet2: { clock: 2, filesHash: '0x2' },
        wallet3: { clock: 3, filesHash: '0x3' },
        wallet4: { clock: 4, filesHash: '0x4' },
        wallet5: { clock: 5, filesHash: '0x5' }
      },
      [healthyCn2]: {
        wallet1: { clock: 1, filesHash: '0x1' },
        wallet2: { clock: 2, filesHash: '0x2' }
      },
      [unhealthyCn]: {}
    }

    // Mock the axios requests for healthy Content Nodes to return clock values
    nock(healthyCn1)
      .post('/users/batch_clock_status')
      .query(
        (queryObj) =>
          'returnFilesHash' in queryObj && queryObj.returnFilesHash === 'true'
      )
      .times(3) // 3 times because there are 5 wallets and the batch size is 2 wallets per request
      .reply(200, function (uri, requestBody) {
        const { walletPublicKeys } = requestBody
        return {
          data: {
            users: walletPublicKeys.map((wallet) => {
              return {
                walletPublicKey: wallet,
                ...expectedreplicaToAllUserInfoMaps[healthyCn1][wallet]
              }
            })
          }
        }
      })
    nock(healthyCn2)
      .post('/users/batch_clock_status')
      .query(
        (queryObj) =>
          'returnFilesHash' in queryObj && queryObj.returnFilesHash === 'true'
      )
      .reply(200, function (uri, requestBody) {
        const { walletPublicKeys } = requestBody
        return {
          data: {
            users: walletPublicKeys.map((wallet) => {
              return {
                walletPublicKey: wallet,
                ...expectedreplicaToAllUserInfoMaps[healthyCn2][wallet]
              }
            })
          }
        }
      })

    // Mock the axios request to the unhealthy Content Node to return an error
    nock(unhealthyCn)
      .post('/users/batch_clock_status')
      .query(
        (queryObj) =>
          'returnFilesHash' in queryObj && queryObj.returnFilesHash === 'true'
      )
      .times(2) // It retries the failure once
      .reply(500)

    // Mock retrieveUserInfoFromReplicaSet to have our desired config and constants
    config.set('maxBatchClockStatusBatchSize', 2)
    const { retrieveUserInfoFromReplicaSet } = proxyquire(
      '../src/services/stateMachineManager/stateMachineUtils.js',
      {
        '../../config': config,
        './stateMachineConstants': {
          MAX_USER_BATCH_CLOCK_FETCH_RETRIES: 1,
          BATCH_CLOCK_STATUS_REQUEST_TIMEOUT: 1000
        }
      }
    )

    const { replicaToAllUserInfoMaps, unhealthyPeers } =
      await retrieveUserInfoFromReplicaSet(replicaToWalletMap)

    // Verify that all mocked endpoints were been hit the expected number of times
    expect(nock.isDone()).to.be.true

    // Verify that each wallet had the expected clock value and the unhealthy node was marked as unhealthy
    expect(Object.keys(replicaToAllUserInfoMaps)).to.have.lengthOf(3)
    expect(replicaToAllUserInfoMaps).to.deep.equal(
      expectedreplicaToAllUserInfoMaps
    )
    expect(unhealthyPeers).to.have.property('size', 1)
    expect(unhealthyPeers).to.include('http://unhealthyCn.co')
  })
})

describe('test retrieveClockValueForUserFromReplica()', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('returns expected clock value when successful', async function () {
    const replica = 'http://healthyCn.co'
    const wallet = '0x123456789'

    // Get stubbed function with a CreatorNode dependency that returns a dummy clock value
    const expectedClockValue = 12345
    const getClockValueStub = sandbox.stub().resolves(expectedClockValue)
    const { retrieveClockValueForUserFromReplica } = proxyquire(
      '../src/services/stateMachineManager/stateMachineUtils.js',
      {
        '@audius/sdk': {
          CreatorNode: {
            getClockValue: getClockValueStub
          }
        }
      }
    )

    // Verify that the function returns the dummy clock value
    return expect(
      retrieveClockValueForUserFromReplica(replica, wallet)
    ).to.eventually.be.fulfilled.and.to.equal(expectedClockValue)
  })

  it('throws when CreatorNode throws', async function () {
    const replica = 'http://healthyCn.co'
    const wallet = '0x123456789'

    // Get stubbed function with a CreatorNode dependency that returns a dummy clock value
    const expectedError = new Error('test error')
    const getClockValueStub = sandbox.stub().rejects(expectedError)
    const { retrieveClockValueForUserFromReplica } = proxyquire(
      '../src/services/stateMachineManager/stateMachineUtils.js',
      {
        '@audius/sdk': {
          CreatorNode: {
            getClockValue: getClockValueStub
          }
        }
      }
    )

    // Verify that the function returns the dummy clock value
    return expect(
      retrieveClockValueForUserFromReplica(replica, wallet)
    ).to.eventually.be.rejectedWith(expectedError)
  })
})
