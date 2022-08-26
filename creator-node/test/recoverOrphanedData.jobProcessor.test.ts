/* eslint-disable no-unused-expressions */
import type { StateMonitoringUser } from '../src/services/stateMachineManager/stateMonitoring/types'

import chai from 'chai'
import sinon from 'sinon'
import nock from 'nock'
import proxyquire from 'proxyquire'
import bunyan from 'bunyan'
import _ from 'lodash'

import recoverOrphanedDataJobProcessor from '../src/services/stateMachineManager/stateReconciliation/recoverOrphanedData.jobProcessor'
import { QUEUE_NAMES } from '../src/services/stateMachineManager/stateMachineConstants'
import { DecoratedJobReturnValue } from '../src/services/stateMachineManager/types'
import { RecoverOrphanedDataJobReturnValue } from '../src/services/stateMachineManager/stateReconciliation/types'
import * as stateMachineConstants from '../src/services/stateMachineManager/stateMachineConstants'

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const models = require('../src/models')
const config = require('../src/config')

chai.use(require('sinon-chai'))
const { expect } = chai

describe('test recoverOrphanedData job processor', function () {
  const DISCOVERY_NODE_ENDPOINT = 'http://dn1.co'
  const THIS_CONTENT_NODE_ENDPOINT = 'http://cn1.co'
  const PRIMARY_OF_ORPHANED_USER = 'http://cn9.co'

  const USERS: StateMonitoringUser[] = []
  _.range(1, 21).forEach((userId) => {
    USERS.push({
      user_id: userId,
      wallet: `wallet${userId}`,
      primary: PRIMARY_OF_ORPHANED_USER,
      secondary1: 'http://cn2.co',
      secondary2: 'http://cn3.co',
      primarySpID: 1,
      secondary1SpID: 2,
      secondary2SpID: 3
    })
  })

  let server: any,
    sandbox: sinon.SinonSandbox,
    originalContentNodeEndpoint: string

  beforeEach(async function () {
    const appInfo = await getApp(getLibsMock())
    await appInfo.app.get('redisClient').flushdb()
    server = appInfo.server
    sandbox = sinon.createSandbox()
    originalContentNodeEndpoint = config.get('creatorNodeEndpoint')
    config.set('creatorNodeEndpoint', THIS_CONTENT_NODE_ENDPOINT)
    nock.disableNetConnect()
  })

  afterEach(async function () {
    expect(nock.isDone()).to.be.true
    await server.close()
    sandbox.restore()
    config.set('creatorNodeEndpoint', originalContentNodeEndpoint)
    nock.cleanAll()
    nock.enableNetConnect()
  })

  type TestParams = {
    usersOnNode: StateMonitoringUser[]
    usersWithNodeInReplicaSet: StateMonitoringUser[]
    orphanedUsers: StateMonitoringUser[]
    pagination?: {
      ORPHANED_DATA_NUM_USERS_PER_QUERY: number
      ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH: number
    }
  }
  function makeMock({
    usersOnNode,
    usersWithNodeInReplicaSet,
    orphanedUsers,
    pagination
  }: TestParams): typeof recoverOrphanedDataJobProcessor {
    // Mock request to Discovery to get users with this node in its replica set
    if (_.isEmpty(pagination)) {
      nock(DISCOVERY_NODE_ENDPOINT)
        .get('/v1/full/users/content_node/all')
        .query({
          creator_node_endpoint: THIS_CONTENT_NODE_ENDPOINT,
          prev_user_id: 0,
          max_users: 2000
        })
        .reply(200, { data: usersWithNodeInReplicaSet })
    }

    // Mock local db to return users with state on this node
    const cNodeUserMockAllStub = sandbox.stub().resolves(
      usersOnNode.map((user) => {
        return { walletPublicKey: user.wallet }
      })
    )
    const cNodeUserCountStub = sandbox.stub().resolves(usersOnNode.length)
    const modelsMock = {
      ...models,
      CNodeUser: {
        findAll: cNodeUserMockAllStub,
        count: cNodeUserCountStub
      }
    }

    orphanedUsers.forEach((orphanedUser) => {
      // Mock fetching the primary endpoint for each orphaned user
      nock(DISCOVERY_NODE_ENDPOINT)
        .get('/users')
        .query({ wallet: orphanedUser.wallet })
        .reply(200, {
          data: [
            {
              creator_node_endpoint: `${orphanedUser.primary},${orphanedUser.secondary1},${orphanedUser.secondary2}`
            }
          ]
        })

      // Mock making a sync request to recover orphaned data for each user with data orphaned on this node
      nock(PRIMARY_OF_ORPHANED_USER)
        .post('/merge_primary_and_secondary')
        .query({
          wallet: orphanedUser.wallet,
          endpoint: THIS_CONTENT_NODE_ENDPOINT,
          forceWipe: true
        })
        .reply(200)
    })

    return proxyquire(
      '../src/services/stateMachineManager/stateReconciliation/recoverOrphanedData.jobProcessor.ts',
      {
        '../../../config': config,
        '../../../models': modelsMock,
        '../stateMachineConstants': pagination
          ? {
              ...stateMachineConstants,
              ORPHANED_DATA_NUM_USERS_PER_QUERY:
                pagination.ORPHANED_DATA_NUM_USERS_PER_QUERY,
              ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH:
                pagination.ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH
            }
          : stateMachineConstants
      }
    ).default
  }

  type VerifyJobResults = {
    jobResults: DecoratedJobReturnValue<RecoverOrphanedDataJobReturnValue>
    numUsersOnNode: number
    numUsersWithNodeInReplicaSet: number
    numOrphanedUsers: number
  }
  function verifyJobResults({
    jobResults,
    numUsersOnNode,
    numUsersWithNodeInReplicaSet,
    numOrphanedUsers
  }: VerifyJobResults) {
    expect(jobResults.numWalletsOnNode).to.equal(numUsersOnNode)
    expect(jobResults.numWalletsWithNodeInReplicaSet).to.equal(
      numUsersWithNodeInReplicaSet
    )
    expect(jobResults.numWalletsWithOrphanedData).to.equal(numOrphanedUsers)
    expect(jobResults.jobsToEnqueue)
      .to.have.nested.property(QUEUE_NAMES.RECOVER_ORPHANED_DATA)
      .that.eqls([{ discoveryNodeEndpoint: DISCOVERY_NODE_ENDPOINT }])
    expect(jobResults.metricsToRecord).to.eql([
      {
        metricName: 'audius_cn_recover_orphaned_data_wallet_counts',
        metricType: 'GAUGE_SET',
        metricValue: numOrphanedUsers,
        metricLabels: {}
      },
      {
        metricName: 'audius_cn_recover_orphaned_data_sync_counts',
        metricType: 'GAUGE_SET',
        metricValue: numOrphanedUsers,
        metricLabels: {}
      }
    ])
  }

  async function processAndTestJob({
    usersOnNode,
    usersWithNodeInReplicaSet,
    orphanedUsers,
    pagination
  }: TestParams) {
    const recoverOrphanedDataJobProcessorMock = makeMock({
      usersOnNode,
      usersWithNodeInReplicaSet,
      orphanedUsers,
      pagination
    })
    const jobResults = await recoverOrphanedDataJobProcessorMock({
      discoveryNodeEndpoint: DISCOVERY_NODE_ENDPOINT,
      logger: bunyan.createLogger({ name: 'test_logger' })
    })
    verifyJobResults({
      jobResults,
      numUsersOnNode: usersOnNode.length,
      numUsersWithNodeInReplicaSet: usersWithNodeInReplicaSet.length,
      numOrphanedUsers: orphanedUsers.length
    })
  }

  it('Hits correct routes when a user has orphaned data', async function () {
    // Process a job where USERS[0] does NOT have this node in their RS BUT DOES have data on this node (they should be considered orphaned in this case)
    await processAndTestJob({
      usersOnNode: USERS,
      usersWithNodeInReplicaSet: USERS.slice(1),
      orphanedUsers: [USERS[0]]
    })
  })

  it('Hits correct routes when first 2 users have orphaned data, pagination length = 1', async function () {
    // Use 4 users
    const users = USERS.slice(0, 4)

    // Mock only users at index 2 and 3 as having this node in their replica set
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: THIS_CONTENT_NODE_ENDPOINT,
        prev_user_id: 0,
        max_users: 1
      })
      .reply(200, { data: [users[2]] })
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: THIS_CONTENT_NODE_ENDPOINT,
        prev_user_id: 3,
        max_users: 1
      })
      .reply(200, { data: [users[3]] })
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: THIS_CONTENT_NODE_ENDPOINT,
        prev_user_id: 4,
        max_users: 1
      })
      .reply(200, { data: [] })

    // Process a job where users[0] and users[1] do NOT have this node in their RS BUT DO have data on this node (they should be considered orphaned in this case)
    await processAndTestJob({
      usersOnNode: users,
      usersWithNodeInReplicaSet: users.slice(2),
      orphanedUsers: [users[0], users[1]],
      pagination: {
        ORPHANED_DATA_NUM_USERS_PER_QUERY: 1,
        ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH: 1
      }
    })
  })

  it('Hits correct routes when first 2 users have orphaned data, pagination length = 2', async function () {
    // Use 4 users
    const users = USERS.slice(0, 4)

    // Mock only users at index 2 and 3 as having this node in their replica set
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: THIS_CONTENT_NODE_ENDPOINT,
        prev_user_id: 0,
        max_users: 2
      })
      .reply(200, { data: [users[2], users[3]] })
    nock(DISCOVERY_NODE_ENDPOINT)
      .get('/v1/full/users/content_node/all')
      .query({
        creator_node_endpoint: THIS_CONTENT_NODE_ENDPOINT,
        prev_user_id: 4,
        max_users: 2
      })
      .reply(200, { data: [] })

    // Process a job where users[0] and users[1] do NOT have this node in their RS BUT DO have data on this node (they should be considered orphaned in this case)
    await processAndTestJob({
      usersOnNode: users,
      usersWithNodeInReplicaSet: users.slice(2),
      orphanedUsers: [users[0], users[1]],
      pagination: {
        ORPHANED_DATA_NUM_USERS_PER_QUERY: 2,
        ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH: 2
      }
    })
  })

  it('Does not think data is orphaned with wallet is in RS but no data is on node', async function () {
    // Process a job where users have this node in their RS BUT no data on this node (they shouldn't be considered orphaned in this case)
    await processAndTestJob({
      usersOnNode: [],
      usersWithNodeInReplicaSet: USERS,
      orphanedUsers: []
    })
  })

  it('Does not think data is orphaned when wallet is in RS but no data is on node', async function () {
    // Process a job where users have this node in their RS AND data on this node (they shouldn't be considered orphaned in this case)
    await processAndTestJob({
      usersOnNode: USERS,
      usersWithNodeInReplicaSet: USERS,
      orphanedUsers: []
    })
  })
})
