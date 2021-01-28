const { SyncPriority } = require('../../snapbackSM')
const { syncHealthCheck } = require('./syncHealthCheckComponentService')
const assert = require('assert')

const WALLET = 'wallet_addr'
const SECONDARY = 'http:test-cn.audius.co'

describe('Test sync health check', function () {
  it('Should return active and pending jobs', async function () {
    const mockSnapback = {
      getSyncQueueJobs: async () => Promise.resolve({
        pending: [{
          name: 'RECURRING',
          id: 2,
          data: {
            syncRequestParameters: {
              data: {
                wallet: [WALLET]
              },
              baseURL: SECONDARY
            }
          },
          opts:
            {
              priority: SyncPriority.Low
            }
        }, {
          name: 'MANUAL',
          id: 3,
          data: {
            syncRequestParameters: {
              data: {
                wallet: [WALLET]
              },
              baseURL: SECONDARY
            }
          },
          opts:
            {
              priority: SyncPriority.High
            }
        }
        ],
        active: [{
          name: 'MANUAL',
          id: 1,
          data: {
            syncRequestParameters: {
              data: {
                wallet: [WALLET]
              },
              baseURL: SECONDARY
            }
          },
          opts:
            {
              priority: SyncPriority.High
            }
        }]
      })
    }

    const res = await syncHealthCheck({ snapbackSM: mockSnapback })
    assert.deepStrictEqual(res, {
      pending: [{ type: 'RECURRING', id: 2, priority: 'LOW', wallet: WALLET, secondary: SECONDARY }, { type: 'MANUAL', id: 3, priority: 'HIGH', wallet: WALLET, secondary: SECONDARY }],
      active: [{ type: 'MANUAL', id: 1, priority: 'HIGH', wallet: WALLET, secondary: SECONDARY }],
      pendingCount: 2
    })
  })
})
