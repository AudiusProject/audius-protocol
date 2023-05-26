import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import { Knex, knex } from "knex"
import { setIntervalAsync } from "set-interval-async"
import { Table } from "storage"

dayjs.extend(duration)

export default class App<AppData> {
    // database connections
    private discoveryDb: Knex
    private identityDb?: Knex

    // pg notify handlers
    private listeners: Map<string, ((self: App<AppData>, msg: any) => Promise<void>)[]>
    // table scans
    private scans: Map<string, ((self: App<AppData>, msg: any) => Promise<void>)[]>
    // functions that execute on an interval
    private repeaters: ([number, (self: App<AppData>) => Promise<void>])[]
    // async operations that are evaluated immediately
    private tasks: ((self: App<AppData>) => Promise<void>)[]

    private appData: AppData

    constructor(appData: AppData) {
        this.discoveryDb = knex({
            client: "pg",
            connection: { connectionString: 'postgresql://postgres:postgres@localhost:5432/audius_discovery' }
        })
        this.listeners = new Map()
        this.scans = new Map()
        this.repeaters = []
        this.tasks = []
        this.appData = appData
    }

    /* External Builder Methods */

    listen<T>(topic: string, callback: (self: App<AppData>, msg: T) => Promise<void>): App<AppData> {
        const listener = this.listeners.get(topic)
        if (listener === undefined) this.listeners.set(topic, [callback])
        else {
            // push then re-insert
            listener.push(callback)
            this.listeners.set(topic, listener)
        }
        return this;
    }

    scan<T>(table: Table, callback: (self: App<AppData>, row: T) => Promise<void>): App<AppData> {
        const scanner = this.scans.get(table)
        if (scanner === undefined) this.scans.set(table, [callback])
        else {
            // push then re-insert
            scanner.push(callback)
            this.scans.set(table, scanner)
        }
        return this;
    }

    // Maybe rename to "cron"?
    cron(interval: Partial<{
        milliseconds: number;
        seconds: number;
        minutes: number;
        hours: number;
        days: number;
        months: number;
        years: number;
        weeks: number;
    }>, callback: (self: App<AppData>) => Promise<void>): App<AppData> {
        const intervalMs = dayjs.duration(interval).asMilliseconds()
        this.repeaters.push([intervalMs, callback])
        return this;
    }

    // Maybe rename to "task"?
    task(func: (self: App<AppData>) => Promise<void>): App<AppData> {
        this.tasks.push(func)
        return this;
    }

    async run(): Promise<void> {
        // setup all handlers
        const listeners = await this.initListenHandlers()
        const repeaters = this.initRepeatHandlers()
        const spawned = this.initTaskHandlers()
        // const scanners = this.initScanHandlers()

        // run all processes concurrently
        const processes = [...listeners, ...repeaters, ...spawned]
        console.log(`processes ${processes.length}`)

        // drive all processes to completion
        await Promise.allSettled(processes.map(fn => fn()))
    }

    /* External Usage Methods */

    getDnDb(): Knex {
        return this.discoveryDb
    }

    getIdDb(): Knex {
        if (this.identityDb === undefined) throw new Error("identity connection not established")
        return this.identityDb
    }

    updateAppData(func: (data: AppData) => AppData) {
        const newAppData = func(this.appData)
        this.appData = newAppData
    }

    viewAppData(): Readonly<AppData> {
        return this.appData
    }

    /* Internal Builder Methods */

    private async initListenHandlers(): Promise<(() => Promise<void>)[]> {
        const db = this.discoveryDb
        const func = async () => {
            const conn = await db.client.acquireConnection().catch(console.error)
            conn.on("notification", async (msg: any) => {
                console.log(JSON.stringify(msg))
                const { channel, payload } = msg
                const handlers = this.listeners.get(channel)
                if (handlers !== undefined) {
                    await Promise.allSettled(handlers.map((handler) => handler(this, JSON.parse(payload)))).catch(console.error)
                }
            })
            await Promise.allSettled(Array.from(this.listeners).map(([key, _val]) => conn.query(`LISTEN ${key}`))).catch(console.error)
        }
        return [func]
    }

    private initRepeatHandlers(): (() => Promise<void>)[] {
        const repeaters = []
        for (const [interval, callback] of this.repeaters) {
            const func = async () => {
                setIntervalAsync(async () => {
                    await callback(this).catch(console.error)
                }, interval)
            }
            repeaters.push(func)
        }
        return repeaters
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

