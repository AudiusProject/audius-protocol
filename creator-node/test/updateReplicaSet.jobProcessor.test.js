/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const nock = require('nock')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const {
  SyncType,
  RECONFIG_MODES,
  QUEUE_NAMES,
  SYNC_MODES
} = require('../src/services/stateMachineManager/stateMachineConstants')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const { expect } = chai

describe('test updateReplicaSet job processor', function () {
  let server, sandbox, originalContentNodeEndpoint, logger

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
    config.set('spID', 1)
    originalContentNodeEndpoint = config.get('creatorNodeEndpoint')
    config.set('creatorNodeEndpoint', primary)
    logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }
    nock.disableNetConnect()
  })

  afterEach(async function () {
    await server.close()
    sandbox.restore()
    config.set('creatorNodeEndpoint', originalContentNodeEndpoint)
    logger = null
    nock.cleanAll()
    nock.enableNetConnect()
  })

  const primary = 'http://primary_cn.co'
  const secondary1 = 'http://secondary1.co'
  const secondary2 = 'http://secondary2.co'
  const fourthHealthyNode = 'http://healthy_cn4.co'
  const primarySpID = 1
  const secondary1SpID = 2
  const secondary2SpID = 3
  const fourthHealthyNodeSpID = 4
  const userId = 1
  const wallet = '0x123456789'

  const DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP = {
    [primary]: primarySpID,
    [secondary1]: secondary1SpID,
    [secondary2]: secondary2SpID,
    [fourthHealthyNode]: fourthHealthyNodeSpID
  }

  function getJobProcessorStub({
    healthyNodes,
    getNewOrExistingSyncReqStub,
    retrieveClockValueForUserFromReplicaStub,
    maxSelectNewReplicaSetAttempts = 100,
    cNodeEndpointToSpIdMap = DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP
  }) {
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .returns(cNodeEndpointToSpIdMap)
    const updateReplicaSetStub = sandbox.stub().resolves()
    const autoSelectCreatorNodesStub = sandbox
      .stub()
      .resolves({ services: healthyNodes })
    const audiusLibsStub = {
      ServiceProvider: {
        autoSelectCreatorNodes: autoSelectCreatorNodesStub
      },
      contracts: {
        UserReplicaSetManagerClient: {
          updateReplicaSet: updateReplicaSetStub,
          _updateReplicaSet: updateReplicaSetStub
        }
      }
    }
    return proxyquire(
      '../src/services/stateMachineManager/stateReconciliation/updateReplicaSet.jobProcessor.ts',
      {
        '../../../config': config,
        '../../initAudiusLibs': sandbox.stub().resolves(audiusLibsStub),
        './stateReconciliationUtils': {
          getNewOrExistingSyncReq: getNewOrExistingSyncReqStub
        },
        '../stateMachineUtils': {
          retrieveClockValueForUserFromReplica:
            retrieveClockValueForUserFromReplicaStub
        },
        '../stateMachineConstants': {
          SyncType,
          RECONFIG_MODES,
          MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS: maxSelectNewReplicaSetAttempts,
          QUEUE_NAMES
        },
        '../ContentNodeInfoManager': {
          getCNodeEndpointToSpIdMap: getCNodeEndpointToSpIdMapStub
        }
      }
    )
  }

  it('reconfigs one secondary when one secondary is unhealthy and reconfigs are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except secondary1
    const healthyNodes = {
      [primary]: '',
      [secondary2]: '',
      [fourthHealthyNode]: ''
    }

    // Mark secondary1 as unhealthy and fourthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [secondary1]
    const replicaToUserInfoMap = {
      [primary]: { clock: 1 },
      [secondary1]: { clock: 1 },
      [secondary2]: { clock: 1 },
      [fourthHealthyNode]: { clock: -1 }
    }

    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub
    })

    // Verify job outputs the correct results: update secondary1 to randomHealthyNode
    const jobOutput = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2,
      unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.ONE_SECONDARY.key]
    })

    expect(jobOutput.errorMsg).to.equal('')
    expect(jobOutput.issuedReconfig).to.be.true
    expect(jobOutput.newReplicaSet).to.deep.equal({
      newPrimary: primary,
      newSecondary1: secondary2,
      newSecondary2: fourthHealthyNode,
      issueReconfig: true,
      reconfigType: RECONFIG_MODES.ONE_SECONDARY.key
    })
    expect(jobOutput.healthyNodes).to.eql([
      primary,
      secondary2,
      fourthHealthyNode
    ])
    expect(jobOutput.jobsToEnqueue).to.deep.equal({
      [QUEUE_NAMES.RECURRING_SYNC]: [
        {
          primaryEndpoint: primary,
          secondaryEndpoint: secondary2,
          syncType: SyncType.Recurring,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
          userWallet: wallet
        },
        {
          primaryEndpoint: primary,
          secondaryEndpoint: fourthHealthyNode,
          syncType: SyncType.Recurring,
          syncMode: SYNC_MODES.SyncSecondaryFromPrimary,
          userWallet: wallet
        }
      ]
    })
  })

  it('reconfigs one secondary when one secondary is unhealthy but reconfigs are disabled', async function () {
    // It should short-circuit before trying to sync -- no sync will be needed
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('This was not supposed to be called')
    })

    // Stub audiusLibs to return all nodes as healthy except secondary1
    const healthyNodes = {
      [primary]: '',
      [secondary2]: '',
      [fourthHealthyNode]: ''
    }

    // Mark secondary1 as unhealthy and fourthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [secondary1]
    const replicaToUserInfoMap = {
      [primary]: { clock: 1 },
      [secondary1]: { clock: 1 },
      [secondary2]: { clock: 1 },
      [fourthHealthyNode]: { clock: -1 }
    }

    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub
    })

    const jobOutput = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2,
      unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.RECONFIG_DISABLED.key] // Disable reconfigs
    })

    // Verify job outputs the correct results: entire replica set is falsy because we can't sync if all nodes in the RS are unhealthy
    expect(jobOutput.errorMsg).to.equal('')
    expect(jobOutput.issuedReconfig).to.be.false
    expect(jobOutput.newReplicaSet).to.deep.equal({
      newPrimary: primary,
      newSecondary1: secondary2,
      newSecondary2: fourthHealthyNode,
      issueReconfig: false,
      reconfigType: RECONFIG_MODES.ONE_SECONDARY.key
    })
    expect(jobOutput.healthyNodes).to.eql([
      primary,
      secondary2,
      fourthHealthyNode
    ])
    expect(jobOutput.jobsToEnqueue).to.not.exist
  })

  it('returns falsy replica set when the whole replica set is unhealthy', async function () {
    // It should short-circuit before trying to sync -- no sync will be needed
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('This was not supposed to be called')
    })

    // Stub audiusLibs to return all nodes as healthy except secondary1
    const healthyNodes = {
      [primary]: '',
      [secondary2]: '',
      [fourthHealthyNode]: ''
    }

    // Mark all nodes in the replica set as unhealthy and fourthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [primary, secondary1, secondary2]
    const replicaToUserInfoMap = {
      [primary]: { clock: 1 },
      [secondary1]: { clock: 1 },
      [secondary2]: { clock: 1 },
      [fourthHealthyNode]: { clock: -1 }
    }

    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub
    })

    const jobOutput = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2,
      unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.ENTIRE_REPLICA_SET.key]
    })

    // Verify job outputs the correct results: entire replica set is falsy because we can't sync if all nodes in the RS are unhealthy
    expect(jobOutput.errorMsg).to.equal(
      `Error: [_selectRandomReplicaSetNodes] wallet=${wallet} healthyReplicaSet=[] numberOfUnhealthyReplicas=3 healthyNodes=${primary},${secondary2},${fourthHealthyNode} || Not enough healthy nodes found to issue new replica set after 100 attempts`
    )
    expect(jobOutput.issuedReconfig).to.be.false
    expect(jobOutput.newReplicaSet).to.deep.equal({
      newPrimary: null,
      newSecondary1: null,
      newSecondary2: null,
      issueReconfig: false,
      reconfigType: null
    })
    expect(jobOutput.healthyNodes).to.eql([
      primary,
      secondary2,
      fourthHealthyNode
    ])
    expect(jobOutput.jobsToEnqueue).to.not.exist
  })
})
