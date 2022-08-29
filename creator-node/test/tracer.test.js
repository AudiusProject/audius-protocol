const chai = require('chai')
const sinon = require('sinon')

const { setupTracing, instrumentTracing } = require('../src/tracer')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

describe('test tracing function wrapper', () => {
  let sandbox
  beforeEach(async function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(async function () {
    sandbox.restore()
  })

  it('works with sync functions', async () => {})

  it('works with async functions', async () => {})

  it('works with sync methods', async () => {})

  it('works with async methods', async () => {})
})
