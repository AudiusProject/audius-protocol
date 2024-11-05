import shuffle from 'lodash/shuffle'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import {
  describe,
  it,
  expect,
  vitest,
  beforeAll,
  afterAll,
  afterEach
} from 'vitest'

import type { FetchParams } from '../../api/generated/default'
import fetch, { Response } from '../../utils/fetch'

import { DiscoveryNodeSelector } from './DiscoveryNodeSelector'
import type {
  ApiHealthResponseData,
  HealthCheckResponseData
} from './healthCheckTypes'
import type { DiscoveryNode } from './types'

const HEALTHY_NODE = 'https://healthy.audius.co'
const BEHIND_BLOCKDIFF_NODE = 'https://behind-blockdiff.audius.co'
const BEHIND_LARGE_BLOCKDIFF_NODE = 'https://behind-largeblockdiff.audius.co'
const BEHIND_PATCH_VERSION_NODE = 'https://behind-patchversion.audius.co'
const BEHIND_EARLIER_PATCH_VERSION_NODE =
  'https://behind-patchversion.audius.co'
const BEHIND_MINOR_VERSION_NODE = 'https://behind-minorversion.audius.co'
const UNHEALTHY_NODE = 'https://unhealthy.audius.co'
const UNHEALTHY_DATA_NODE = 'https://unhealthy-data.audius.co'
const UNRESPONSIVE_NODE = 'https://unresponsive.audius.co'
const CONTENT_NODE = 'https://contentnode.audius.co'

const generateHealthyNodes = (count: number) => {
  const nodes = []
  for (let id = 0; id < count; id++) {
    nodes.push(`https://healthy${id}.audius.co`)
  }
  return nodes
}

const generateSlowerHealthyNodes = (count: number) => {
  const nodes = []
  for (let id = 0; id < count; id++) {
    nodes.push(`https://healthy-slow${id}.audius.co`)
  }
  return nodes
}

const generateUnhealthyNodes = (count: number) => {
  const nodes = []
  for (let id = 0; id < count; id++) {
    nodes.push(`https://unhealthy${id}.audius.co`)
  }
  return nodes
}

const addDelegateOwnerWallets = (endpoint: string): DiscoveryNode => ({
  endpoint,
  delegateOwnerWallet: '',
  ownerWallet: ''
})

const NETWORK_DISCOVERY_NODES = [
  HEALTHY_NODE,
  ...generateSlowerHealthyNodes(10)
]

const healthyComms = {
  healthy: true
}

const handlers = [
  rest.get(
    /https:\/\/healthy(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      const data: HealthCheckResponseData = {
        service: 'discovery-node',
        version: '1.2.3',
        block_difference: 0,
        network: {
          discovery_nodes: NETWORK_DISCOVERY_NODES
        }
      }
      return res(
        ctx.delay(25),
        ctx.status(200),
        ctx.json({ data, comms: healthyComms })
      )
    }
  ),

  // Slower healthy
  rest.get(
    /https:\/\/healthy-slow(.*).audius.co\/health_check/,
    (_req, res, ctx) => {
      return res(
        ctx.delay(50),
        ctx.status(200),
        ctx.json({
          data: {
            service: 'discovery-node',
            version: '1.2.3',
            block_difference: 0
          },
          comms: healthyComms
        })
      )
    }
  ),

  rest.get(`${BEHIND_BLOCKDIFF_NODE}/health_check`, (_req, res, ctx) => {
    const data: HealthCheckResponseData = {
      service: 'discovery-node',
      version: '1.2.3',
      block_difference: 50
    }
    return res(ctx.status(200), ctx.json({ data, comms: healthyComms }))
  }),

  rest.get(`${BEHIND_LARGE_BLOCKDIFF_NODE}/health_check`, (_req, res, ctx) => {
    const data: HealthCheckResponseData = {
      service: 'discovery-node',
      version: '1.2.3',
      block_difference: 200
    }
    return res(ctx.status(200), ctx.json({ data, comms: healthyComms }))
  }),

  rest.get(`${BEHIND_PATCH_VERSION_NODE}/health_check`, (_req, res, ctx) => {
    const data: HealthCheckResponseData = {
      service: 'discovery-node',
      version: '1.2.2',
      block_difference: 0
    }
    return res(ctx.status(200), ctx.json({ data, comms: healthyComms }))
  }),

  rest.get(
    `${BEHIND_EARLIER_PATCH_VERSION_NODE}/health_check`,
    (_req, res, ctx) => {
      const data: HealthCheckResponseData = {
        service: 'discovery-node',
        version: '1.2.2',
        block_difference: 0
      }
      return res(ctx.status(200), ctx.json({ data, comms: healthyComms }))
    }
  ),

  rest.get(`${BEHIND_MINOR_VERSION_NODE}/health_check`, (_req, res, ctx) => {
    const data: HealthCheckResponseData = {
      service: 'discovery-node',
      version: '1.1.0',
      block_difference: 0
    }
    return res(ctx.status(200), ctx.json({ data, comms: healthyComms }))
  }),

  // Unhealthy (offline)
  rest.get(
    /https:\/\/unhealthy(.*).audius.co\/health_check/,
    (_req, res, _ctx) => {
      return res.networkError('')
    }
  ),

  rest.get(`${UNHEALTHY_DATA_NODE}/health_check`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null))
  }),

  rest.get(`${UNRESPONSIVE_NODE}/health_check`, (_req, res, ctx) => {
    return res(ctx.delay('infinite'))
  }),

  rest.get(`${CONTENT_NODE}/health_check`, (_req, res, ctx) => {
    const data: HealthCheckResponseData = {
      service: 'content-node',
      version: '1.2.3',
      block_difference: 0
    }
    return res(ctx.json({ data, comms: healthyComms }))
  })
]
const server = setupServer(...handlers)

const logger = {
  warn: vitest.fn(),
  info: vitest.fn(),
  debug: vitest.fn(),
  error: vitest.fn()
}

// Disable logging so test output is clean
const mockLogger = {
  createPrefixedLogger: vitest.fn(() => logger)
}

describe('discoveryNodeSelector', () => {
  beforeAll(() => {
    server.listen()
    vitest.spyOn(console, 'warn').mockImplementation(() => {})
    vitest.spyOn(console, 'info').mockImplementation(() => {})
    vitest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => server.resetHandlers())

  afterAll(() => server.close())

  it('prefers a healthy service', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
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
      ].map(addDelegateOwnerWallets)
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })

  it('falls back to patch version backup before blockdiff backup', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      bootstrapServices: [
        BEHIND_BLOCKDIFF_NODE,
        BEHIND_LARGE_BLOCKDIFF_NODE,
        BEHIND_PATCH_VERSION_NODE,
        BEHIND_MINOR_VERSION_NODE,
        UNHEALTHY_NODE
      ].map(addDelegateOwnerWallets)
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_PATCH_VERSION_NODE)
    expect(selector.isBehind).toBe(true)
  })

  it('falls back to best blockdiff backup', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      bootstrapServices: [
        BEHIND_BLOCKDIFF_NODE,
        BEHIND_LARGE_BLOCKDIFF_NODE,
        UNHEALTHY_NODE
      ].map(addDelegateOwnerWallets)
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    expect(selector.isBehind).toBe(true)
  })

  it('respects allowlist', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      allowlist: new Set([BEHIND_BLOCKDIFF_NODE]),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      requestTimeout: 50,
      bootstrapServices: [
        HEALTHY_NODE,
        UNHEALTHY_NODE,
        BEHIND_BLOCKDIFF_NODE
      ].map(addDelegateOwnerWallets)
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    expect(selector.isBehind).toBe(true)

    // Update config and trigger reselection
    selector.updateConfig({
      allowlist: new Set([HEALTHY_NODE])
    })
    const selected2 = await selector.getSelectedEndpoint()
    expect(selected2).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })

  it('respects blocklist', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      blocklist: new Set([HEALTHY_NODE]),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      requestTimeout: 50,
      bootstrapServices: [
        HEALTHY_NODE,
        UNHEALTHY_NODE,
        BEHIND_BLOCKDIFF_NODE
      ].map(addDelegateOwnerWallets)
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    expect(selector.isBehind).toBe(true)

    // Update config and trigger reselection
    selector.updateConfig({
      blocklist: new Set([BEHIND_BLOCKDIFF_NODE])
    })
    const selected2 = await selector.getSelectedEndpoint()
    expect(selected2).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })

  it('uses configured default', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      initialSelectedNode: BEHIND_BLOCKDIFF_NODE,
      requestTimeout: 50,
      bootstrapServices: [
        HEALTHY_NODE,
        UNHEALTHY_NODE,
        BEHIND_BLOCKDIFF_NODE
      ].map(addDelegateOwnerWallets)
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(BEHIND_BLOCKDIFF_NODE)
    // Didn't run select(), so isBehind shouldn't have triggered yet
    expect(selector.isBehind).toBe(false)
  })

  it('rejects configured default if blocklisted', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      initialSelectedNode: BEHIND_BLOCKDIFF_NODE,
      blocklist: new Set([BEHIND_BLOCKDIFF_NODE]),
      requestTimeout: 1000,
      bootstrapServices: [
        HEALTHY_NODE,
        UNHEALTHY_NODE,
        BEHIND_BLOCKDIFF_NODE
      ].map(addDelegateOwnerWallets),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      }
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })

  it('selects fastest discovery node', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      bootstrapServices: [HEALTHY_NODE, ...generateSlowerHealthyNodes(5)].map(
        addDelegateOwnerWallets
      ),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      }
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(HEALTHY_NODE)
    expect(selector.isBehind).toBe(false)
  })

  it('does not select unhealthy nodes', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      requestTimeout: 50,
      bootstrapServices: [
        CONTENT_NODE,
        UNHEALTHY_DATA_NODE,
        UNHEALTHY_NODE,
        UNRESPONSIVE_NODE
      ].map(addDelegateOwnerWallets),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      }
    })
    const selected = await selector.getSelectedEndpoint()
    expect(selected).toBe(null)
  })

  it('waits for existing selections to finish gracefully', async () => {
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      bootstrapServices: generateHealthyNodes(100).map(addDelegateOwnerWallets),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      }
    })
    const selected = await Promise.all([
      selector.getSelectedEndpoint(),
      selector.getSelectedEndpoint(),
      selector.getSelectedEndpoint(),
      selector.getSelectedEndpoint(),
      selector.getSelectedEndpoint(),
      selector.getSelectedEndpoint()
    ])
    expect(selected.every((s) => s === selected[0])).toBe(true)
  })

  it('removes backups when TTL is complete', async () => {
    vitest.useFakeTimers()
    const TEMP_BEHIND_BLOCKDIFF_NODE = 'https://temp-behind.audius.co'
    const selector = new DiscoveryNodeSelector({
      logger: mockLogger,
      backupsTTL: 10,
      unhealthyTTL: 0,
      bootstrapServices: [TEMP_BEHIND_BLOCKDIFF_NODE, HEALTHY_NODE].map(
        addDelegateOwnerWallets
      ),
      healthCheckThresholds: {
        minVersion: '1.2.3'
      }
    })
    let requestCount = 0
    server.use(
      rest.get(
        `${TEMP_BEHIND_BLOCKDIFF_NODE}/health_check`,
        (_req, res, ctx) => {
          const data: HealthCheckResponseData = {
            service: 'discovery-node',
            version: '1.2.3',
            block_difference: requestCount++ < 1 ? 50 : 0 // switch to healthy
          }
          return res(ctx.status(200), ctx.json({ data, comms: healthyComms }))
        }
      )
    )

    // First select healthy node
    const first = await selector.getSelectedEndpoint()
    expect(first).toBe(HEALTHY_NODE)

    const data: ApiHealthResponseData = {
      latest_chain_block: 100,
      latest_indexed_block: 2,
      latest_chain_slot_plays: 100,
      latest_indexed_slot_plays: 100,
      version: {
        service: 'discovery-node',
        version: '1.2.3'
      }
    }
    const middleware = selector.createMiddleware()

    // Move time
    vitest.advanceTimersByTime(11)

    // Trigger cleanup by retriggering selection
    await middleware.post!({
      fetch,
      url: `${HEALTHY_NODE}/v1/full/tracks`,
      init: {},
      response: new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    })

    // Force reselection
    await middleware.post!({
      fetch,
      url: `${HEALTHY_NODE}/v1/full/tracks`,
      init: {},
      response: new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    })

    // Is up to date now
    const second = await selector.getSelectedEndpoint()
    expect(second).toBe(TEMP_BEHIND_BLOCKDIFF_NODE)
  })

  describe('middleware', () => {
    it('prepends URL to requests', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices: [HEALTHY_NODE].map(addDelegateOwnerWallets)
      })
      const middleware = selector.createMiddleware()
      expect(middleware.pre).not.toBeUndefined()
      const result = await middleware.pre!({
        fetch,
        url: '/v1/full/tracks',
        init: {}
      })
      expect(result).not.toBeUndefined()
      expect((result as FetchParams).url.startsWith(HEALTHY_NODE)).toBe(true)
    })

    it('reselects if request succeeds but node fell behind', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        initialSelectedNode: BEHIND_BLOCKDIFF_NODE,
        bootstrapServices: [HEALTHY_NODE, BEHIND_BLOCKDIFF_NODE].map(
          addDelegateOwnerWallets
        ),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      const middleware = selector.createMiddleware()
      expect(middleware.post).not.toBeUndefined()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const data: ApiHealthResponseData = {
        latest_chain_block: 100,
        latest_indexed_block: 50,
        latest_chain_slot_plays: 100,
        latest_indexed_slot_plays: 100,
        version: {
          service: 'discovery-node',
          version: '1.2.3'
        }
      }
      await middleware.post!({
        fetch,
        url: `${BEHIND_BLOCKDIFF_NODE}/v1/full/tracks`,
        init: {},
        response: new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        })
      })
      expect(changeHandler).toHaveBeenCalledWith(HEALTHY_NODE)
    })

    it("doesn't reselect if behind but was already behind", async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices: [BEHIND_BLOCKDIFF_NODE].map(addDelegateOwnerWallets),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      await selector.getSelectedEndpoint()
      expect(selector.isBehind).toBe(true)

      const middleware = selector.createMiddleware()
      expect(middleware.post).not.toBeUndefined()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const data: ApiHealthResponseData = {
        latest_chain_block: 100,
        latest_indexed_block: 50,
        latest_chain_slot_plays: 100,
        latest_indexed_slot_plays: 100,
        version: {
          service: 'discovery-node',
          version: '1.2.3'
        }
      }
      await middleware.post!({
        fetch,
        url: `${BEHIND_BLOCKDIFF_NODE}/v1/full/tracks`,
        init: {},
        response: new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        })
      })
      expect(changeHandler).not.toHaveBeenCalled()
    })

    it('reselects if request fails and node fell behind', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        initialSelectedNode: BEHIND_BLOCKDIFF_NODE,
        bootstrapServices: [HEALTHY_NODE, BEHIND_BLOCKDIFF_NODE].map(
          addDelegateOwnerWallets
        ),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      const middleware = selector.createMiddleware()
      expect(middleware.post).not.toBeUndefined()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const response = {
        ok: false,
        url: `${BEHIND_BLOCKDIFF_NODE}/v1/full/tracks`,
        json: async function (): Promise<any> {
          return null
        }
      }

      server.use(
        rest.get(`${HEALTHY_NODE}/v1/full/tracks`, (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              data: {}
            })
          )
        })
      )

      const actualResponse = await middleware.post!({
        fetch,
        url: `${BEHIND_BLOCKDIFF_NODE}/v1/full/tracks`,
        init: {},
        response: response as Response
      })
      expect(actualResponse?.ok).toBe(true)
      expect(changeHandler).toHaveBeenCalledWith(HEALTHY_NODE)
    })

    it('reselects if request fails and node unhealthy', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        initialSelectedNode: UNHEALTHY_NODE,
        bootstrapServices: [HEALTHY_NODE, BEHIND_BLOCKDIFF_NODE].map(
          addDelegateOwnerWallets
        ),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      const middleware = selector.createMiddleware()
      expect(middleware.post).not.toBeUndefined()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const response = {
        ok: false,
        url: `${UNHEALTHY_NODE}/v1/full/tracks`,
        json: async function (): Promise<any> {
          return null
        }
      }
      server.use(
        rest.get(`${HEALTHY_NODE}/v1/full/tracks`, (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              data: {}
            })
          )
        })
      )

      const actualResponse = await middleware.post!({
        fetch,
        url: `${UNHEALTHY_NODE}/v1/full/tracks`,
        init: {},
        response: response as Response
      })
      expect(actualResponse?.ok).toBe(true)
      expect(changeHandler).toHaveBeenCalledWith(HEALTHY_NODE)
    })

    it("doesn't reselect if request fails but node is healthy", async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        initialSelectedNode: HEALTHY_NODE,
        bootstrapServices: [HEALTHY_NODE, BEHIND_BLOCKDIFF_NODE].map(
          addDelegateOwnerWallets
        ),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      const middleware = selector.createMiddleware()
      expect(middleware.post).not.toBeUndefined()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const response = {
        ok: false,
        url: `${HEALTHY_NODE}/v1/full/tracks`,
        json: async function (): Promise<any> {
          return null
        }
      }

      await middleware.post!({
        fetch,
        url: `${HEALTHY_NODE}/v1/full/tracks`,
        init: {},
        response: response as Response
      })
      expect(changeHandler).not.toHaveBeenCalled()
    })

    it('resets isBehind when request shows the node is caught up', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices: [BEHIND_BLOCKDIFF_NODE].map(addDelegateOwnerWallets),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      await selector.getSelectedEndpoint()
      expect(selector.isBehind).toBe(true)

      const middleware = selector.createMiddleware()
      expect(middleware.post).not.toBeUndefined()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const data: ApiHealthResponseData = {
        latest_chain_block: 100,
        latest_indexed_block: 100,
        latest_chain_slot_plays: 100,
        latest_indexed_slot_plays: 100,
        version: {
          service: 'discovery-node',
          version: '1.2.3'
        }
      }
      await middleware.post!({
        fetch,
        url: `${BEHIND_BLOCKDIFF_NODE}/v1/full/tracks`,
        init: {},
        response: new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        })
      })
      expect(selector.isBehind).toBe(false)
    })

    it('reselects when encountering network error', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices: [BEHIND_BLOCKDIFF_NODE].map(addDelegateOwnerWallets),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      let requestCount = 0
      server.use(
        rest.get(`${BEHIND_BLOCKDIFF_NODE}/health_check`, (_req, res, ctx) => {
          const data: HealthCheckResponseData = {
            service: 'discovery-node',
            version: '1.2.3',
            block_difference: 0,
            network: {
              discovery_nodes: [HEALTHY_NODE, BEHIND_BLOCKDIFF_NODE],
              discovery_nodes_with_owner: [
                HEALTHY_NODE,
                BEHIND_BLOCKDIFF_NODE
              ].map(addDelegateOwnerWallets)
            }
          }
          return requestCount++ > 0
            ? res.networkError('')
            : res(
                ctx.delay(25),
                ctx.status(200),
                ctx.json({ data, comms: healthyComms })
              )
        })
      )

      server.use(
        rest.get(`${HEALTHY_NODE}/v1/full/tracks`, (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              data: {}
            })
          )
        })
      )

      const middleware = selector.createMiddleware()
      await middleware.onError!({
        fetch,
        url: `${BEHIND_BLOCKDIFF_NODE}/v1/full/tracks`,
        init: {},
        error: ''
      })
      expect(changeHandler).toHaveBeenCalled()
      const selected = await selector.getSelectedEndpoint()
      expect(selected).not.toBe(BEHIND_BLOCKDIFF_NODE)
    })

    it('does not reselect for client error status', async () => {
      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices: NETWORK_DISCOVERY_NODES.map(addDelegateOwnerWallets),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })

      const before = await selector.getSelectedEndpoint()

      const changeHandler = vitest.fn(() => {})
      selector.addEventListener('change', changeHandler)

      const middleware = selector.createMiddleware()
      await middleware.post!({
        fetch,
        url: `${HEALTHY_NODE}/v1/full/tracks`,
        init: {},
        response: new Response(null, { status: 404 })
      })
      expect(changeHandler).not.toHaveBeenCalled()
      const selected = await selector.getSelectedEndpoint()
      expect(selected).toBe(before)
    })
  })

  describe('getUniquelyOwnedEndpoints', () => {
    it('gets three uniquely owned discovery nodes', async () => {
      const operators = ['0x1', '0x2', '0x3', '0x4'] as const
      const healthyNodes = generateHealthyNodes(3)
      const unhealthyNodes = generateUnhealthyNodes(50)
      const bootstrapServices = shuffle([
        ...unhealthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        })),
        ...healthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        }))
      ])

      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices,
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })
      const nodes = await selector.getUniquelyOwnedEndpoints(3)
      expect(nodes.length).toBe(3)
      expect(nodes).toContain(healthyNodes[0])
      expect(nodes).toContain(healthyNodes[1])
      expect(nodes).toContain(healthyNodes[2])
    })

    it('filters to allowlist', async () => {
      const operators = ['0x1', '0x2', '0x3', '0x4'] as const
      const healthyNodes = generateHealthyNodes(3)
      const unhealthyNodes = generateUnhealthyNodes(10)
      const bootstrapServices = shuffle([
        ...unhealthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        })),
        ...healthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        }))
      ])

      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices,
        unhealthyTTL: 0,
        allowlist: new Set(unhealthyNodes),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })

      await expect(async () => {
        await selector.getUniquelyOwnedEndpoints(3)
      }).rejects.toThrow(
        new Error('Not enough healthy services to choose from')
      )
    })

    it('filters to blocklist', async () => {
      const operators = ['0x1', '0x2', '0x3', '0x4'] as const
      const healthyNodes = generateHealthyNodes(3)
      const unhealthyNodes = generateUnhealthyNodes(10)
      const bootstrapServices = shuffle([
        ...unhealthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        })),
        ...healthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        }))
      ])

      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices,
        unhealthyTTL: 0,
        blocklist: new Set(healthyNodes.slice(0, 1)),
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })

      await expect(async () => {
        await selector.getUniquelyOwnedEndpoints(3)
      }).rejects.toThrow()
    })

    it('fails when not enough owners', async () => {
      const operators = ['0x1', '0x2'] as const
      const healthyNodes = generateHealthyNodes(3)
      const unhealthyNodes = generateUnhealthyNodes(10)
      const bootstrapServices = shuffle([
        ...unhealthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        })),
        ...healthyNodes.map((endpoint, i) => ({
          endpoint,
          delegateOwnerWallet: operators[i % operators.length]!,
          ownerWallet: operators[i % operators.length]!
        }))
      ])

      const selector = new DiscoveryNodeSelector({
        logger: mockLogger,
        bootstrapServices,
        healthCheckThresholds: {
          minVersion: '1.2.3'
        }
      })

      await expect(async () => {
        await selector.getUniquelyOwnedEndpoints(3)
      }).rejects.toThrow(new Error('Not enough unique owners to choose from'))
    })
  })
})
