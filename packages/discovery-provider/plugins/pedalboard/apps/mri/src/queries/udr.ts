import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publish } from '../s3'
import { readConfig } from '../config'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { formatDateISO, getYearMonthShorthand } from '../date'

dayjs.extend(quarterOfYear)

const config = readConfig()

type UsageDetailReporting = {
  client_catalog_id: number
  Offering: 'Downloads / Monetized Content' | 'Subscription'
  UserType: string
  Streams: number
  Downloads: number
  Territory: string
  'Price Point': number
}

const UsageDetailReportingHeader: (keyof UsageDetailReporting)[] = [
  'client_catalog_id',
  'Offering',
  'UserType',
  'Streams',
  'Downloads',
  'Territory',
  'Price Point'
]

// gathers data from a month prior to the provided date.
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const udr = async (db: Knex, date: Date): Promise<void> => {
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

  const queryResult = await db.raw(
    `
with

countries as (
  select
    nicename as "country",
    iso as "country_code"
  from countries
  UNION ALL select null, 'WW'
),

purchases as (
  select
    content_id,
    "country_code",
    buyer_user_id,
    "amount" / 1000000 as revenue_usd,
    "extra_amount" / 1000000 as tip_usd
  from usdc_purchases
  join countries using (country)
  where content_type = 'track'
    and created_at >= :start
    and created_at < :end
),

purchase_downloads as (
  select
    track_id,
    coalesce(country_code, 'WW') as country_code,
    count(*) as download_count,
    max(coalesce((download_conditions->'usdc_purchase'->>'price')::float/100, 0.0)) as price
  from track_downloads d
  join countries using (country)
  join tracks using (track_id)
  where track_id in (select content_id from purchases)
    and d.created_at >= :start
    and d.created_at < :end
  group by track_id, country_code
),

free_downloads as (
  select
    track_id,
    coalesce(country_code, 'WW') as country_code,
    count(*) as download_count
  from track_downloads d
  join countries using (country)
  join tracks using (track_id)
  where d.created_at >= :start
    and d.created_at < :end
    and track_id not in (select content_id from purchases)
  group by track_id, country_code
),

free_streams as (
  select
    play_item_id as track_id,
    coalesce(country_code, 'WW') as country_code,
    sum(count) as stream_count
  from aggregate_monthly_plays amp
  left join countries using (country)
  join tracks on play_item_id = track_id
  where "timestamp" >= :start
    and "timestamp" < :end
    and track_id not in (select content_id from purchases)
  group by play_item_id, country_code
),

free_track_ids_by_country as (
  select distinct track_id, country_code from free_downloads
  union
  select distinct track_id, country_code from free_streams
)

-- free portion
select
  track_id as client_catalog_id,
  'Downloads / Monetized Content' as "Offering",
  'Free Trial (no payment details)' as "UserType",
  coalesce(stream_count, 0) as "Streams",
  coalesce(download_count, 0) as "Downloads",
  country_code as "Territory",
  0 as "Price Point"
from
  free_track_ids_by_country
  left join free_streams using (country_code, track_id)
  left join free_downloads using (country_code, track_id)

union all

-- paid portion
select
  track_id as client_catalog_id,
  'Downloads / Monetized Content' as "Offering",
  'Paid' as "UserType",
  0 as "Streams",
  download_count as "Downloads",
  country_code as "Territory",
  price as "Price Point"
from
  purchase_downloads
;


    `,
    { start, end }
  )

  const udrRows: UsageDetailReporting[] = queryResult.rows
  const csv = toCsvString(udrRows, UsageDetailReportingHeader)
  const now = new Date()
  // Audius_Usage_YYMM_YYYYMMDDhhmmss.csv
  // YYMM = Year and Month of usage, YYYYMMDDhhmmss = time of generation
  const fileName = `inputs/usage/Audius_Usage_${getYearMonthShorthand(
    start
  )}_${formatDateISO(now)}.csv`

  const results = await publish(logger, csv, fileName)
  results.forEach((objUrl) =>
    logger.info({ objUrl, records: udrRows.length }, 'upload result')
  )
}
