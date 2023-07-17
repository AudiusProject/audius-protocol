/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const proxyquire = require('proxyquire')

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
          libs: {
            CreatorNode: {
              getClockValue: getClockValueStub
            }
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
          libs: {
            CreatorNode: {
              getClockValue: getClockValueStub
            }
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
