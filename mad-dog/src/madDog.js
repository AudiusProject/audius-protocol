const { _ } = require('lodash')
const { logger } = require('./logger.js')
const { exec } = require('child_process')

const TICK_INTERVAL_SEC = 3
const DOWN_PROBABILITY = 0.4
const PAUSE_DURATION_SEC = 90
const NETWORK_DOWN_DURATION_SEC = 60 * 10

// Super agro: turn this down
const PACKET_LOSS_PERCENT = 20

let didPause = false

const makeCreatorNodeName = num => `cn${num}_creator-node_1`

// For now, this only takes down a single node
// per test.
class MadDog {
  constructor ({
    numCreatorNodes,
    downProbability = DOWN_PROBABILITY,
    pauseDurationSec = PAUSE_DURATION_SEC,
    networkDownDurationSec = NETWORK_DOWN_DURATION_SEC,
    packetLossPercent = PACKET_LOSS_PERCENT
  }) {
    this.services = _.range(1, numCreatorNodes + 1).map(i =>
      makeCreatorNodeName(i)
    )
    console.log({ s: this.services })
    this.tickToken = null
    this.currentlyPausedService = false
    this.netemProcess = null
    this.pauseProcess = null
    this.downProbability = downProbability
    this.pauseDurationSec = pauseDurationSec
    this.networkDownDurationSec = networkDownDurationSec
    this.packetLossPercent = packetLossPercent
  }

  /**
   * Starts mad dog. Creates stormy network conditions
   * and randomly pauses down a single node over the course of the test.
   */
  start (serviceName) {
    logger.info('Starting 😡🐶')
    this._setNetworkConditions(serviceName)
    this.tickToken = setInterval(() => {
      if (didPause) return
      if (this.currentlyPausedService) return
      const x = Math.random()
      if (x < this.downProbability) {
        this.currentlyPausedService = true
        this._pauseService(serviceName)
      }
    }, TICK_INTERVAL_SEC * 1000)
  }

  stop () {
    clearInterval(this.tickToken)
    if (this.netemProcess) {
      // Kill original process
      this.netemProcess.kill()
      // Set packet loss to 0% aka revert back to normal
      exec(`pumba netem --tc-image gaiadocker/iproute2 -d ${this.networkDownDurationSec}s loss -p 0 containers ${this.netemProcessService}`)
    }
    if (this.pauseProcess) this.pauseProcess.kill()
  }

  _setNetworkConditions (serviceName) {
    const service = serviceName || _.sample(this.services)
    logger.info(
      `Setting ${this.packetLossPercent}% packet loss for service: ${service}`
    )
    this.netemProcessService = service
    this.netemProcess = exec(`pumba netem --tc-image gaiadocker/iproute2 -d ${this.networkDownDurationSec}s loss -p ${this.packetLossPercent} containers ${service}`)
    this._setProcessLogs(this.netemProcess)
  }

  _setProcessLogs (process) {
    process.stdout.on('data', (data) => logger.info(`stdout: ${data}`))
    process.stderr.on('data', (data) => logger.error(`stderr: ${data}`))
    process.on('exit', (code) => {
      if (!isNaN(code)) logger.info(`child process exited with code ${code}`)
      process = null
    })
  }

  _pauseService (serviceName) {
    const service = serviceName || _.sample(this.services)
    didPause = true
    logger.info(`Pausing service: [${service}]`)
    this.pauseProcess = exec(`pumba pause -d ${this.pauseDurationSec}s containers ${service}`)
    _setProcessLogs(this.pauseProcess)
    setTimeout(() => {
      logger.info(`Unpausing service: [${service}]`)
      this.currentlyPausedService = false
    }, this.pauseDurationSec * 1000)
  }
}

module.exports = MadDog
module.exports.makeCreatorNodeName = makeCreatorNodeName
