const { SyncType } = require('../../snapbackSM')
const { syncHealthCheck } = require('./syncHealthCheckComponentService')
const assert = require('assert')

const WALLET = 'wallet_addr'
const SECONDARY = 'http:test-cn.audius.co'

describe('Test sync health check', function () {
  it('Should return active and waiting jobs', async function () {
    const mockSnapback = {
      getSyncQueueJobs: async () => Promise.resolve({
        recurringWaiting: [{
          id: 2,
          data: {
            syncRequestParameters: {
              baseURL: SECONDARY,
              data: {
                wallet: [WALLET],
                syncType: SyncType.Recurring
              }
            }
          }
        }],
        recurringActive: [{
          id: 1,
          data: {
            syncRequestParameters: {
              baseURL: SECONDARY,
              data: {
                wallet: [WALLET],
                syncType: SyncType.Recurring
              }
            }
          }
        }],
        manualWaiting: [{
          id: 3,
          data: {
            syncRequestParameters: {
              baseURL: SECONDARY,
              data: {
                wallet: [WALLET],
                syncType: SyncType.Manual
              }
            }
          }
        }],
        manualActive: []
      })
    }

    const expectedResp = {
      manualWaiting: [{
        id: 3,
        syncType: SyncType.Manual,
        secondary: SECONDARY,
        wallet: WALLET
      }],
      manualActive: [],
      recurringWaiting: [{
        id: 2,
        syncType: SyncType.Recurring,
        secondary: SECONDARY,
        wallet: WALLET
      }],
      recurringActive: [{
        id: 1,
        syncType: SyncType.Recurring,
        secondary: SECONDARY,
        wallet: WALLET
      }],
      manualWaitingCount: 1,
      recurringWaitingCount: 1
    }

    const res = await syncHealthCheck({ snapbackSM: mockSnapback })
    assert.deepStrictEqual(res, expectedResp)
  })
})
