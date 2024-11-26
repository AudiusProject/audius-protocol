import { Knex } from 'knex'
import { logger as plogger } from '../logger'
import { toCsvString } from '../csv'
import { S3Config, publish } from '../s3'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { formatDateISO, getYearMonth, getYearMonthDay, getYearMonthShorthand } from '../date'
import fetch from 'cross-fetch'

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
  'Offering': 'Downloads / Monetized Content' | 'Subscription'
  'UserType': 'Paid'
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
  'Subscription - Gross Revenues without Permitted Deductions',
  'Subscription - Gross Revenues with Permitted Deductions',
  'Subscription - Gross Revenues without Permitted Deductions - USA Only',
  'Subscription - Gross Revenues with Permitted Deductions - USA Only',
  'Subscription - Public Performance Fees',
  'Subscription - Record Label Payments',
  'Subscription - Average Subscription Price',
  'Subscription - Total Subscribers',
  'Subscription - Total Subscribers - USA Only',
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
  // Get exchange rate from usd to eur for CBS reporting
  const usdToEurRate = await fetch('https://api.frankfurter.app/latest?base=USD')
    .then(response => response.json())
    .then(data => data.rates.EUR)

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
      select
        revenue."Downloads - Gross Revenues without Permitted Deductions",
        revenue."Downloads - Gross Revenues with Permitted Deductions",
        revenue."Downloads - Gross Revenues without Permitted Deductions - USA Only",
        revenue."Downloads - Gross Revenues with Permitted Deductions - USA Only",
        revenue."Downloads - Public Performance Fees",
        revenue."Downloads - Record Label Payments",
        revenue."Subscription - Gross Revenues without Permitted Deductions",
        revenue."Subscription - Gross Revenues with Permitted Deductions",
        revenue."Subscription - Gross Revenues without Permitted Deductions - USA Only",
        revenue."Subscription - Gross Revenues with Permitted Deductions - USA Only",
        revenue."Subscription - Public Performance Fees",
        revenue."Subscription - Record Label Payments",
        revenue."Subscription - Average Subscription Price",
        revenue."Subscription - Total Subscribers",
        revenue."Subscription - Total Subscribers - USA Only",
        ath."Aggregate Transmission Hours - USA Only"
      from
        (
          select
            trunc(sum(("amount" + "extra_amount") / 1000000), 2) as "Downloads - Gross Revenues without Permitted Deductions",
            trunc(sum(("amount" + "extra_amount") / 1000000), 2) as "Downloads - Gross Revenues with Permitted Deductions",
            trunc(sum(
              case
                when "country" = 'United States'
                then ("amount" + "extra_amount") / 1000000
                else 0
              end
            ), 2) as "Downloads - Gross Revenues without Permitted Deductions - USA Only",
            trunc(sum(
              case
                when "country" = 'United States'
                then ("amount" + "extra_amount") / 1000000
                else 0
              end
            ), 2) as "Downloads - Gross Revenues with Permitted Deductions - USA Only",
            trunc(0, 2) as "Downloads - Public Performance Fees",
            trunc(0, 2) as "Downloads - Record Label Payments",
            trunc(0, 2) as "Subscription - Gross Revenues without Permitted Deductions",
            trunc(0, 2) as "Subscription - Gross Revenues with Permitted Deductions",
            trunc(0, 2) as "Subscription - Gross Revenues without Permitted Deductions - USA Only",
            trunc(0, 2) as "Subscription - Gross Revenues with Permitted Deductions - USA Only",
            trunc(0, 2) as "Subscription - Public Performance Fees",
            trunc(0, 2) as "Subscription - Record Label Payments",
            trunc(0, 2) as "Subscription - Average Subscription Price",
            trunc(0, 2) as "Subscription - Total Subscribers",
            trunc(0, 2) as "Subscription - Total Subscribers - USA Only"
          from "usdc_purchases"
          where
            "created_at" >= :start
            and "created_at" < :end
        ) as revenue
        cross join
        (
          select
            sum(cast("count" * "duration" as float) / 3600.0) as "Aggregate Transmission Hours - USA Only"
          from (
            select
              "tracks"."duration" as "duration",
              "aggregate_monthly_plays"."count" as "count"
            from
              "tracks"
            join
              "aggregate_monthly_plays" on "tracks"."track_id" = "aggregate_monthly_plays"."play_item_id"
            where
              "aggregate_monthly_plays"."country" = 'United States'
              and "timestamp" >= :start
              and "timestamp" < :end
          ) as ath_data
        ) as ath;
      `,
      { start, end }
    )
  
    const mrvrAffirmativeRows: MrvrAffirmative[] = mrvrAffirmativeResult.rows
    const mrvrAffirmativeCsv = toCsvString(mrvrAffirmativeRows, MrvrAffirmativeHeader)

    const now = new Date();
    // Audius_MRVR_aff_YYMM_YYYYMMDD.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `Audius_MRVR_aff_${getYearMonthShorthand(start)}_${getYearMonthDay(now)}`
  
    const results = await publish(
      logger,
      s3s,
      mrvrAffirmativeCsv,
      fileName
    )
    results.forEach((objUrl) =>
      logger.info({ objUrl, records: mrvrAffirmativeCsv.length }, 'mrvr affirmative upload result')
    )
  }
  // CBS
  const cbs = async () => {
    const mrvrCbs = await db.raw(
      `
      -- granular purchase data
      with purchases as (
        select
          content_id,
          country,
          buyer_user_id,
          ("amount" + "extra_amount") / 1000000 as usd
        from usdc_purchases
        where content_type = 'track'
          and created_at >= :start
          and created_at < :end
          and "country" is not null
      ),

      -- aggregate downloads by country for purchaseable content
      downloads as (
        select country, count(*) as download_count
        from track_downloads
        where track_id in (select content_id from purchases)
          and created_at >= :start
          and created_at < :end
          and "country" is not null
        group by country
      ),

      -- aggregate streams by country for purchaseable content
      streams as (
        select country, sum(count) as stream_count
        from aggregate_monthly_plays
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
        "Currency"
      from (
        -- paid portion of MRVR
        select
          'Downloads / Monetized Content' as "Offering",
          'Paid' as "UserType",
          count(distinct "buyer_user_id") as "Subscriber Count",
          trunc(
            case when
              is_country_eur("country") then sum("usd") * :usdToEurRate
              else sum("usd")
            end,
            2
          ) as "Gross Revenue",
          trunc(
            case when
              is_country_eur("country") then sum("usd") * :usdToEurRate
              else sum("usd")
            end,
            2
          ) as "Gross revenue With Deductions",
          country_to_iso_alpha2(coalesce("country", '')) as "Territory",
          (
            select coalesce(download_count, 0)
            from downloads td
            where td.country = purchases.country
          ) as "Total Downloads",
          (
            select coalesce(stream_count, 0)
            from streams s
            where s.country = purchases.country
          ) as "Total Streams",
          case when
            is_country_eur("country") then 'EUR'
            else 'USD'
          end as "Currency"
        from purchases
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
          'USD' as "Currency"
        from plays
        where
          created_at >= :start
          and created_at < :end
          and country is not null
        group by country
      ) subq;
      `,
      { start, end, usdToEurRate }
    )

    const mrvrCbsRows: MrvrAffirmative[] = mrvrCbs.rows
    const mrvrCbsCsv = toCsvString(mrvrCbsRows, MrvrCbsHeader)
    const now = new Date();
    // YYYYMM_Audius_yyyymmddThhmmss_summary.csv
    // YYMM = Year and Month of usage, YYYYMMDD = time of generation
    const fileName = `${getYearMonth(start)}_Audius_${formatDateISO(now)}_summary`

    const results = await publish(
      logger,
      s3s,
      mrvrCbsCsv,
      fileName
    )
    results.forEach((objUrl) =>
      logger.info({ objUrl, records: mrvrCbsCsv.length }, 'mrvr cbs upload result')
    )
  }

  await affirmative()
  await cbs()
}
