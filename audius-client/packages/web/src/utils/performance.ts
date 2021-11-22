import { Name } from 'common/models/Analytics'
import { track } from 'store/analytics/providers'

const DEFAULT_BATCH_SIZE = 10

type Recording = {
  name: string
  duration: number
}

const sendToAnalytics = ({ name, duration }: Recording) => {
  console.info(`Recorded event ${name} with duration ${duration}`)
  track(Name.PERFORMANCE, {
    metric: name,
    value: duration
  })
}

type TimerConfig = {
  // The name for the timer (snake_case)
  name: string
  // Whether or not to batch recordings before sending to analytics
  batch?: boolean
  // Size of the batch before sending data to analytics
  // Defaults to 10
  batchSize?: number
}

/**
 * Timer util for performance measuring
 * - Broadcasts to analytics
 * - Logs out to console (info)
 * - Optionally batchs and averages broadcasts for very frequent things that need timing
 *
 * To record a single value
 * ```
 *  const t = new Timer({ name: 'Metric' })
 *  const start = t.start()
 *  // Do some work you want to time
 *  t.end(start)
 * ```
 *
 * To record multiple values under a single name
 * ```
 *  const t = new Timer({ name: 'Metric' })
 *  for (let i = 0; i < 100; ++i) {
 *    const start = t.start()
 *    // Do some work you want to time in aggregate
 *    t.end()
 *  }
 * ```
 */
export class Timer {
  config: TimerConfig
  record: (record: Recording) => void

  // Tracking
  private totalCount: number
  private rollingAverage: number

  constructor(
    config: TimerConfig,
    record: ({ name, duration }: Recording) => void = sendToAnalytics
  ) {
    this.config = config
    this.record = record

    this.totalCount = 0
    this.rollingAverage = 0
  }

  start = () => {
    const startTime = Date.now()
    return startTime
  }

  end = (start: number) => {
    const duration = Date.now() - start

    if (this.config.batch) {
      // If we're in batch mode, calculate rolling average
      // and record to analytics when the batch size is big enough
      const newRollingAverage =
        (this.rollingAverage * this.totalCount + duration) /
        (this.totalCount + 1)
      this.totalCount = this.totalCount + 1
      this.rollingAverage = newRollingAverage

      if (this.totalCount >= (this.config.batchSize || DEFAULT_BATCH_SIZE)) {
        this.record({
          name: this.config.name,
          duration: this.rollingAverage
        })
        this.totalCount = 0
        this.rollingAverage = 0
      }
    } else {
      // If we're not in batch mode, send time data to analytics
      this.record({ name: this.config.name, duration })
    }
  }
}
