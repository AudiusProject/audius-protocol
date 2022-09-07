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
  const fifthHealthyNode = 'http://healthy_cn5.co'
  const primarySpID = 1
  const secondary1SpID = 2
  const secondary2SpID = 3
  const fourthHealthyNodeSpID = 4
  const fifthHealthyNodeSpID = 5
  const userId = 1
  const wallet = '0x123456789'

  const DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP = {
    [primary]: primarySpID,
    [secondary1]: secondary1SpID,
    [secondary2]: secondary2SpID,
    [fourthHealthyNode]: fourthHealthyNodeSpID,
    [fifthHealthyNode]: fifthHealthyNodeSpID
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

  it('reconfigs 1 secondary when 1 secondary is unhealthy and reconfigs are enabled', async function () {
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

    const output = await updateReplicaSetJobProcessor({
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

    const { metricsToRecord, ...rest } = output

    expect(metricsToRecord[0].metricLabels.result).to.equal('success')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: update secondary1 to randomHealthyNode
    expect(rest).to.be.deep.equal({
      errorMsg: '',
      issuedReconfig: true,
      newReplicaSet: {
        newPrimary: primary,
        newSecondary1: secondary2,
        newSecondary2: fourthHealthyNode,
        issueReconfig: true,
        reconfigType: RECONFIG_MODES.ONE_SECONDARY.key
      },
      healthyNodes: [primary, secondary2, fourthHealthyNode],
      jobsToEnqueue: {
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
      }
    })
  })

  it('reconfigs 2 secondaries when 2 secondaries are unhealthy and reconfigs are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except secondary1 and secondary2
    const healthyNodes = {
      [primary]: '',
      [fourthHealthyNode]: '',
      [fifthHealthyNode]: ''
    }

    // Mark secondary1+secondary2 as unhealthy and fourthHealthyNode+fifthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [secondary1, secondary2]
    const replicaToUserInfoMap = {
      [primary]: { clock: 1 },
      [secondary1]: { clock: 1 },
      [secondary2]: { clock: 1 },
      [fourthHealthyNode]: { clock: -1 },
      [fifthHealthyNode]: { clock: -1 }
    }

    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub
    })

    const output = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2,
      unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.MULTIPLE_SECONDARIES.key]
    })
    const { metricsToRecord, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: update secondary1+secondary2 to healthy nodes
    expect(output.errorMsg).to.equal('')
    expect(output.issuedReconfig).to.be.true
    expect(newReplicaSet.newPrimary).to.equal(primary)
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(newReplicaSet.issueReconfig).to.be.true
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.MULTIPLE_SECONDARIES.key
    )
    expect(output.healthyNodes).to.eql([
      primary,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(jobsToEnqueue).to.have.nested.property(QUEUE_NAMES.RECURRING_SYNC)
    const jobs = jobsToEnqueue[QUEUE_NAMES.RECURRING_SYNC]
    expect(jobs).to.have.lengthOf(2)
    // Verify sync from primary to new secondary1 and new secondary2
    for (let i = 0; i < 1; i++) {
      expect(jobs[i].primaryEndpoint).to.equal(primary)
      expect(jobs[i].secondaryEndpoint).to.be.oneOf([
        fourthHealthyNode,
        fifthHealthyNode
      ])
      expect(jobs[i].syncType).to.equal(SyncType.Recurring)
      expect(jobs[i].syncMode).to.equal(SYNC_MODES.SyncSecondaryFromPrimary)
      expect(jobs[i].userWallet).to.equal(wallet)
    }
  })

  it('reconfigs 2 secondaries when 1 secondaries is unhealthy, the other secondary was deregistered, and reconfigs are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except secondary1 and secondary2
    const healthyNodes = {
      [primary]: '',
      [fourthHealthyNode]: '',
      [fifthHealthyNode]: ''
    }

    // Mark secondary1 as unhealthy and fourthHealthyNode+fifthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [secondary1]
    const replicaToUserInfoMap = {
      [primary]: { clock: 1 },
      [secondary1]: { clock: 1 },
      [secondary2]: { clock: 1 },
      [fourthHealthyNode]: { clock: -1 },
      [fifthHealthyNode]: { clock: -1 }
    }

    // Mark secondary2 as deregistered (no SP ID in the mapping)
    const { [secondary2]: _, spIdMapWithoutSecondary2 } =
      DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP
    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub,
      cNodeEndpointToSpIdMap: spIdMapWithoutSecondary2
    })

    const output = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2: '', // Make secondary2 be unhealthy empty because it was deregistered (this is what happens in prod)
      unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.MULTIPLE_SECONDARIES.key]
    })
    const { metricsToRecord, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: update secondary1+secondary2 to healthy nodes
    expect(output.errorMsg).to.equal('')
    expect(output.issuedReconfig).to.be.true
    expect(newReplicaSet.newPrimary).to.equal(primary)
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(newReplicaSet.issueReconfig).to.be.true
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.MULTIPLE_SECONDARIES.key
    )
    expect(output.healthyNodes).to.eql([
      primary,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(jobsToEnqueue).to.have.nested.property(QUEUE_NAMES.RECURRING_SYNC)
    const jobs = jobsToEnqueue[QUEUE_NAMES.RECURRING_SYNC]
    expect(jobs).to.have.lengthOf(2)
    // Verify sync from primary to new secondary1 and new secondary2
    for (let i = 0; i < 1; i++) {
      expect(jobs[i].primaryEndpoint).to.equal(primary)
      expect(jobs[i].secondaryEndpoint).to.be.oneOf([
        fourthHealthyNode,
        fifthHealthyNode
      ])
      expect(jobs[i].syncType).to.equal(SyncType.Recurring)
      expect(jobs[i].syncMode).to.equal(SYNC_MODES.SyncSecondaryFromPrimary)
      expect(jobs[i].userWallet).to.equal(wallet)
    }
  })

  it('reconfigs 1 secondary when one secondary is unhealthy but reconfigs are disabled', async function () {
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

    const output = await updateReplicaSetJobProcessor({
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

    const { metricsToRecord, ...rest } = output

    expect(metricsToRecord[0].metricLabels.result).to.equal(
      'success_issue_reconfig_disabled'
    )
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: find update from secondary1 to randomHealthyNode but don't issue it
    expect(rest).to.be.deep.equal({
      errorMsg: '',
      issuedReconfig: false,
      newReplicaSet: {
        newPrimary: primary,
        newSecondary1: secondary2,
        newSecondary2: fourthHealthyNode,
        issueReconfig: false,
        reconfigType: RECONFIG_MODES.ONE_SECONDARY.key
      },
      healthyNodes: [primary, secondary2, fourthHealthyNode],
      jobsToEnqueue: undefined
    })
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

    const output = await updateReplicaSetJobProcessor({
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

    const { metricsToRecord, ...rest } = output

    expect(metricsToRecord[0].metricLabels.result).to.equal(
      'failure_determine_new_replica_set'
    )
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: entire replica set is falsy because we can't sync if all nodes in the RS are unhealthy
    expect(rest).to.be.deep.equal({
      errorMsg: `Error: [_selectRandomReplicaSetNodes] wallet=${wallet} healthyReplicaSet=[] numberOfUnhealthyReplicas=3 numberOfEmptyReplicas=0 healthyNodes=${primary},${secondary2},${fourthHealthyNode} || Not enough healthy nodes found to issue new replica set after 100 attempts`,
      issuedReconfig: false,
      newReplicaSet: {
        newPrimary: null,
        newSecondary1: null,
        newSecondary2: null,
        issueReconfig: false,
        reconfigType: null
      },
      healthyNodes: [primary, secondary2, fourthHealthyNode],
      jobsToEnqueue: undefined
    })
  })
})
