import type Logger from 'bunyan'

const { logger: genericLogger } = require('../logging')

type Stage = {
  name: string
  data: object | null
  timestamp: number
  duration: number
  fullDuration: number
}

type ConstructorParams = {
  name: string
  logger: Logger
}

type RecordStageParams = {
  name: string
  data: object | null
  log: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
}

/**
 * Class for recording and logging multi-stage processes
 */
module.exports = class DecisionTree {
  name: string
  logger: Logger

  tree: Stage[]

  public constructor({ name, logger = genericLogger }: ConstructorParams) {
    this.logger = logger
    this.tree = []
    this.name = name
  }

  recordStage = ({
    name,
    data = null,
    log = false,
    logLevel = 'info'
  }: RecordStageParams) => {
    const timestamp = Date.now()

    let stage: Stage
    if (this.tree.length > 0) {
      const previousStage: Stage = this.tree[this.tree.length - 1]
      const duration: number = timestamp - previousStage.timestamp
      stage = {
        name,
        data,
        timestamp,
        duration,
        fullDuration: previousStage.fullDuration + duration
      }
    } else {
      stage = {
        name,
        data,
        timestamp,
        duration: 0,
        fullDuration: 0
      }
    }

    this.tree.push(stage)

    if (log) {
      this._printLastStage({ logLevel })
    }
  }

  printTree({ logLevel = 'debug' } = {}) {
    this._log({
      msg: `DecisionTree Full - ${JSON.stringify(this.tree, null, 2)}`,
      logLevel
    })
  }

  private _printLastStage({ logLevel = 'debug' } = {}) {
    if (this.tree.length > 0) {
      this._log({
        msg: `DecisionTree Last Stage - ${JSON.stringify(
          this.tree[this.tree.length - 1],
          null,
          2
        )}`,
        logLevel
      })
    } else {
      this._log({
        msg: 'DecisionTree Last Stage - empty',
        logLevel
      })
    }
  }

  private _log({ msg = '', logLevel = 'debug' } = {}) {
    let logFn
    switch (logLevel) {
      case 'error':
        logFn = this.logger.error
        break
      case 'warn':
        logFn = this.logger.warn
        break
      case 'info':
        logFn = this.logger.info
        break
      case 'debug':
        logFn = this.logger.debug
        break
      default:
        logFn = this.logger.debug
    }

    logFn.bind(this.logger)(`${this.name} - ${msg}`)
  }
}
