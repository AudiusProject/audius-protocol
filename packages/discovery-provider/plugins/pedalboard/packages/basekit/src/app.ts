import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { Knex, knex } from 'knex'
import { setIntervalAsync } from 'set-interval-async'
import { Table } from '@pedalboard/storage'
import { initializeDiscoveryDb } from './db'

dayjs.extend(duration)

export type AppParams<AppData> = {
  appData?: AppData
  discoveryDb?: Knex
  identityDb?: Knex
}

export default class App<AppData = Map<string, string>> {
  // database connections
  private discoveryDb: Knex
  private identityDb?: Knex

  // pg notify handlers
  private listeners: Map<
    string,
    ((self: App<AppData>, msg: any) => Promise<void>)[]
  >
  // table scans
  private scans: Map<
    string,
    ((self: App<AppData>, msg: any) => Promise<void>)[]
  >
  // functions that execute on an interval
  private tickers: [number, (self: App<AppData>) => Promise<void>][]
  // async operations that are evaluated immediately
  private tasks: ((self: App<AppData>) => Promise<void>)[]

  private appData: AppData

  constructor(params?: AppParams<AppData>) {
    const { discoveryDb, identityDb, appData } = params || {}
    this.discoveryDb = discoveryDb || initializeDiscoveryDb()
    this.identityDb = identityDb
    this.listeners = new Map()
    this.scans = new Map()
    this.tickers = []
    this.tasks = []
    this.appData = (appData || new Map()) as AppData
  }

  /* External Builder Methods */

  listen<T>(
    topic: string,
    callback: (self: App<AppData>, msg: T) => Promise<void>
  ): App<AppData> {
    const listener = this.listeners.get(topic)
    if (listener === undefined) this.listeners.set(topic, [callback])
    else {
      // push then re-insert
      listener.push(callback)
      this.listeners.set(topic, listener)
    }
    return this
  }

  scan<T>(
    table: Table,
    callback: (self: App<AppData>, row: T) => Promise<void>
  ): App<AppData> {
    throw new Error('Scan not implemented yet.')
  }

  tick(
    interval: Partial<{
      milliseconds: number
      seconds: number
      minutes: number
      hours: number
      days: number
      months: number
      years: number
      weeks: number
    }>,
    callback: (self: App<AppData>) => Promise<void>
  ): App<AppData> {
    const intervalMs = dayjs.duration(interval).asMilliseconds()
    this.tickers.push([intervalMs, callback])
    return this
  }

  cron(
    condition: (self: App<AppData>) => boolean,
    callback: (self: App<AppData>) => Promise<void>
  ): App<AppData> {
    const job = async (self: App<AppData>): Promise<void> => {
      if (!condition(self)) return
      return callback(self)
    }
    return this.tick({ milliseconds: 1000 }, job)
  }

  task(func: (self: App<AppData>) => Promise<void>): App<AppData> {
    this.tasks.push(func)
    return this
  }

  async run(): Promise<void> {
    // setup all handlers
    const listeners = await this.initListenHandlers()
    const repeaters = this.initTickerHandlers()
    const spawned = this.initTaskHandlers()
    // const scanners = this.initScanHandlers()

    // run all processes concurrently
    const processes = [...listeners, ...repeaters, ...spawned]
    console.log(`Running app with ${processes.length} processes`)

    // drive all processes to completion
    await Promise.allSettled(processes.map((fn) => fn()))
  }

  /* External Usage Methods */

  getDnDb(): Knex {
    return this.discoveryDb
  }

  getIdDb(): Knex {
    if (this.identityDb === undefined)
      throw new Error('identity connection not established')
    return this.identityDb
  }

  updateAppData(func: (data: AppData) => AppData) {
    const newAppData = func(this.appData)
    this.appData = newAppData
  }

  viewAppData(): Readonly<AppData> {
    return this.appData
  }

  // spawns a synchronous task in a non blocking fashion
  // good for long running CPU bound operations
  async spawn<T>(task: () => T): Promise<T> {
    throw new Error('Spawn not implemented yet')
  }

  /* Internal Builder Methods */

  private async initListenHandlers(): Promise<(() => Promise<void>)[]> {
    const db = this.discoveryDb
    if (db === undefined) return []
    const func = async () => {
      const conn = await db.client.acquireConnection().catch(console.error)
      conn.on('notification', async (msg: any) => {
        console.log(JSON.stringify(msg, null, 2))
        const { channel, payload } = msg
        const handlers = this.listeners.get(channel)
        if (handlers !== undefined) {
          await Promise.allSettled(
            handlers.map((handler) => handler(this, JSON.parse(payload)))
          ).catch(console.error)
        }
      })
      await Promise.allSettled(
        Array.from(this.listeners).map(([key, _val]) =>
          conn.query(`LISTEN ${key}`)
        )
      ).catch(console.error)
    }
    return [func]
  }

  private initTickerHandlers(): (() => Promise<void>)[] {
    const tickers = []
    for (const [interval, callback] of this.tickers) {
      // Dispatch single tick so that we trigger on the "leading edge"
      callback(this).catch(console.error)
      const func = async () => {
        setIntervalAsync(async () => {
          await callback(this).catch(console.error)
        }, interval)
      }
      tickers.push(func)
    }
    return tickers
  }

  private initTaskHandlers(): (() => Promise<void>)[] {
    const spawned = []
    for (const task of this.tasks) {
      const func = async () => {
        await task(this).catch(console.error)
      }
      spawned.push(func)
    }
    return spawned
  }
}
