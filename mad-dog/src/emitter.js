const EventEmitter = require('events')
const { logger } = require('./logger.js')

/**
 * Emitter event types.
 */
const Event = Object.freeze({
  TICK: 'TICK',
  REQUEST: 'REQUEST',
  RESPONSE: 'RESPONSE'
})

/**
 * Emits tick events on an emitter. Cleans up when done. Returns a promise
 * that resolves when the ticker has finished ticking.
 * @param {*} emitter
 * @param {*} intervalSeconds
 * @param {*} totalDurationSeconds
 */
const tick = async (emitter, intervalSeconds, totalDurationSeconds) => {
  const token = setInterval(() => {
    logger.info('Tick')
    emitter.emit(Event.TICK)
  }, intervalSeconds * 1000)

  return new Promise(res => {
    setTimeout(() => {
      clearInterval(token)
      res()
    }, totalDurationSeconds * 1000)
  })
}

/**
 * Run an async, event based test.
 *
 * Register listeners for request events, response events, and
 * tick events to specify interactions with the audius protocol.
 */
class EmitterBasedTest {
  constructor ({ tickIntervalSeconds, testDurationSeconds }) {
    this.emitter = new EventEmitter()
    this.emitter.setMaxListeners(100)
    this.inFlightCount = 0
    this.isTicking = false
    this.tickIntervalSeconds = tickIntervalSeconds
    this.testDurationSeconds = testDurationSeconds

    // Store a promise that we can resolve later
    this.inFlightPromise = new Promise(resolve => {
      this.inFlightResolve = resolve
    })

    this.emit = this.emit.bind(this)
    logger.info(
      `EmitterBasedTest with ${this.tickIntervalSeconds} tick interval (s), ${this.testDurationSeconds} test duration (s)`
    )
  }

  emit (eventType, event) {
    this.emitter.emit(eventType, event)
  }

  /**
   * Begin the test.
   * Returns when all inflight requests and ticks are completed.
   */
  async start () {
    logger.info('Beginning ticking.')
    this.isTicking = true
    await tick(this.emitter, this.tickIntervalSeconds, this.testDurationSeconds)
    this.isTicking = false
    logger.info('Finished ticking.')

    // Await any pending requests if necessary
    if (this.inFlightCount > 0) {
      logger.info(`Awaiting [${this.inFlightCount}] inflight requests.`)
      await this.inFlightPromise
    }
    logger.info('Test done.')
  }

  registerOnRequestListener (listener) {
    this.emitter.on(Event.REQUEST, request => {
      this.inFlightCount += 1
      logger.info(`Handling request: [${request.type}]]`)
      logger.info(`[${this.inFlightCount}] requests in flight.`)
      listener(request, this.emit)
    })
  }

  registerOnResponseListener (listener) {
    this.emitter.on(Event.RESPONSE, res => {
      this.inFlightCount -= 1
      logger.info(`Handling response: [${res.type}]`)
      logger.info(`In flight requests remaining: [${this.inFlightCount}]`)
      listener(res, this.emit)

      // If this was the last request, resolve
      // the inflight promise.
      if (this.inFlightCount === 0 && !this.isTicking) {
        this.inFlightResolve()
      }
    })
  }

  registerOnTickListener (listener) {
    this.emitter.on(Event.TICK, () => {
      listener(this.emit)
    })
  }
}

module.exports = {
  EmitterBasedTest,
  tick,
  Event
}
