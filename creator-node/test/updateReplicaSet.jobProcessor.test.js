/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const nock = require('nock')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const config = require('../src/config')
const { encode, decode } = require('../src/hashids')
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
    config.set('reconfigModePrimaryOnly', false)
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
    cNodeEndpointToSpIdMap = DEFAULT_CNODE_ENDOINT_TO_SP_ID_MAP,
    customConfig = config
  }) {
    const getCNodeEndpointToSpIdMapStub = sandbox
      .stub()
      .resolves(new Map(Object.entries(cNodeEndpointToSpIdMap)))
    const updateReplicaSetStub = sandbox.stub().resolves()
    const autoSelectCreatorNodesStub = sandbox
      .stub()
      .resolves({ services: healthyNodes })
    const _updateReplicaSet = sandbox
    .stub()
    .resolves({ blocknumber: 10 })

    const audiusLibsStub = {
      ServiceProvider: {
        autoSelectCreatorNodes: autoSelectCreatorNodesStub
      },
      User: {
        updateEntityManagerReplicaSet: _updateReplicaSet,
        waitForReplicaSetDiscoveryIndexing: sandbox.stub()
      },
      contracts: {
        UserReplicaSetManagerClient: {
          updateReplicaSet: updateReplicaSetStub,
          _updateReplicaSet
        }
      },
      Utils: {
        encodeHashId: sandbox
        .mock()
        .callsFake((id) => {
          return encode(id)
        })
      },
      discoveryProvider: {
        getUserReplicaSet: sandbox
        .mock()
        .callsFake(({ encodedUserId }) => {
          const user_id = decode(encodedUserId)
          return {
            user_id,
            "wallet": '0x123456789',
            "primary": 'http://mock-cn1.audius.co',
            "secondary1": 'http://mock-cn2.audius.co',
            "secondary2": 'http://mock-cn3.audius.co',
            "primarySpID": 1,
            "secondary1SpID": 2,
            "secondary2SpID": 3
          }
        })
      }
    }
    return proxyquire(
      '../src/services/stateMachineManager/stateReconciliation/updateReplicaSet.jobProcessor.ts',
      {
        '../../../config': customConfig,
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
        '../../ContentNodeInfoManager': {
          getMapOfCNodeEndpointToSpId: getCNodeEndpointToSpIdMapStub
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
      nodesToReconfigOffOf: unhealthyReplicas,
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
      nodesToReconfigOffOf: unhealthyReplicas,
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

  it('reconfigs primary when primary is unhealthy and all reconfigs are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except primary
    const healthyNodes = {
      [secondary1]: '',
      [secondary2]: '',
      [fourthHealthyNode]: '',
      [fifthHealthyNode]: ''
    }

    // Mark primary as unhealthy and fourthHealthyNode+fifthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [primary]
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
      nodesToReconfigOffOf: unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key]
    })
    const { metricsToRecord, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: replace primary with one of secondaries and elect new secondary
    expect(output.errorMsg).to.equal('')
    expect(output.issuedReconfig).to.be.true
    expect(newReplicaSet.newPrimary).to.be.oneOf([secondary1, secondary2])
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.be.oneOf([
      secondary1,
      secondary2
    ])
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(newReplicaSet.issueReconfig).to.be.true
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
    )
    expect(output.healthyNodes).to.eql([
      secondary1,
      secondary2,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    const newSecondaries = [newReplicaSet.newSecondary1, newReplicaSet.newSecondary2]
    expect(jobsToEnqueue).to.have.nested.property(QUEUE_NAMES.RECURRING_SYNC)
    const jobs = jobsToEnqueue[QUEUE_NAMES.RECURRING_SYNC]
    expect(jobs).to.have.lengthOf(2)
    // Verify sync from primary to new secondary1 and new secondary2
    for (let i = 0; i < 1; i++) {
      expect(jobs[i].primaryEndpoint).to.equal(newReplicaSet.newPrimary)
      expect(jobs[i].secondaryEndpoint).to.equal(newSecondaries[i])
      expect(jobs[i].syncType).to.equal(SyncType.Recurring)
      expect(jobs[i].syncMode).to.equal(SYNC_MODES.SyncSecondaryFromPrimary)
      expect(jobs[i].userWallet).to.equal(wallet)
    }
  })

  it('Reconfigs primary and 1 secondary when primary and 1 secondary are unhealthy and reconfigs are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except primary and secondary2
    const healthyNodes = {
      [secondary1]: '',
      [fourthHealthyNode]: '',
      [fifthHealthyNode]: ''
    }

    // Mark primary and secondary2 as unhealthy and fourthHealthyNode+fifthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [primary, secondary2]
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
      nodesToReconfigOffOf: unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key]
    })
    const { metricsToRecord, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: replace primary with one of secondaries and elect new secondary
    expect(output.errorMsg).to.equal('')
    expect(output.issuedReconfig).to.be.true
    expect(newReplicaSet.newPrimary).to.equal(secondary1)
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ]).and.not.equal(newReplicaSet.newSecondary1)
    expect(newReplicaSet.issueReconfig).to.be.true
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
    )
    expect(output.healthyNodes).to.eql([
      secondary1,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    const newSecondaries = [newReplicaSet.newSecondary1, newReplicaSet.newSecondary2]
    expect(jobsToEnqueue).to.have.nested.property(QUEUE_NAMES.RECURRING_SYNC)
    const jobs = jobsToEnqueue[QUEUE_NAMES.RECURRING_SYNC]
    expect(jobs).to.have.lengthOf(2)
    // Verify sync from primary to new secondary1 and new secondary2
    for (let i = 0; i < 1; i++) {
      expect(jobs[i].primaryEndpoint).to.equal(newReplicaSet.newPrimary)
      expect(jobs[i].secondaryEndpoint).to.equal(newSecondaries[i])
      expect(jobs[i].syncType).to.equal(SyncType.Recurring)
      expect(jobs[i].syncMode).to.equal(SYNC_MODES.SyncSecondaryFromPrimary)
      expect(jobs[i].userWallet).to.equal(wallet)
    }
  })

  it('Does not issue any reconfig when primary and 1 secondary are unhealthy and only secondary mode is enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except primary and secondary1
    const healthyNodes = {
      [secondary2]: '',
      [fourthHealthyNode]: '',
      [fifthHealthyNode]: ''
    }

    // Mark primary and secondary1 as unhealthy and fourthHealthyNode+fifthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [primary, secondary1]
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
      nodesToReconfigOffOf: unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.MULTIPLE_SECONDARIES.key]
    })
    const { metricsToRecord, errorMsg, issuedReconfig, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success_issue_reconfig_disabled')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: find update from primary to secondary1 and 2 new nodes selected, but not issued
    expect(errorMsg).to.equal('')
    expect(issuedReconfig).to.be.false
    expect(newReplicaSet.newPrimary).to.equal(secondary2)
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.be.oneOf([fourthHealthyNode, fifthHealthyNode])
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ]).and.not.equal(newReplicaSet.newSecondary1)
    expect(newReplicaSet.issueReconfig).to.be.false
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
    )
    expect(output.healthyNodes).to.eql([
      secondary2,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(jobsToEnqueue).to.equal(undefined)
  })

  it('Reconfigs primary when primary is unhealthy, primary only override is enabled, and all reconfig modes are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except primary and secondary2
    const healthyNodes = {
      [secondary1]: '',
      [secondary2]: '',
      [fourthHealthyNode]: '',
      [fifthHealthyNode]: ''
    }

    // Mark primary and secondary2 as unhealthy and fourthHealthyNode+fifthHealthyNode as not having any user state
    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(-1)
    const unhealthyReplicas = [primary]
    const replicaToUserInfoMap = {
      [primary]: { clock: 1 },
      [secondary1]: { clock: 1 },
      [secondary2]: { clock: 1 },
      [fourthHealthyNode]: { clock: -1 },
      [fifthHealthyNode]: { clock: -1 }
    }

    const customConfig = config
    customConfig.set('reconfigModePrimaryOnly', true)
    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub,
      customConfig
    })

    const output = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2,
      nodesToReconfigOffOf: unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key]
    })
    const { metricsToRecord, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: replace primary with one of secondaries and elect new secondary
    expect(output.errorMsg).to.equal('')
    expect(output.issuedReconfig).to.be.true
    expect(newReplicaSet.newPrimary).to.be.oneOf([secondary1, secondary2])
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.be.oneOf([
      secondary1,
      secondary2,
      fourthHealthyNode,
      fifthHealthyNode
    ]).and.not.equal(newReplicaSet.primary)
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      secondary2,
      fourthHealthyNode,
      fifthHealthyNode
    ]).and.not.equal(newReplicaSet.newSecondary1)
    expect(newReplicaSet.issueReconfig).to.be.true
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
    )
    expect(output.healthyNodes).to.eql([
      secondary1,
      secondary2,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    const newSecondaries = [newReplicaSet.newSecondary1, newReplicaSet.newSecondary2]
    expect(jobsToEnqueue).to.have.nested.property(QUEUE_NAMES.RECURRING_SYNC)
    const jobs = jobsToEnqueue[QUEUE_NAMES.RECURRING_SYNC]
    expect(jobs).to.have.lengthOf(2)
    // Verify sync from primary to new secondary1 and new secondary2
    for (let i = 0; i < 1; i++) {
      expect(jobs[i].primaryEndpoint).to.equal(newReplicaSet.newPrimary)
      expect(jobs[i].secondaryEndpoint).to.equal(newSecondaries[i])
      expect(jobs[i].syncType).to.equal(SyncType.Recurring)
      expect(jobs[i].syncMode).to.equal(SYNC_MODES.SyncSecondaryFromPrimary)
      expect(jobs[i].userWallet).to.equal(wallet)
    }
  })

  it('Does not issue reconfig when secondary is unhealthy, primary only override is enabled, and all reconfig modes are enabled', async function () {
    // A sync will be needed to this node, so stub returning a successful new sync and no duplicate sync
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      return { syncReqToEnqueue: args }
    })

    // Stub audiusLibs to return all nodes as healthy except secondary1
    const healthyNodes = {
      [primary]: '',
      [secondary2]: '',
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

    const customConfig = config
    customConfig.set('reconfigModePrimaryOnly', true)
    const updateReplicaSetJobProcessor = getJobProcessorStub({
      healthyNodes,
      getNewOrExistingSyncReqStub,
      retrieveClockValueForUserFromReplicaStub,
      customConfig
    })

    const output = await updateReplicaSetJobProcessor({
      logger,
      wallet,
      userId,
      primary,
      secondary1,
      secondary2,
      nodesToReconfigOffOf: unhealthyReplicas,
      replicaToUserInfoMap,
      enabledReconfigModes: [RECONFIG_MODES.MULTIPLE_SECONDARIES.key]
    })
    const { metricsToRecord, errorMsg, issuedReconfig, newReplicaSet, jobsToEnqueue } = output

    // Verify metrics record a successful reconfig
    expect(metricsToRecord[0].metricLabels.result).to.equal('success_issue_reconfig_disabled')
    expect(metricsToRecord[0].metricName).to.equal(
      'audius_cn_state_machine_update_replica_set_queue_job_duration_seconds'
    )
    expect(metricsToRecord[0].metricType).to.equal('HISTOGRAM_OBSERVE')

    // Verify job outputs the correct results: find update from primary to secondary1 and 2 new nodes selected, but not issued
    expect(errorMsg).to.equal('')
    expect(issuedReconfig).to.be.false
    expect(newReplicaSet.newPrimary).to.equal(primary)
    // Replacement nodes are randomly so we can't enforce order of secondaries
    expect(newReplicaSet.newSecondary1).to.equal(secondary2)
    expect(newReplicaSet.newSecondary2).to.be.oneOf([
      fourthHealthyNode,
      fifthHealthyNode
    ]).and.not.equal(newReplicaSet.newSecondary1)
    expect(newReplicaSet.issueReconfig).to.be.false
    expect(newReplicaSet.reconfigType).to.equal(
      RECONFIG_MODES.ONE_SECONDARY.key
    )
    expect(output.healthyNodes).to.eql([
      primary,
      secondary2,
      fourthHealthyNode,
      fifthHealthyNode
    ])
    expect(jobsToEnqueue).to.equal(undefined)
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
      nodesToReconfigOffOf: unhealthyReplicas,
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

  it('Does not issue any reconfigs when one secondary is unhealthy but reconfigs are disabled', async function () {
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
      nodesToReconfigOffOf: unhealthyReplicas,
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
      nodesToReconfigOffOf: unhealthyReplicas,
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
      errorMsg: `Error: [_selectRandomReplicaSetNodes] wallet=${wallet} healthyReplicaSet=[] numberOfNodesToReconfigOffOf=3 numberOfEmptyReplicas=0 healthyNodes=${primary},${secondary2},${fourthHealthyNode} || Not enough healthy nodes found to issue new replica set after 100 attempts`,
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
