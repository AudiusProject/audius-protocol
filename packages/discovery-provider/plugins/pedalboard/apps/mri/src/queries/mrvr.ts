import fetch from 'cross-fetch'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { Knex } from 'knex'
import { toCsvString } from '../csv'
import { formatDateISO, getYearMonth } from '../date'
import { logger as plogger } from '../logger'
import { publish } from '../s3'

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
        select
          nicename as "country",
          iso as "country_code"
        from countries
        UNION ALL select null, 'WW'
      ),

      -- granular purchase data
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

      -- aggregate downloads by country for purchaseable content
      purchase_downloads as (
        select
          "country_code",
          count(*) as download_count,
          sum(duration) as download_ath
        from track_downloads d
        join countries using (country)
        join tracks using (track_id)
        where track_id in (select content_id from purchases)
          and d.created_at >= :start
          and d.created_at < :end
        group by country_code
      ),

            -- aggregate downloads by country for purchaseable content
      free_downloads as (
        select
          "country_code",
          count(*) as download_count,
          sum(duration) as download_ath
        from track_downloads d
        join countries using (country)
        join tracks using (track_id)
        where d.created_at >= :start
          and d.created_at < :end
        group by country_code
      ),

      -- aggregate streams by country for purchaseable content
      free_streams as (
        select
          coalesce(country_code, 'WW') as country_code,
          count(distinct play_item_id) as track_count,
          sum(count) as stream_count,
          sum(count * duration) as stream_ath
        from aggregate_monthly_plays amp
        left join countries using (country)
        join tracks on play_item_id = track_id
        where "timestamp" >= :start
          and "timestamp" < :end
        group by country_code
      )


      select
        "Offering",
        "UserType",
        coalesce("Subscriber Count", 0) as "Subscriber Count",
        "Gross Revenue",
        "Gross revenue With Deductions",
        country_code as "Territory",
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
              is_country_eur("country_code") then sum("revenue_usd") * :usdToEurRate
              else sum("revenue_usd")
            end,
            2
          ), 0) as "Gross Revenue",
          coalesce(trunc(
            case when
              is_country_eur("country_code") then sum("revenue_usd") * :usdToEurRate
              else sum("revenue_usd")
            end,
            2
          ), 0) as "Gross revenue With Deductions",
          country_code,
          sum(download_count) as "Total Downloads",
          sum(download_count) as "Total Streams",
          case when
            is_country_eur("country_code") then 'EUR'
            else 'USD'
          end as "Currency",

          trunc(0, 2) as "Public Performance Fees",
          trunc(0, 2) as "Record Label Payments",
          trunc(0, 2) as "Average Subscription Price",

          sum(coalesce(download_ath, 0))::float / 3600 as "Aggregate Transmission Hours",

          coalesce(trunc(
            case when
              is_country_eur("country_code") then sum("tip_usd") * :usdToEurRate
              else sum("tip_usd")
            end,
            2
          ), 0) as "Tip Revenue"

        from countries
        left join purchases using (country_code)
        left join purchase_downloads using (country_code)
        group by country_code

        union all

        -- free portion of MRVR
        select
          'Downloads / Monetized Content' as "Offering",
          'Free Trial (no payment details)' as "UserType",
          track_count / 2::int as "Subscriber Count", -- since we don't have user location atm, estimate regional users based on unique play_item_id
          trunc(0, 2) as "Gross Revenue",
          trunc(0, 2) as "Gross revenue With Deductions",
          country_code,
          download_count as "Total Downloads",
          stream_count as "Total Streams",
          case when
            is_country_eur(country_code) then 'EUR'
            else 'USD'
          end as "Currency",

          trunc(0, 2) as "Public Performance Fees",
          trunc(0, 2) as "Record Label Payments",
          trunc(0, 2) as "Average Subscription Price",

          coalesce(download_ath, 0) + coalesce(stream_ath, 0)::float / 3600 as "Aggregate Transmission Hours",

          trunc(0, 2) as "Tip Revenue"
        from countries
        left join free_streams using (country_code)
        left join free_downloads using (country_code)
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
