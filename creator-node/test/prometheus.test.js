const assert = require('assert')
const request = require('supertest')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

const { AudiusPrefix, DefaultPrefix, MetricNames } = require('../src/services/prometheusMonitoring/prometheus.constants')

describe('test Prometheus metrics', async function () {
  let app, server, libsMock

  /** Setup app + global test vars */
  beforeEach(async () => {
    libsMock = getLibsMock()

    const appInfo = await getApp(libsMock)

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    await server.close()
  })

  it('Checks that GET /prometheus_metrics is healthy, and exposes Audius and Default metrics', async function () {
    const resp = await request(app)
      .get('/prometheus_metrics')
      .expect(200)
    assert.ok(resp.text.includes(AudiusPrefix + MetricNames.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM))
    assert.ok(resp.text.includes(DefaultPrefix + 'process_cpu_user_seconds_total'))
  })
})
