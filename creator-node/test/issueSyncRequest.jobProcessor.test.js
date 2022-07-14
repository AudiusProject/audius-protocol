/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const nock = require('nock')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const models = require('../src/models')
const config = require('../src/config')
const stateMachineConstants = require('../src/services/stateMachineManager/stateMachineConstants')
const {
  SyncType,
  QUEUE_NAMES,
  SYNC_MODES
} = stateMachineConstants
const issueSyncRequestJobProcessor = require('../src/services/stateMachineManager/stateReconciliation/issueSyncRequest.jobProcessor')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const { expect } = chai

describe('test issueSyncRequest job processor param validation', function () {
  let server, sandbox, originalContentNodeEndpoint, logger

  let syncMode = SYNC_MODES.SyncSecondaryFromPrimary

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
    config.set('spID', 1)
    originalContentNodeEndpoint = config.get('creatorNodeEndpoint')
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

  it('catches bad sync request url', async function () {
    const wallet = '0x123456789'
    const url = '/sync'
    const method = 'post'
    const data = { wallet: [wallet] }
    const syncRequestParameters = {
      // Missing secondary
      url,
      method,
      data
    }

    const expectedErrorMessage = `Invalid sync data found: ${JSON.stringify(syncRequestParameters)}`

    // Verify job outputs the correct results: sync to user1 to secondary1 because its clock value is behind
    await expect(
      issueSyncRequestJobProcessor({
        logger,
        syncType: 'anyDummyType',
        syncMode,
        syncRequestParameters
      })
    ).to.eventually.be.fulfilled.and.deep.equal({
      error: {
        message: expectedErrorMessage
      },
      "jobsToEnqueue": {}
    })
    expect(logger.error).to.have.been.calledOnceWithExactly(
      expectedErrorMessage
    )
  })

  it('catches bad wallet in data', async function () {
    const wallet = '0x123456789'
    const secondary = 'http://some_cn.co'
    const url = '/sync'
    const method = 'post'
    const data = { wallet } // Bad wallet -- should be an array
    const syncRequestParameters = {
      baseURL: secondary,
      url,
      method,
      data
    }

    const expectedErrorMessage = `Invalid sync data wallets (expected non-empty array): ${data.wallet}`

    // Verify job outputs the correct results: sync to user1 to secondary1 because its clock value is behind
    await expect(
      issueSyncRequestJobProcessor({
        logger,
        syncType: 'anyDummyType',
        syncMode,
        syncRequestParameters
      })
    ).to.eventually.be.fulfilled.and.deep.equal({
      error: {
        message: expectedErrorMessage
      },
      "jobsToEnqueue": {}
    })
    expect(logger.error).to.have.been.calledOnceWithExactly(
      expectedErrorMessage
    )
  })
})

describe('test issueSyncRequest job processor', function () {
  let server,
    sandbox,
    originalContentNodeEndpoint,
    logger,
    recordSuccessStub,
    recordFailureStub,
    syncType,
    syncMode,
    primary,
    secondary,
    wallet,
    data,
    syncRequestParameters

  beforeEach(async function () {
    syncType = SyncType.Manual
    syncMode = SYNC_MODES.SyncSecondaryFromPrimary
    primary = 'http://primary_cn.co'
    wallet = '0x123456789'

    secondary = 'http://some_cn.co'
    data =  { wallet: [wallet] }
    syncRequestParameters = {
      baseURL: secondary,
      url: '/sync',
      method: 'post',
      data
    }

    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
    config.set('spID', 1)
    originalContentNodeEndpoint = config.get('creatorNodeEndpoint')
    config.set('creatorNodeEndpoint', primary)
    config.set('maxSyncMonitoringDurationInMs', 100)
    logger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    }
    recordSuccessStub = sandbox.stub().resolves()
    recordFailureStub = sandbox.stub().resolves()
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

  function getJobProcessorStub({
    getNewOrExistingSyncReqStub,
    getSecondaryUserSyncFailureCountForTodayStub,
    retrieveClockValueForUserFromReplicaStub,
    primarySyncFromSecondaryStub
  }) {

    const stubs = {
      './stateReconciliationUtils': {
        getNewOrExistingSyncReq: getNewOrExistingSyncReqStub
      },
      './SecondarySyncHealthTracker': {
        getSecondaryUserSyncFailureCountForToday:
          getSecondaryUserSyncFailureCountForTodayStub,
        recordSuccess: recordSuccessStub,
        recordFailure: recordFailureStub
      },
      '../stateMachineUtils': {
        retrieveClockValueForUserFromReplica:
          retrieveClockValueForUserFromReplicaStub
      },
      '../stateMachineConstants': {
        ...stateMachineConstants,
        SYNC_MONITORING_RETRY_DELAY_MS: 1,
      }
    }

    if (primarySyncFromSecondaryStub) {
      stubs['../../sync/primarySyncFromSecondary'] = primarySyncFromSecondaryStub
    }

    return proxyquire(
      '../src/services/stateMachineManager/stateReconciliation/issueSyncRequest.jobProcessor.js',
      stubs
    )
  }

  it('issues correct sync when no additional sync is required', async function () {
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('getNewOrExistingSyncReq was not expected to be called')
    })

    const getSecondaryUserSyncFailureCountForTodayStub = sandbox
      .stub()
      .returns(0)

    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(1)

    const primarySyncFromSecondaryStub = sandbox.stub().returns(null)

    // Make the axios request succeed
    nock(secondary).post('/sync', data).reply(200)

    const issueSyncRequestJobProcessor = getJobProcessorStub({
      getNewOrExistingSyncReqStub,
      getSecondaryUserSyncFailureCountForTodayStub,
      retrieveClockValueForUserFromReplicaStub,
      primarySyncFromSecondaryStub
    })

    // Verify job outputs the correct results: no sync issued (nock will error if the wrong network req was made)
    const result = await issueSyncRequestJobProcessor({
      logger,
      syncType,
      syncMode,
      syncRequestParameters
    })
    expect(result).to.have.deep.property('error', {})
    expect(result).to.have.deep.property('jobsToEnqueue', {})
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      'audius_cn_issue_sync_request_monitoring_duration_seconds'
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      syncType: 'manual',
      reason_for_additional_sync: 'none'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  it('does not issue sync when SecondaryUserSyncFailureCountForToday exceeds threshold', async function () {
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('getNewOrExistingSyncReq was not expected to be called')
    })

    // Make sync failure count exceed the threshold
    const failureThreshold = 20
    const failureCount = 21
    config.set('secondaryUserSyncDailyFailureCountThreshold', failureThreshold)
    const getSecondaryUserSyncFailureCountForTodayStub = sandbox
      .stub()
      .returns(failureCount)

    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(1)

    const issueSyncRequestJobProcessor = getJobProcessorStub({
      getNewOrExistingSyncReqStub,
      getSecondaryUserSyncFailureCountForTodayStub,
      retrieveClockValueForUserFromReplicaStub
    })

    const expectedErrorMessage = `(${syncType})(${syncMode}) User ${wallet} | Secondary: ${secondary} || Secondary has already met SecondaryUserSyncDailyFailureCountThreshold (${failureThreshold}). Will not issue further syncRequests today.`

    // Verify job outputs the correct results: error and no sync issued (nock will error if a network req was made)
    const result = await issueSyncRequestJobProcessor({
      logger,
      syncType,
      syncMode,
      syncRequestParameters
    })
    expect(result).to.have.deep.property('error', {
      message: expectedErrorMessage
    })
    expect(logger.error).to.have.been.calledOnceWithExactly(
      expectedErrorMessage
    )
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  it.only('requires additional sync when secondary updates clock value but clock value is still behind primary', async function () {
    const primaryClockValue = 5
    const initialSecondaryClockValue = 2
    const finalSecondaryClockValue = 3

    const expectedSyncReqToEnqueue = 'expectedSyncReqToEnqueue'
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      const { userWallet, secondaryEndpoint, syncType: syncTypeArg } = args
      if (
        userWallet === wallet &&
        secondaryEndpoint === secondary &&
        syncTypeArg === syncType
      ) {
        return { syncReqToEnqueue: expectedSyncReqToEnqueue }
      }
      throw new Error(
        'getNewOrExistingSyncReq was not expected to be called with the given args'
      )
    })

    const getSecondaryUserSyncFailureCountForTodayStub = sandbox
      .stub()
      .returns(0)

    const retrieveClockValueForUserFromReplicaStub = sandbox
      .stub()
      .resolves(finalSecondaryClockValue)
    retrieveClockValueForUserFromReplicaStub
      .onCall(0)
      .resolves(initialSecondaryClockValue)

    const issueSyncRequestJobProcessor = getJobProcessorStub({
      getNewOrExistingSyncReqStub,
      getSecondaryUserSyncFailureCountForTodayStub,
      retrieveClockValueForUserFromReplicaStub
    })

    sandbox
      .stub(models.CNodeUser, 'findAll')
      .resolves([{ walletPublicKey: wallet, clock: primaryClockValue }])

    // Make the axios request succeed
    nock(secondary).post('/sync', data).reply(200)

    // Verify job outputs the correct results: an additional sync
    const result = await issueSyncRequestJobProcessor({
      logger,
      syncType,
      syncMode,
      syncRequestParameters
    })
    expect(result).to.have.deep.property('error', {})
    expect(result).to.have.deep.property('jobsToEnqueue', {
      [QUEUE_NAMES.STATE_RECONCILIATION]: [expectedSyncReqToEnqueue]
    })
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      'audius_cn_issue_sync_request_monitoring_duration_seconds'
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      syncType: 'manual',
      reason_for_additional_sync: 'secondary_progressed_too_slow'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly({
      userWallet: wallet,
      secondaryEndpoint: secondary,
      primaryEndpoint: primary,
      syncType
    })
    expect(
      retrieveClockValueForUserFromReplicaStub.callCount
    ).to.be.greaterThanOrEqual(2)
    expect(recordSuccessStub).to.have.been.calledOnceWithExactly(
      secondary,
      wallet,
      syncType
    )
    expect(recordFailureStub).to.have.not.been.called
  })

  it("requires additional sync when secondary doesn't update clock during sync", async function () {
    const primaryClockValue = 5
    const finalSecondaryClockValue = 3

    config.set('maxSyncMonitoringDurationInMs', 100)

    const expectedSyncReqToEnqueue = 'expectedSyncReqToEnqueue'
    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      const { userWallet, secondaryEndpoint, syncType: syncTypeArg } = args
      if (
        userWallet === wallet &&
        secondaryEndpoint === secondary &&
        syncTypeArg === syncType
      ) {
        return { syncReqToEnqueue: expectedSyncReqToEnqueue }
      }
      throw new Error(
        'getNewOrExistingSyncReq was not expected to be called with the given args'
      )
    })

    const getSecondaryUserSyncFailureCountForTodayStub = sandbox
      .stub()
      .returns(0)

    const retrieveClockValueForUserFromReplicaStub = sandbox
      .stub()
      .resolves(finalSecondaryClockValue)

    const issueSyncRequestJobProcessor = getJobProcessorStub({
      getNewOrExistingSyncReqStub,
      getSecondaryUserSyncFailureCountForTodayStub,
      retrieveClockValueForUserFromReplicaStub
    })

    sandbox
      .stub(models.CNodeUser, 'findAll')
      .resolves([{ walletPublicKey: wallet, clock: primaryClockValue }])

    // Make the axios request succeed
    nock(secondary).post('/sync', data).reply(200)

    // Verify job outputs the correct results: an additional sync
    const result = await issueSyncRequestJobProcessor({
      logger,
      syncType,
      syncMode,
      syncRequestParameters
    })
    expect(result).to.have.deep.property('error', {})
    expect(result).to.have.deep.property('jobsToEnqueue', {
      [QUEUE_NAMES.STATE_RECONCILIATION]: [expectedSyncReqToEnqueue]
    })
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      'audius_cn_issue_sync_request_monitoring_duration_seconds'
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      syncType: 'manual',
      reason_for_additional_sync: 'secondary_failed_to_progress'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
    expect(getNewOrExistingSyncReqStub).to.have.been.calledOnceWithExactly({
      userWallet: wallet,
      secondaryEndpoint: secondary,
      primaryEndpoint: primary,
      syncType
    })
    expect(
      retrieveClockValueForUserFromReplicaStub.callCount
    ).to.be.greaterThanOrEqual(2)
    expect(recordFailureStub).to.have.been.calledOnceWithExactly(
      secondary,
      wallet,
      syncType
    )
    expect(recordSuccessStub).to.have.not.been.called
  })

  it('SyncMode.None', async function () {
    syncMode = SYNC_MODES.None

    const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
      throw new Error('getNewOrExistingSyncReq was not expected to be called')
    })

    const getSecondaryUserSyncFailureCountForTodayStub = sandbox
      .stub()
      .returns(0)

    const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(1)

    const primarySyncFromSecondaryStub = sandbox.stub().returns(null)

    // Make the axios request succeed
    nock(secondary).post('/sync', data).reply(200)

    const issueSyncRequestJobProcessor = getJobProcessorStub({
      getNewOrExistingSyncReqStub,
      getSecondaryUserSyncFailureCountForTodayStub,
      retrieveClockValueForUserFromReplicaStub,
      primarySyncFromSecondaryStub
    })

    // Verify job outputs the correct results: no sync issued (nock will error if the wrong network req was made)
    const result = await issueSyncRequestJobProcessor({
      logger,
      syncType,
      syncMode,
      syncRequestParameters
    })
    console.log(`SIDTEST RESULT: ${JSON.stringify(result)}`)
    expect(result).to.have.deep.property('error', {})
    expect(result).to.have.deep.property('jobsToEnqueue', {})
    expect(result).to.not.have.deep.property('metricsToRecord')
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  describe('test SYNC_MODES.MergePrimaryAndSecondary', function () {
    syncMode = SYNC_MODES.MergePrimaryAndSecondary

    it('Issues correct sync when primarySyncFromSecondary() succeeds and no additional sync is required', async function () {
      const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
        throw new Error('getNewOrExistingSyncReq was not expected to be called')
      })
  
      const getSecondaryUserSyncFailureCountForTodayStub = sandbox
        .stub()
        .returns(0)
  
      const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(1)

      const primarySyncFromSecondaryStub = sandbox.stub().callsFake((args) => {
        const { wallet: walletParam, secondary: secondaryParam } = args
        if (walletParam === wallet && secondaryParam === secondary) {
          return
        }
        throw new Error(`primarySyncFromSecondary was not expected to be called with the given args`)
      })
  
      const issueSyncRequestJobProcessor = getJobProcessorStub({
        getNewOrExistingSyncReqStub,
        getSecondaryUserSyncFailureCountForTodayStub,
        retrieveClockValueForUserFromReplicaStub,
        primarySyncFromSecondaryStub
      })
  
      // Make the axios request succeed
      nock(secondary).post('/sync', data).reply(200)
  
      // Verify job outputs the correct results: no sync issued (nock will error if the wrong network req was made)
      const result = await issueSyncRequestJobProcessor({
        logger,
        syncType,
        syncMode,
        syncRequestParameters
      })
      expect(result).to.have.deep.property('error', {})
      expect(result).to.have.deep.property('jobsToEnqueue', {})
      expect(result.metricsToRecord).to.have.lengthOf(1)
      expect(result.metricsToRecord[0]).to.have.deep.property(
        'metricName',
        'audius_cn_issue_sync_request_monitoring_duration_seconds'
      )
      expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
        syncType: 'manual',
        reason_for_additional_sync: 'none'
      })
      expect(result.metricsToRecord[0]).to.have.deep.property(
        'metricType',
        'HISTOGRAM_OBSERVE'
      )
      expect(result.metricsToRecord[0].metricValue).to.be.a('number')
      expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    })

    it.skip('primarySyncFromSecondary errors', async function () {
      const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
        throw new Error('getNewOrExistingSyncReq was not expected to be called')
      })
  
      const getSecondaryUserSyncFailureCountForTodayStub = sandbox
        .stub()
        .returns(0)
  
      const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(1)

      const primarySyncFromSecondaryError = new Error('Sync failure')
      const primarySyncFromSecondaryStub = sandbox.stub().callsFake((args) => {
        const { wallet: walletParam, secondary: secondaryParam } = args
        if (walletParam === wallet && secondaryParam === secondary) {
          return primarySyncFromSecondaryError
        }
        throw new Error(`primarySyncFromSecondary was not expected to be called with the given args`)
      })

      // const configStub = config
      config.set('mergePrimaryAndSecondaryEnabled', false)
  
      const issueSyncRequestJobProcessor = getJobProcessorStub({
        getNewOrExistingSyncReqStub,
        getSecondaryUserSyncFailureCountForTodayStub,
        retrieveClockValueForUserFromReplicaStub,
        primarySyncFromSecondaryStub,
        // configStub
      })
  
      // Make the axios request succeed
      nock(secondary).post('/sync', data).reply(200)
  
      // Verify job outputs the correct results: no sync issued (nock will error if the wrong network req was made)
      const result = await issueSyncRequestJobProcessor({
        logger,
        syncType,
        syncMode,
        syncRequestParameters
      })
      expect(result).to.have.deep.property('error', {
        message: `primarySyncFromSecondary failed with error: ${primarySyncFromSecondaryError.message}`
      })
      expect(result).to.have.deep.property('jobsToEnqueue', {})
      expect(result.metricsToRecord).to.have.lengthOf(0)
      expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    })

    it.skip('mergePrimaryAndSecondaryEnabled = false', async function () {
      const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
        throw new Error('getNewOrExistingSyncReq was not expected to be called')
      })
  
      const getSecondaryUserSyncFailureCountForTodayStub = sandbox
        .stub()
        .returns(0)
  
      const retrieveClockValueForUserFromReplicaStub = sandbox.stub().resolves(1)

      const primarySyncFromSecondaryStub = sandbox.stub().callsFake((args) => {
        throw new Error(`primarySyncFromSecondary was not expected to be called with the given args`)
      })
  
      const issueSyncRequestJobProcessor = getJobProcessorStub({
        getNewOrExistingSyncReqStub,
        getSecondaryUserSyncFailureCountForTodayStub,
        retrieveClockValueForUserFromReplicaStub,
        primarySyncFromSecondaryStub
      })
  
      // Make the axios request succeed
      nock(secondary).post('/sync', data).reply(200)
  
      // Verify job outputs the correct results: no sync issued (nock will error if the wrong network req was made)
      const result = await issueSyncRequestJobProcessor({
        logger,
        syncType,
        syncMode,
        syncRequestParameters
      })
      expect(result).to.have.deep.property('error', {
        message: `primarySyncFromSecondary failed with error: ${primarySyncFromSecondaryError.message}`
      })
      expect(result).to.have.deep.property('jobsToEnqueue', {})
      expect(result.metricsToRecord).to.have.lengthOf(0)
      expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    })
  })
})
