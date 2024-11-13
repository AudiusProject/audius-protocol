import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publishToS3 } from '../s3'
import { readConfig } from '../config'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { formatDateISO, getYearMonth, getYearMonthDay, getYearMonthShorthand } from '../date'

dayjs.extend(quarterOfYear)

const config = readConfig()
const isDev = config.env === 'dev'

type MrvrAffirmative = {
  ['Downloads - Gross Revenues without Permitted Deductions']: number
  ['Downloads - Gross Revenues with Permitted Deductions']: number
  ['Downloads - Gross Revenues without Permitted Deductions - USA Only']: number
  ['Downloads - Gross Revenues with Permitted Deductions - USA Only']: number
  ['Downloads - Public Performance Fees']: number
  ['Downloads - Record Label Payments']: number
  ['Subscription Offerings - Gross Revenues without Permitted Deductions']: number
  ['Subscription Offerings - Gross Revenues with Permitted Deductions']: number
  ['Subscription Offerings - Gross Revenues without Permitted Deductions - USA Only']: number
  ['Subscription Offerings - Gross Revenues with Permitted Deductions - USA Only']: number
  ['Subscription Offerings - Public Performance Fees']: number
  ['Subscription Offerings - Record Label Payments']: number
  ['Subscription Offerings - Average Subscription Price']: number
  ['Subscription Offerings - Total Subscribers']: number
  ['Subscription Offerings - Total Subscribers - USA Only']: number
  ['Aggregate Transmission Hours - USA Only']: number
}

type MrvrCbs = {
  'Offering': 'Downloads / Monetized Content' | 'Subscription'
  'UserType': 'Free Trial'
  ['Subscriber Count']: 0
  ['Gross Revenue']: number
  ['Gross revenue With Deductions']: number
  'Territory': string
  'Has_usage_flag': boolean
  'Total Downloads': number
  'Total Streams': number
  'Currency': 'USD'
}

const MrvrAffirmativeHeader: (keyof MrvrAffirmative)[] = [
  'Downloads - Gross Revenues without Permitted Deductions',
  'Downloads - Gross Revenues with Permitted Deductions',
  'Downloads - Gross Revenues without Permitted Deductions - USA Only',
  'Downloads - Gross Revenues with Permitted Deductions - USA Only',
  'Downloads - Public Performance Fees',
  'Downloads - Record Label Payments',
  'Subscription Offerings - Gross Revenues without Permitted Deductions',
  'Subscription Offerings - Gross Revenues with Permitted Deductions',
  'Subscription Offerings - Gross Revenues without Permitted Deductions - USA Only',
  'Subscription Offerings - Gross Revenues with Permitted Deductions - USA Only',
  'Subscription Offerings - Public Performance Fees',
  'Subscription Offerings - Record Label Payments',
  'Subscription Offerings - Average Subscription Price',
  'Subscription Offerings - Total Subscribers',
  'Subscription Offerings - Total Subscribers - USA Only',
  'Aggregate Transmission Hours - USA Only',
 
]

const MrvrCbsHeader: (keyof MrvrCbs)[] = [
  'Offering',
  'UserType',
  'Subscriber Count',
  'Gross Revenue',
  'Gross revenue With Deductions',
  'Territory',
  'Has_usage_flag',
  'Total Downloads',
  'Total Streams',
  'Currency',
 
]

// gathers data from a month period prior to the provided date.
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const mrvr = async (
  db: Knex,
  s3s: S3Config[],
  date: Date
): Promise<void> => {
  const logger = plogger.child({ date: date.toISOString() })
  logger.info('beginning usage detail report processing')
  const startOfThisMonth = dayjs(date).startOf('month')
  const startOfLastMonth = startOfThisMonth.subtract(1, 'month')

  const start = startOfLastMonth.toDate()
  const end = startOfThisMonth.toDate()

  logger.info(
    { start: start.toISOString(), end: end.toISOString() },
    'time range'
  )

  const affirmative = async () => {
    const mrvrAffirmativeResult = await db.raw(
      `
      
      `,
      { start, end }
    )
  
    const mrvrAffirmativeRows: MrvrAffirmative[] = mrvrAffirmativeResult.rows
    const mrvrAffirmativeCsv = toCsvString(mrvrAffirmativeRows, MrvrAffirmativeHeader)
    if (isDev) {
      logger.info(mrvrAffirmativeCsv)
    }

    const now = new Date();
    // Audius_MRVR_aff_YYMM_YYYYMMDD.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `Audius_MRVR_aff_${getYearMonthShorthand(start)}_${getYearMonthDay(now)}`
  
    const uploads = s3s.map((s3config) =>
      publishToS3(logger, s3config, mrvrAffirmativeCsv, fileName)
    )
    const results = await Promise.allSettled(uploads)
    results.forEach((objUrl) =>
      logger.info({ objUrl, records: mrvrAffirmativeCsv.length }, 'mrvr affirmative upload result')
    )
  }
  // CBS
  const cbs = async () => {
    const mrvrAffirmativeCbs = await db.raw(
      `
      
      `,
      { start, end }
    )

    const mrvrCbsRows: MrvrAffirmative[] = mrvrAffirmativeCbs.rows
    const mrvrCbsCsv = toCsvString(mrvrCbsRows, MrvrCbsHeader)
    if (isDev) {
      logger.info(mrvrCbsCsv)
    }
    const now = new Date();
    // YYYYMM_Audius_yyyymmddThhmmss_summary.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `${getYearMonth(start)}_Audius_${formatDateISO(now)}_summary`

    const uploads = s3s.map((s3config) =>
      publishToS3(logger, s3config, mrvrCbsCsv, fileName)
    )
    const results = await Promise.allSettled(uploads)
    results.forEach((objUrl) =>
      logger.info({ objUrl, records: mrvrCbsCsv.length }, 'mrvr cbs upload result')
    )
  }

  await affirmative()
  await cbs()
}
