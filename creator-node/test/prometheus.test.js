/* eslint-disable @typescript-eslint/no-misused-promises */
const assert = require('assert')
const request = require('supertest')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const {
  NAMESPACE_PREFIX
} = require('../src/services/prometheusMonitoring/prometheus.constants')
const GenericBullQueue = require('./lib/genericBullQueueMock')

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

  it('Checks that GET /prometheus_metrics is healthy and exposes default metrics', async function () {
    await request(app).get('/health_check')

    const resp = await request(app).get('/prometheus_metrics').expect(200)
    assert.ok(
      resp.text.includes(
        NAMESPACE_PREFIX + '_default_' + 'process_cpu_user_seconds_total'
      )
    )

    assert.ok(
      resp.text.includes(NAMESPACE_PREFIX + '_http_request_duration_seconds')
    )
  })

  it('Checks that hitting unregistered routes does not track prometheus metrics', async function () {
    await request(app).get('/blahblahblah')
    const resp = await request(app).get('/prometheus_metrics').expect(200)

    assert.ok(!resp.text.includes('blahblahblah'))
  })

  it('Checks that GET /prometheus_metrics exposes bull queue metrics', async function () {
    await request(app).get('/health_check')

    const resp = await request(app).get('/prometheus_metrics').expect(200)
    assert.ok(resp.text.includes(NAMESPACE_PREFIX + '_jobs_completed'))
    assert.ok(resp.text.includes(NAMESPACE_PREFIX + '_jobs_waiting'))
    assert.ok(resp.text.includes(NAMESPACE_PREFIX + '_jobs_failed'))
    assert.ok(resp.text.includes(NAMESPACE_PREFIX + '_jobs_active'))
    assert.ok(resp.text.includes(NAMESPACE_PREFIX + '_jobs_delayed'))
  })

  it('Checks the duration of a bull queue job', async function () {
    this.retries(3) // TODO: Flakey test
    const genericBullQueue = new GenericBullQueue()
    const job = await genericBullQueue.addTask('job-name', { timeout: 500 })

    await job.waitUntilFinished(genericBullQueue.queueEvents)

    const resp = await request(app).get('/prometheus_metrics').expect(200)
    assert.ok(
      resp.text.includes(NAMESPACE_PREFIX + '_jobs_duration_seconds_bucket')
    )
    assert.ok(resp.text.includes(`queue_name="genericBullQueue"`))
  })
})
