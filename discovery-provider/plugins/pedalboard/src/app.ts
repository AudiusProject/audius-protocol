import { Knex, knex } from "knex"
import { setIntervalAsync } from "set-interval-async"
import { Table } from "./models"

export default class App<AppData> {
    // database connections
    private dnDb: Knex
    private idDb?: Knex

    // pg notify handlers
    private listeners: Map<string, ((self: App<AppData>, msg: any) => Promise<void>)[]>
    // table scans
    private scans: Map<string, ((self: App<AppData>, msg: any) => Promise<void>)[]>
    // functions that execute on an interval
    private repeaters: ([number, (self: App<AppData>) => Promise<void>])[]
    // async operations that are evaluated immediately
    private spawns: ((self: App<AppData>) => Promise<void>)[]

    private appData: AppData

    constructor(appData: AppData) {
        this.dnDb = knex({
            client: "pg",
            connection: { connectionString: 'postgresql://postgres:postgres@localhost:5432/audius_discovery' }
        })
        this.idDb = knex({
            client: "pg",
            connection: { connectionString: process.env.IDENTITY_DB_CONN_STRING }
        })

        this.listeners = new Map()
        this.scans = new Map()
        this.repeaters = []
        this.spawns = []
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

    repeat(intervalMs: number, callback: (self: App<AppData>) => Promise<void>): App<AppData> {
        this.repeaters.push([intervalMs, callback])
        return this;
    }

    spawn(func: (self: App<AppData>) => Promise<void>): App<AppData> {
        this.spawns.push(func)
        return this;
    }

    async run(): Promise<void> {
        // setup all handlers
        const listeners = await this.initListenHandlers()
        const repeaters = this.initRepeatHandlers()
        const spawned = this.initSpawnHandlers()
        // const scanners = this.initScanHandlers()

        // run all processes concurrently
        const processes = [...listeners, ...repeaters, ...spawned]
        console.log(`processes ${processes.length}`)

        // drive all processes to completion
        await Promise.allSettled(processes.map(fn => fn()))
    }

    /* External Usage Methods */

    getDnDb(): Knex {
        return this.dnDb
    }

    getIdDb(): Knex {
        if (this.idDb === undefined) throw new Error("identity connection not established")
        return this.idDb
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
        const listeners = []
        const db = this.dnDb
        for (const [topic, handlers] of this.listeners) {
            // package into async fn
            const func = async () => {
                const conn = await db.client.acquireConnection().catch(console.error)
                const sql = `LISTEN ${topic}`
                conn.on("notification", async (msg: any) => {
                    for (const handler of handlers) {
                        await handler(this, JSON.parse(msg.payload)).catch(console.error)
                    }
                })
                await conn.query(sql).catch(console.error);
                console.log(`listening on topic ${topic}`);
            }
            listeners.push(func)
        }
        return listeners
    }

    private initRepeatHandlers(): (() => Promise<void>)[] {
        console.log('init repeaters')
        const repeaters = []
        for (const [interval, callback] of this.repeaters) {
            console.log(`init repeater on ${interval}`)
            const func = async () => {
                setIntervalAsync(async () => {
                    await callback(this).catch(console.error)
                }, interval)
            }
            repeaters.push(func)
        }
        return repeaters
    }

    private initSpawnHandlers(): (() => Promise<void>)[] {
        console.log('init spawns')
        const spawned = []
        for (const spawn of this.spawns) {
            console.log('assembling a spawn')
            const func = async () => {
                await spawn(this).catch(console.error)
            }
            spawned.push(func)
        }
        return spawned
    }
}


