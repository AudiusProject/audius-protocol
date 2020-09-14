const { _ } = require('lodash')
const { logger } = require('./logger.js')
const { exec } = require('child_process')

const TICK_INTERVAL_SEC = 3
const DOWN_PROBABILITY = 0.4
const DOWN_DURATION_SEC = 90

// Super agro: turn this down
const PACKET_LOSS_PERCENT = 20

let didPause = false

const makeCreatorNodeName = num => `cn${num}_creator-node_1`

// For now, this only takes down a single node
// per test.
class MadDog {
  constructor(numCreatorNodes) {
    this.services = _.range(1, numCreatorNodes + 1).map(i =>
      makeCreatorNodeName(i)
    )
    console.log({ s: this.services })
    this.tickToken = null
    this.currentlyPausedService = false
  }

  /**
   * Starts mad dog. Creates stormy network conditions
   * and randomly pauses down a single node over the course of the test.
   */
  start() {
    logger.info('Starting 😡🐶')
    this._setNetworkConditions()
    this.tickToken = setInterval(() => {
      if (didPause) return
      if (this.currentlyPausedService) return
      const x = Math.random()
      if (x < DOWN_PROBABILITY) {
        this.currentlyPausedService = true
        this._pauseService()
      }
    }, TICK_INTERVAL_SEC * 1000)
  }

  stop() {
    clearInterval(this.tickToken)
  }

  _setNetworkConditions() {
    const service = _.sample(this.services)
    logger.info(
      `Setting ${PACKET_LOSS_PERCENT}% packet loss for service: ${service}`
    )
    exec(`pumba netem loss -p ${PACKET_LOSS_PERCENT} ${service}`)
  }

  _pauseService() {
    const service = _.sample(this.services)
    didPause = true
    logger.info(`Pausing service: [${service}]`)
    exec(`pumba pause -d ${DOWN_DURATION_SEC}s ${service}`)
    setTimeout(() => {
      logger.info(`Unpausing service: [${service}]`)
      this.currentlyPausedService = false
    }, DOWN_DURATION_SEC * 1000)
  }
}

module.exports = MadDog
