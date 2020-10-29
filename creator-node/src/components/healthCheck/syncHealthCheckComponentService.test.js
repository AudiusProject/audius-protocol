const { SyncPriority } = require('../../snapbackSM')
const { syncHealthCheck } = require('./syncHealthCheckComponentService')
const assert = require('assert')

describe('Test sync health check', function () {
  it('Should return active and pending jobs', async function () {
    const mockSnapback = {
      getSyncQueueJobs: async () => Promise.resolve({
        pending: [{
          name: 'RECURRING',
          id: 2,
          opts:
            {
              priority: SyncPriority.Low
            }
        }, {
          name: 'MANUAL',
          id: 3,
          opts:
            {
              priority: SyncPriority.High
            }
        }
        ],
        active: [{
          name: 'MANUAL',
          id: 1,
          opts:
            {
              priority: SyncPriority.High
            }
        }]
      })
    }

    const res = await syncHealthCheck({ snapbackSM: mockSnapback })
    assert.deepStrictEqual(res, {
      pending: [{ type: 'RECURRING', id: 2, priority: 'LOW'}, { type: 'MANUAL', id: 3, priority: 'HIGH'}],
      active: [{ type: 'MANUAL', id: 1, priority: 'HIGH' }],
      pendingCount: 2
    })
  })
})
