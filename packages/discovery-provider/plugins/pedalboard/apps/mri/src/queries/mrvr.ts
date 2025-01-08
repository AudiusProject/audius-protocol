import fetch from 'cross-fetch'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { Knex } from 'knex'
import { toCsvString } from '../csv'
import { formatDateISO, getYearMonth } from '../date'
import { logger as plogger } from '../logger'
import { S3Config, publish } from '../s3'

dayjs.extend(quarterOfYear)

type MrvrAffirmative = {
  ['Downloads - Gross Revenues without Permitted Deductions']: number
  ['Downloads - Gross Revenues with Permitted Deductions']: number
  ['Downloads - Gross Revenues without Permitted Deductions - USA Only']: number
  ['Downloads - Gross Revenues with Permitted Deductions - USA Only']: number
  ['Downloads - Public Performance Fees']: number
  ['Downloads - Record Label Payments']: number
  ['Subscription - Gross Revenues without Permitted Deductions']: number
  ['Subscription - Gross Revenues with Permitted Deductions']: number
  ['Subscription - Gross Revenues without Permitted Deductions - USA Only']: number
  ['Subscription - Gross Revenues with Permitted Deductions - USA Only']: number
  ['Subscription - Public Performance Fees']: number
  ['Subscription - Record Label Payments']: number
  ['Subscription - Average Subscription Price']: number
  ['Subscription - Total Subscribers']: number
  ['Subscription - Total Subscribers - USA Only']: number
  ['Aggregate Transmission Hours - USA Only']: number
}

type MrvrCbs = {
  Offering: 'Downloads / Monetized Content' | 'Subscription'
  UserType: 'Paid'
  ['Subscriber Count']: 0
  ['Gross Revenue']: number
  ['Gross revenue With Deductions']: number
  Territory: string
  Has_usage_flag: boolean
  'Total Downloads': number
  'Total Streams': number
  Currency: 'USD'
  'Public Performance Fees': number
  'Record Label Payments': number
  'Average Subscription Price': number
  'Aggregate Transmission Hours': number
  'Tip Revenue': number
}

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
  'Public Performance Fees',
  'Record Label Payments',
  'Average Subscription Price',
  'Aggregate Transmission Hours',
  'Tip Revenue'
]

// gathers data from a month period prior to the provided date.
// formats it into csv format compatible with the mri spec
// publishes it to all the provided s3 configs
export const mrvr = async (db: Knex, date: Date): Promise<void> => {
  // Get exchange rate from usd to eur for CBS reporting
  const usdToEurRate = await fetch(
    'https://api.frankfurter.app/latest?base=USD'
  )
    .then((response) => response.json())
    .then((data) => data.rates.EUR)

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

  const cbs = async () => {
    const mrvrCbs = await db.raw(
      `
      with

      countries as (
        select distinct country as "country"
        from usdc_purchases
        where "country" is not null
      ),

      -- granular purchase data
      purchases as (
        select
          content_id,
          country,
          buyer_user_id,
          "amount" / 1000000 as revenue_usd,
          "extra_amount" / 1000000 as tip_usd
        from usdc_purchases
        where content_type = 'track'
          and created_at >= :start
          and created_at < :end
          and "country" is not null
      ),

      -- aggregate downloads by country for purchaseable content
      downloads as (
        select
          country,
          count(*) as download_count,
          sum(duration) as download_ath
        from track_downloads d
        join tracks using (track_id)
        where track_id in (select content_id from purchases)
          and d.created_at >= :start
          and d.created_at < :end
          and "country" is not null
        group by country
      ),

      -- aggregate streams by country for purchaseable content
      streams as (
        select
          country,
          sum(count) as stream_count,
          sum(count * duration) as stream_ath
        from aggregate_monthly_plays
        join tracks on play_item_id = track_id
        where play_item_id in (select content_id from purchases)
          and "timestamp" >= :start
          and "timestamp" < :end
          and "country" is not null
        group by country
      )

      select
        "Offering",
        "UserType",
        "Subscriber Count",
        "Gross Revenue",
        "Gross revenue With Deductions",
        "Territory",
        case when ("Total Downloads" > 0 or "Total Streams" > 0) then true else false end as "Has_usage_flag",
        coalesce("Total Downloads", 0) as "Total Downloads",
        coalesce("Total Streams", 0) as "Total Streams",
        "Currency",

        "Public Performance Fees",
        "Record Label Payments",
        "Average Subscription Price",
        trunc("Aggregate Transmission Hours"::numeric, 2) as "Aggregate Transmission Hours",
        "Tip Revenue"
      from (
        -- paid portion of MRVR
        select
          'Downloads / Monetized Content' as "Offering",
          'Paid' as "UserType",
          count(distinct "buyer_user_id") as "Subscriber Count",
          coalesce(trunc(
            case when
              is_country_eur("country") then sum("revenue_usd") * :usdToEurRate
              else sum("revenue_usd")
            end,
            2
          ), 0) as "Gross Revenue",
          coalesce(trunc(
            case when
              is_country_eur("country") then sum("revenue_usd") * :usdToEurRate
              else sum("revenue_usd")
            end,
            2
          ), 0) as "Gross revenue With Deductions",
          country_to_iso_alpha2(coalesce("country", '')) as "Territory",
          sum(download_count) as "Total Downloads",
          sum(stream_count) as "Total Streams",
          case when
            is_country_eur("country") then 'EUR'
            else 'USD'
          end as "Currency",

          trunc(0, 2) as "Public Performance Fees",
          trunc(0, 2) as "Record Label Payments",
          trunc(0, 2) as "Average Subscription Price",

          sum(coalesce(download_ath, 0) + coalesce(stream_ath, 0))::float / 3600 as "Aggregate Transmission Hours",

          coalesce(trunc(
            case when
              is_country_eur("country") then sum("tip_usd") * :usdToEurRate
              else sum("tip_usd")
            end,
            2
          ), 0) as "Tip Revenue"

        from countries
        left join purchases using (country)
        left join streams using (country)
        left join downloads using (country)
        where "country" is not null
        group by "country"

        union all

        -- free portion of MRVR
        select
          'Downloads / Monetized Content' as "Offering",
          'Free Trial (no payment details)' as "UserType",
          count(distinct user_id) as "Subscriber Count",
          trunc(0, 2) as "Gross Revenue",
          trunc(0, 2) as "Gross revenue With Deductions",
          country_to_iso_alpha2(coalesce(plays."country", '')) as "Territory",
          (
              select count(*)
              from track_downloads td
              where td.created_at >= :start
              and td.created_at < :end
              and td.country = plays."country"
          ) as "Total Downloads",
          count(*) as "Total Streams",
          case when
            is_country_eur("country") then 'EUR'
            else 'USD'
          end as "Currency",

          trunc(0, 2) as "Public Performance Fees",
          trunc(0, 2) as "Record Label Payments",
          trunc(0, 2) as "Average Subscription Price",

          sum(duration)::float / 3600 as "Aggregate Transmission Hours",

          trunc(0, 2) as "Tip Revenue"
        from plays
        join tracks on play_item_id = track_id
        where
          plays.created_at >= :start
          and plays.created_at < :end
          and country is not null
        group by country
      ) subq;
      `,
      { start, end, usdToEurRate }
    )

    const mrvrCbsRows: MrvrAffirmative[] = mrvrCbs.rows
    const mrvrCbsCsv = toCsvString(mrvrCbsRows, MrvrCbsHeader)
    const now = new Date()
    // YYYYMM_Audius_yyyymmddThhmmss_summary.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `inputs/revenue/${getYearMonth(
      start
    )}_Audius_${formatDateISO(now)}_summary.csv`

    const results = await publish(logger, mrvrCbsCsv, fileName)
    results.forEach((objUrl) =>
      logger.info(
        { objUrl, records: mrvrCbsCsv.length },
        'mrvr cbs upload result'
      )
    )
  }

  await cbs()
}
