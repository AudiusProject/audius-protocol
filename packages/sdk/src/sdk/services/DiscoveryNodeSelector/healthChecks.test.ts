import { expect, describe, test } from '@jest/globals'

import { HealthCheckStatus } from './healthCheckTypes'
import {
  parseApiHealthStatusReason,
  parseHealthStatusReason
} from './healthChecks'

describe('health_check', () => {
  test('no data is unhealthy', () => {
    const { health, reason } = parseHealthStatusReason({
      data: null,
      comms: null,
      healthCheckThresholds: {
        maxSlotDiffPlays: 10,
        maxBlockDiff: 10,
        minVersion: '1.2.3'
      }
    })
    expect(health).toBe(HealthCheckStatus.UNHEALTHY)
    expect(reason).toBe('data')
  })

  test('slot diff exceeded marked behind', () => {
    const { health, reason } = parseHealthStatusReason({
      data: {
        version: '1.2.3',
        service: 'discovery-node',
        block_difference: 0,
        plays: {
          is_unhealthy: false,
          tx_info: {
            slot_diff: 100
          }
        }
      },
      comms: {
        healthy: true
      },
      healthCheckThresholds: {
        maxSlotDiffPlays: 10,
        maxBlockDiff: 10,
        minVersion: '1.2.3'
      }
    })
    expect(health).toBe(HealthCheckStatus.BEHIND)
    expect(reason).toBe('slot diff')
  })

  test('comms unhealthy', () => {
    const { health, reason } = parseHealthStatusReason({
      data: {
        version: '1.2.3',
        service: 'discovery-node',
        block_difference: 100,
        plays: {
          is_unhealthy: false,
          tx_info: {
            slot_diff: 100
          }
        }
      },
      comms: {
        healthy: false
      },
      healthCheckThresholds: {
        maxSlotDiffPlays: 10,
        maxBlockDiff: 10,
        minVersion: '1.2.3'
      }
    })
    expect(health).toBe(HealthCheckStatus.UNHEALTHY)
    expect(reason).toBe('comms')
  })

  describe('api response', () => {
    test('check service name', () => {
      const { health, reason } = parseApiHealthStatusReason({
        data: {
          version: {
            version: '1.2.3',
            service: 'content-node'
          }
        },
        healthCheckThresholds: {
          maxSlotDiffPlays: 10,
          maxBlockDiff: 10,
          minVersion: '1.2.3'
        }
      })
      expect(health).toBe(HealthCheckStatus.UNHEALTHY)
      expect(reason).toBe('name')
    })

    test('lower patch version marked behind', () => {
      const { health, reason } = parseApiHealthStatusReason({
        data: {
          version: {
            version: '1.2.2',
            service: 'discovery-node'
          }
        },
        healthCheckThresholds: {
          maxSlotDiffPlays: 10,
          maxBlockDiff: 10,
          minVersion: '1.2.3'
        }
      })
      expect(health).toBe(HealthCheckStatus.BEHIND)
      expect(reason).toBe('version')
    })

    test('lower minor version marked behind', () => {
      const { health, reason } = parseApiHealthStatusReason({
        data: {
          version: {
            version: '1.1.2',
            service: 'discovery-node'
          }
        },
        healthCheckThresholds: {
          maxSlotDiffPlays: 10,
          maxBlockDiff: 10,
          minVersion: '1.2.3'
        }
      })
      expect(health).toBe(HealthCheckStatus.BEHIND)
      expect(reason).toBe('version')
    })

    test('slot diff exceeded marked behind', () => {
      const { health, reason } = parseApiHealthStatusReason({
        data: {
          version: {
            version: '1.2.3',
            service: 'discovery-node'
          },
          latest_chain_block: 100,
          latest_indexed_block: 100,
          latest_chain_slot_plays: 100,
          latest_indexed_slot_plays: 50
        },
        healthCheckThresholds: {
          maxSlotDiffPlays: 10,
          maxBlockDiff: 10,
          minVersion: '1.2.3'
        }
      })
      expect(health).toBe(HealthCheckStatus.BEHIND)
      expect(reason).toBe('slot diff')
    })

    // test('comms unhealthy', () => {
    //   const { health, reason } = parseApiHealthStatusReason({
    //     data: {
    //       health: {
    //         is_healthy: false
    //       },
    //       data: null
    //     },
    //     healthCheckThresholds: {
    //       maxSlotDiffPlays: 10,
    //       maxBlockDiff: 10,
    //       minVersion: '1.2.3'
    //     }
    //   })
    //   expect(health).toBe(HealthCheckStatus.UNHEALTHY)
    //   expect(reason).toBe('comms')
    // })

    // test('comms healthy', () => {
    //   const { health } = parseApiHealthStatusReason({
    //     data: {
    //       health: {
    //         is_healthy: true
    //       },
    //       data: null
    //     },
    //     healthCheckThresholds: {
    //       maxSlotDiffPlays: 10,
    //       maxBlockDiff: 10,
    //       minVersion: '1.2.3'
    //     }
    //   })
    //   expect(health).toBe(HealthCheckStatus.HEALTHY)
    // })
  })
})
