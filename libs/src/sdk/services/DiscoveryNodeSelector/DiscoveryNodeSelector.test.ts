import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  afterEach
} from '@jest/globals'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { DiscoveryNodeSelector } from './DiscoveryNodeSelector'

// jest.mock('./healthChecks', () => ({
//   getHealthCheck: jest.fn(() => ({}))
// }))

const HEALTHY_NODE = 'https://healthy.audius.co'
const BEHIND_BLOCKDIFF_NODE = 'https://behind-blockdiff.audius.co'
const BEHIND_LARGE_BLOCKDIFF_NODE = 'https://behind-largeblockdiff.audius.co'
const BEHIND_PATCH_VERSION_NODE = 'https://behind-patchversion.audius.co'
const BEHIND_MINOR_VERSION_NODE = 'https://behind-minorversion.audius.co'
const UNHEALTHY_NODE = 'https://unhealthy.audius.co'
const UNRESPONSIVE_NODE = 'https://unresponsive.audius.co'

// const generateHealthyNodes = (count: number) => {
//   const nodes = []
//   for (let id = 0; id < count; id++) {
//     nodes.push(`https://healthy${id}.audius.co`)
//   }
//   return nodes
// }

const generateUnhealthyNodes = (count: number) => {
  const nodes = []
  for (let id = 0; id < count; id++) {
    nodes.push(`https://unhealthy${id}.audius.co`)
  }
  return nodes
}

const handlers = [
  // Healthy
  rest.get(
    /https:\/\/healthy(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.2.3',
            block_difference: 0
          }
        })
      )
    }
  ),
  // Behind blockdiff
  rest.get(
    /https:\/\/behind-blockdiff(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.2.3',
            block_difference: 50
          }
        })
      )
    }
  ),
  // Very behind blockdiff
  rest.get(
    /https:\/\/behind-largeblockdiff(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.2.3',
            block_difference: 200
          }
        })
      )
    }
  ),
  // Behind patch version
  rest.get(
    /https:\/\/behind-patchversion(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.2.2',
            block_difference: 0
          }
        })
      )
    }
  ),
  // Behind more patch version
  rest.get(
    /https:\/\/behind-patchversion(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.2.1',
            block_difference: 0
          }
        })
      )
    }
  ),
  // Behind minor version
  rest.get(
    /https:\/\/behind-minorversion(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.1.0',
            block_difference: 0
          }
        })
      )
    }
  ),
  // Unhealthy (offline)
  rest.get(
    /https:\/\/unhealthy(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(ctx.status(502))
    }
  ),
  // Unresponsive
  rest.get(
    /https:\/\/unresponsive(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(ctx.delay(10_000), ctx.status(502))
    }
  )
]
const server = setupServer(...handlers)

describe('discoveryNodeSelector', () => {
  beforeAll(() => server.listen())

  afterEach(() => server.resetHandlers())

  afterAll(() => server.close())

  test('prefers a healthy service', async () => {
    const selector = new DiscoveryNodeSelector({
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      bootstrapServices: [
        HEALTHY_NODE,
        BEHIND_BLOCKDIFF_NODE,
        BEHIND_LARGE_BLOCKDIFF_NODE,
        BEHIND_PATCH_VERSION_NODE,
        BEHIND_MINOR_VERSION_NODE,
        ...generateUnhealthyNodes(5)
      ]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })

  test('falls back to best blockdiff backup', async () => {
    const selector = new DiscoveryNodeSelector({
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      bootstrapServices: [
        BEHIND_BLOCKDIFF_NODE,
        BEHIND_LARGE_BLOCKDIFF_NODE,
        BEHIND_MINOR_VERSION_NODE,
        UNHEALTHY_NODE
      ]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    expect(selector.isBehind).toBe(true)
  })

  test('falls back to patch version backup before blockdiff backup', async () => {
    const selector = new DiscoveryNodeSelector({
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      bootstrapServices: [
        BEHIND_BLOCKDIFF_NODE,
        BEHIND_LARGE_BLOCKDIFF_NODE,
        BEHIND_PATCH_VERSION_NODE,
        BEHIND_MINOR_VERSION_NODE,
        UNHEALTHY_NODE
      ]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_PATCH_VERSION_NODE)
    expect(selector.isBehind).toBe(true)
  })

  test('timeout request before too long', async () => {
    const selector = new DiscoveryNodeSelector({
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      requestTimeout: 50,
      bootstrapServices: [UNRESPONSIVE_NODE]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(null)
  })

  test('respects allowlist', async () => {
    const selector = new DiscoveryNodeSelector({
      allowlist: new Set([BEHIND_BLOCKDIFF_NODE]),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      requestTimeout: 50,
      bootstrapServices: [HEALTHY_NODE, UNHEALTHY_NODE, BEHIND_BLOCKDIFF_NODE]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    expect(selector.isBehind).toBe(true)
  })

  test('respects blocklist', async () => {
    const selector = new DiscoveryNodeSelector({
      blocklist: new Set([HEALTHY_NODE]),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      requestTimeout: 50,
      bootstrapServices: [HEALTHY_NODE, UNHEALTHY_NODE, BEHIND_BLOCKDIFF_NODE]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    expect(selector.isBehind).toBe(true)
  })

  test('uses configured default', async () => {
    const selector = new DiscoveryNodeSelector({
      initialSelectedNode: BEHIND_BLOCKDIFF_NODE,
      requestTimeout: 50,
      bootstrapServices: [HEALTHY_NODE, UNHEALTHY_NODE, BEHIND_BLOCKDIFF_NODE]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    // Didn't run select(), so isBehind shouldn't have triggered yet
    expect(selector.isBehind).toBe(false)
  })

  test('rejects configured default if blocklisted', async () => {
    const selector = new DiscoveryNodeSelector({
      initialSelectedNode: BEHIND_BLOCKDIFF_NODE,
      blocklist: new Set([BEHIND_BLOCKDIFF_NODE]),
      requestTimeout: 50,
      bootstrapServices: [HEALTHY_NODE, UNHEALTHY_NODE, BEHIND_BLOCKDIFF_NODE]
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })
})
