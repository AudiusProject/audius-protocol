const assert = require('assert')
const request = require('supertest')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const {
  NAMESPACE_PREFIX
} = require('../src/services/prometheusMonitoring/prometheus.constants')

describe('test Prometheus metrics', async function () {
  let app, server, libsMock

  /** Setup app + global test vars */
  beforeEach(async function () {
    libsMock = getLibsMock()

    const appInfo = await getApp(libsMock)
    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async function () {
    await server.close()
  })

  it('Checks that GET /prometheus_metrics is healthy and exposes Default metrics', async function () {
    const resp = await request(app).get('/prometheus_metrics').expect(200)
    assert.ok(
      resp.text.includes(
        NAMESPACE_PREFIX + '_default_' + 'process_cpu_user_seconds_total'
      )
    )
  })
})
