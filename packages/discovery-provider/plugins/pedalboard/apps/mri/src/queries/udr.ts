import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publishToS3 } from '../s3'
import { readConfig } from '../config'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { formatDateISO, getYearMonthShorthand } from '../date'

dayjs.extend(quarterOfYear)

const config = readConfig()
const isDev = config.env === 'dev'

type UsageDetailReporting = {
  client_catalog_id: number
  'Streams - Downloads / Monetized Content Offering': number
  'Streams - Subscription Offerings': number
  'Downloads - Downloads / Monetized Content Offering': number
  'Downloads - Subscription Offerings': number
  Territory: string
}

const UsageDetailReportingHeader: (keyof UsageDetailReporting)[] = [
  'client_catalog_id',
  'Streams - Subscription Offerings',
  'Downloads - Subscription Offerings',
  'Streams - Downloads / Monetized Content Offering',
  'Downloads - Downloads / Monetized Content Offering',
  'Territory'
]

// gathers data from a quarter period prior to the provide\ date.
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const udr = async (
  db: Knex,
  s3s: S3Config[],
  date: Date
): Promise<void> => {
  const logger = plogger.child({ date: date.toISOString() })
  logger.info('beginning usage detail report processing')
  const startOfThisMonth = dayjs(date).startOf('month')
  const endOfLastMonth = startOfThisMonth.subtract(1, 'day')
  const startOfLastMonth = endOfLastMonth.startOf('month')

  const start = startOfLastMonth.toDate()
  const end = startOfThisMonth.toDate()

  logger.info(
    { start: start.toISOString(), end: end.toISOString() },
    'time range'
  )

  const queryResult = await db.raw(
    `
    select
      coalesce(t1.client_catalog_id, t2.client_catalog_id) as "client_catalog_id",
      'Downloads / Monetized Content' as "Offering",
      coalesce(t1."Streams", 0) as "Streams",
      coalesce(t2."Downloads", 0) as "Downloads",
      country_to_iso_alpha2(coalesce(t1."Territory", t2."Territory", '')) as "Territory"
    from (
      select
        "play_item_id" as "client_catalog_id",
        sum("count") as "Streams",
        0 as "Streams - Subscription Offerings",
        "country" as "Territory"
      from
        "aggregate_monthly_plays"
      where
        "timestamp" >= :start and
        "timestamp" < :end
      group by "country", "play_item_id"
    ) t1
    full outer join (
      select
        "parent_track_id" as "client_catalog_id",
        count(*) as "Downloads",
        0 as "Downloads - Subscription Offerings",
        "country" as "Territory"
      from
        "track_downloads"
      where
        "created_at" >= :start and
        "created_at" < :end
      group by "parent_track_id"
    ) t2
    on t1.client_catalog_id = t2.client_catalog_id and (t1."Territory" = t2."Territory" or t2."Territory" = '')
    `,
    { start, end }
  )

  const udrRows: UsageDetailReporting[] = queryResult.rows
  const csv = toCsvString(udrRows, UsageDetailReportingHeader)
  if (isDev) {
    logger.info(csv)
  }
  // Audius_Usage_YYMM_YYYYMMDDhhmmss.csv
  // YYMM = Year and Month of usage, YYYYMMDDhhmmss = time of posting
  const fileName = `Audius_Usage_${getYearMonthShorthand(start)}_${formatDateISO(date)}`

  const uploads = s3s.map((s3config) =>
    publishToS3(logger, s3config, csv, fileName)
  )
  const results = await Promise.allSettled(uploads)
  results.forEach((objUrl) =>
    logger.info({ objUrl, records: udrRows.length }, 'upload result')
  )
}
