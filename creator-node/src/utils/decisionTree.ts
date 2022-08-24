import type Logger from 'bunyan'

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
}

/**
 * Class for recording and logging multi-stage processes
 */
module.exports = class DecisionTree {
  name: string
  logger: Logger

  tree: Stage[]

  public constructor({ name, logger }: ConstructorParams) {
    this.logger = logger
    this.tree = []
    this.name = name
  }

  recordStage = ({ name, data = null, log = false }: RecordStageParams) => {
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
      this.printLastStage()
    }
  }

  printTree() {
    this._logInfo(`DecisionTree Full - ${JSON.stringify(this.tree, null, 2)}`)
  }

  printLastStage() {
    if (this.tree.length > 0) {
      this._logInfo(
        `DecisionTree Last Stage - ${JSON.stringify(
          this.tree[this.tree.length - 1],
          null,
          2
        )}`
      )
    } else {
      this._logInfo('DecisionTree Last Stage - empty')
    }
  }

  private _logInfo(msg: string) {
    this.logger.info(`${this.name} - ${msg}`)
  }
}
