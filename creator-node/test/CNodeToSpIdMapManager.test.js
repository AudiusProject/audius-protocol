const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const CNodeToSpIdMapManager = require('../src/services/stateMachineManager/CNodeToSpIdMapManager')

describe('test CNodeToSpIdMapManager', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('replaces existing mapping when ethContracts is successful', async function () {
    // Set the existing/old mapping that should later be replaced
    CNodeToSpIdMapManager.cNodeEndpointToSpIdMap = {
      'http://old_cn1.co': 'oldSpId'
    }

    // Create content nodes that will be used to make new mapping
    const contentNodes = [
      {
        endpoint: 'http://cn1.co',
        spID: 1
      },
      {
        endpoint: 'http://cn5.co',
        spID: 100
      }
    ]
    const expectedNewMapping = {
      'http://cn1.co': 1,
      'http://cn5.co': 100
    }

    // Mock ethContracts to return the content nodes that will be used to build the new mapping
    const getServiceProviderListStub = sandbox.stub().resolves(contentNodes)
    const ethContracts = {
      getServiceProviderList: getServiceProviderListStub
    }

    // Verify that CNodeToSpIdMapManager's mapping is set to the new mapping
    await CNodeToSpIdMapManager.updateCnodeEndpointToSpIdMap(ethContracts)
    expect(CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()).to.deep.equal(
      expectedNewMapping
    )
  })

  it("doesn't replace existing mapping when new mapping is empty", async function () {
    // Set the existing mapping that should NOT be replaced later
    const originalCNodeEndpointToSpIdMap = {
      'http://old_cn1.co': 'oldSpId'
    }
    CNodeToSpIdMapManager.cNodeEndpointToSpIdMap =
      originalCNodeEndpointToSpIdMap

    // Mock ethContracts to return an empty array of content nodes
    const getServiceProviderListStub = sandbox.stub().resolves([])
    const ethContracts = {
      getServiceProviderList: getServiceProviderListStub
    }

    // Verify that CNodeToSpIdMapManager's mapping was NOT replaced with the empty mapping
    await CNodeToSpIdMapManager.updateCnodeEndpointToSpIdMap(ethContracts)
    expect(CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()).to.deep.equal(
      originalCNodeEndpointToSpIdMap
    )
  })

  it("doesn't replace existing mapping when ethContracts throws", async function () {
    // Set the existing mapping that should NOT be replaced later
    const originalCNodeEndpointToSpIdMap = {
      'http://old_cn1.co': 'oldSpId'
    }
    CNodeToSpIdMapManager.cNodeEndpointToSpIdMap =
      originalCNodeEndpointToSpIdMap

    // Mock ethContracts to return an empty array of content nodes
    const getServiceProviderListStub = sandbox.stub().rejects()
    const ethContracts = {
      getServiceProviderList: getServiceProviderListStub
    }

    // Verify that CNodeToSpIdMapManager's mapping is set to the new mapping
    await CNodeToSpIdMapManager.updateCnodeEndpointToSpIdMap(ethContracts)
    expect(CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()).to.deep.equal(
      originalCNodeEndpointToSpIdMap
    )
  })

  it('throws when the existing and new mapping are both empty', async function () {
    // Set the existing mapping that should NOT be replaced later
    CNodeToSpIdMapManager.cNodeEndpointToSpIdMap = {}

    // Mock ethContracts to return an empty array of content nodes
    const getServiceProviderListStub = sandbox.stub().resolves([])
    const ethContracts = {
      getServiceProviderList: getServiceProviderListStub
    }

    // Verify that CNodeToSpIdMapManager throws because its mapping is empty
    return expect(
      CNodeToSpIdMapManager.updateCnodeEndpointToSpIdMap(ethContracts)
    )
      .to.eventually.be.rejectedWith(
        'CNodeToSpIdMapManager - Unable to initialize cNodeEndpointToSpIdMap'
      )
      .and.be.an.instanceOf(Error)
  })
})
