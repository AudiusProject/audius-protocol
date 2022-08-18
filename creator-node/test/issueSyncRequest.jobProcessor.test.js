/* eslint-disable no-unused-expressions */
const chai = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const nock = require('nock')
const _ = require('lodash')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const models = require('../src/models')
const config = require('../src/config')
const stateMachineConstants = require('../src/services/stateMachineManager/stateMachineConstants')
const { SyncType, QUEUE_NAMES, SYNC_MODES } = stateMachineConstants
const {
  METRIC_NAMES
} = require('../src/services/prometheusMonitoring/prometheus.constants')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const { expect } = chai

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
    data = { wallet: [wallet] }
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
      '../../../config': config,
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
        SYNC_MONITORING_RETRY_DELAY_MS: 1
      }
    }

    if (primarySyncFromSecondaryStub) {
      stubs['../../sync/primarySyncFromSecondary'] =
        primarySyncFromSecondaryStub
    }

    return proxyquire(
      '../src/services/stateMachineManager/stateReconciliation/issueSyncRequest.jobProcessor.ts',
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
      METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      sync_type: _.snakeCase(syncType),
      sync_mode: _.snakeCase(syncMode),
      result: 'success_secondary_caught_up'
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

    const expectedErrorMessage = `_handleIssueSyncRequest() (${syncType})(${syncMode}) User ${wallet} | Secondary: ${secondary} || Secondary has already met SecondaryUserSyncDailyFailureCountThreshold (${failureThreshold}). Will not issue further syncRequests today.`

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
    expect(result).to.have.deep.property('jobsToEnqueue', {})
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      sync_type: _.snakeCase(syncType),
      sync_mode: _.snakeCase(syncMode),
      result: 'failure_secondary_failure_count_threshold_met'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
    expect(logger.error).to.have.been.calledOnceWithExactly(
      expectedErrorMessage
    )
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  it('requires additional sync when secondary updates clock value but clock value is still behind primary', async function () {
    const primaryClockValue = 5
    const initialSecondaryClockValue = 2
    const finalSecondaryClockValue = 3

    config.set('maxSyncMonitoringDurationInMs', 100)

    const expectedSyncReqToEnqueue = {
      attemptNumber: 2,
      syncMode,
      syncType,
      syncRequestParameters: {
        baseURL: secondary,
        data: {
          wallet: [wallet]
        },
        method: 'post',
        url: '/sync'
      }
    }

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
    const jobsToEnqueueRest = result.jobsToEnqueue[QUEUE_NAMES.MANUAL_SYNC].map(
      (job) => {
        const { parentSpanContext, ...rest } = job
        // expect(parentSpanContext).to.exist
        return rest
      }
    )
    expect(jobsToEnqueueRest).to.eql([expectedSyncReqToEnqueue])
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      sync_type: _.snakeCase(syncType),
      sync_mode: _.snakeCase(syncMode),
      result: 'success_secondary_partially_caught_up'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
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

    const expectedSyncReqToEnqueue = {
      attemptNumber: 2,
      syncMode,
      syncType,
      syncRequestParameters: {
        baseURL: secondary,
        data: {
          wallet: [wallet]
        },
        method: 'post',
        url: '/sync'
      }
    }

    const getSecondaryUserSyncFailureCountForTodayStub = sandbox
      .stub()
      .returns(0)

    const retrieveClockValueForUserFromReplicaStub = sandbox
      .stub()
      .resolves(finalSecondaryClockValue)

    const issueSyncRequestJobProcessor = getJobProcessorStub({
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
    const jobsToEnqueueRest = result.jobsToEnqueue[QUEUE_NAMES.MANUAL_SYNC].map(
      (job) => {
        const { parentSpanContext, ...rest } = job
        // expect(parentSpanContext).to.exist
        return rest
      }
    )
    expect(jobsToEnqueueRest).to.eql([expectedSyncReqToEnqueue])
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      sync_mode: _.snakeCase(syncMode),
      sync_type: _.snakeCase(syncType),
      result: 'failure_secondary_failed_to_progress'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
    // expect(result.spanContext).to.exist
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
    expect(result).to.have.deep.property('error', {})
    expect(result).to.have.deep.property('jobsToEnqueue', {})
    expect(result.metricsToRecord).to.have.lengthOf(1)
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricName',
      METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
    )
    expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
      sync_mode: _.snakeCase(syncMode),
      sync_type: _.snakeCase(syncType),
      result: 'success'
    })
    expect(result.metricsToRecord[0]).to.have.deep.property(
      'metricType',
      'HISTOGRAM_OBSERVE'
    )
    expect(result.metricsToRecord[0].metricValue).to.be.a('number')
    expect(getNewOrExistingSyncReqStub).to.not.have.been.called
  })

  describe('test SYNC_MODES.MergePrimaryAndSecondary', function () {
    beforeEach(async function () {
      syncMode = SYNC_MODES.MergePrimaryAndSecondary
    })

    it('Issues correct sync when primarySyncFromSecondary() succeeds and no additional sync is required', async function () {
      const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
        throw new Error('getNewOrExistingSyncReq was not expected to be called')
      })

      const getSecondaryUserSyncFailureCountForTodayStub = sandbox
        .stub()
        .returns(0)

      const retrieveClockValueForUserFromReplicaStub = sandbox
        .stub()
        .resolves(1)

      config.set('mergePrimaryAndSecondaryEnabled', true)

      const primarySyncFromSecondaryStub = sandbox.stub().callsFake((args) => {
        const { wallet: walletParam, secondary: secondaryParam } = args
        if (walletParam === wallet && secondaryParam === secondary) {
          return
        }
        throw new Error(
          `primarySyncFromSecondary was not expected to be called with the given args`
        )
      })

      const issueSyncRequestJobProcessor = getJobProcessorStub({
        getNewOrExistingSyncReqStub,
        getSecondaryUserSyncFailureCountForTodayStub,
        retrieveClockValueForUserFromReplicaStub,
        primarySyncFromSecondaryStub
      })

      // Make the sync request succeed regardless
      nock(secondary).post('/sync').reply(200)

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
        METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
      )
      expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
        sync_type: _.snakeCase(syncType),
        sync_mode: _.snakeCase(syncMode),
        result: 'success_secondary_caught_up'
      })
      expect(result.metricsToRecord[0]).to.have.deep.property(
        'metricType',
        'HISTOGRAM_OBSERVE'
      )
      expect(result.metricsToRecord[0].metricValue).to.be.a('number')
      expect(getNewOrExistingSyncReqStub).to.not.have.been.called
      expect(primarySyncFromSecondaryStub).to.have.been.calledOnceWithExactly({
        wallet,
        secondary
      })
    })

    it('primarySyncFromSecondary errors', async function () {
      const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
        throw new Error('getNewOrExistingSyncReq was not expected to be called')
      })

      const getSecondaryUserSyncFailureCountForTodayStub = sandbox
        .stub()
        .returns(0)

      const retrieveClockValueForUserFromReplicaStub = sandbox
        .stub()
        .resolves(1)

      config.set('mergePrimaryAndSecondaryEnabled', true)

      const primarySyncFromSecondaryError = new Error('Sync failure')
      const primarySyncFromSecondaryStub = sandbox.stub().callsFake((args) => {
        const { wallet: walletParam, secondary: secondaryParam } = args
        if (walletParam === wallet && secondaryParam === secondary) {
          return primarySyncFromSecondaryError
        }
        throw new Error(
          `primarySyncFromSecondary was not expected to be called with the given args`
        )
      })

      const issueSyncRequestJobProcessor = getJobProcessorStub({
        getNewOrExistingSyncReqStub,
        getSecondaryUserSyncFailureCountForTodayStub,
        retrieveClockValueForUserFromReplicaStub,
        primarySyncFromSecondaryStub
      })

      // Verify job outputs the correct results: no sync issued
      const result = await issueSyncRequestJobProcessor({
        logger,
        syncType,
        syncMode,
        syncRequestParameters
      })
      expect(result).to.have.deep.property(
        'error',
        primarySyncFromSecondaryError
      )
      expect(result).to.have.deep.property('jobsToEnqueue', {})
      expect(result.metricsToRecord).to.have.lengthOf(1)
      expect(result.metricsToRecord[0]).to.have.deep.property(
        'metricName',
        METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
      )
      expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
        sync_mode: _.snakeCase(syncMode),
        sync_type: _.snakeCase(syncType),
        result: 'failure_primary_sync_from_secondary'
      })
      expect(result.metricsToRecord[0]).to.have.deep.property(
        'metricType',
        'HISTOGRAM_OBSERVE'
      )
      expect(result.metricsToRecord[0].metricValue).to.be.a('number')
      expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    })

    it('mergePrimaryAndSecondaryEnabled = false', async function () {
      const getNewOrExistingSyncReqStub = sandbox.stub().callsFake((args) => {
        throw new Error('getNewOrExistingSyncReq was not expected to be called')
      })

      const getSecondaryUserSyncFailureCountForTodayStub = sandbox
        .stub()
        .returns(0)

      const retrieveClockValueForUserFromReplicaStub = sandbox
        .stub()
        .resolves(1)

      config.set('mergePrimaryAndSecondaryEnabled', false)

      const primarySyncFromSecondaryStub = sandbox.stub().callsFake((args) => {
        throw new Error(
          `primarySyncFromSecondary was not expected to be called with the given args`
        )
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
        METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
      )
      expect(result.metricsToRecord[0]).to.have.deep.property('metricLabels', {
        sync_mode: _.snakeCase(syncMode),
        sync_type: _.snakeCase(syncType),
        result: 'success_mode_disabled'
      })
      expect(result.metricsToRecord[0]).to.have.deep.property(
        'metricType',
        'HISTOGRAM_OBSERVE'
      )
      expect(result.metricsToRecord[0].metricValue).to.be.a('number')
      expect(getNewOrExistingSyncReqStub).to.not.have.been.called
    })

    it.skip(
      'requires additional sync when secondary updates clock value but is still behind primary'
    )
  })
})
