import { Knex, knex } from "knex"
import { setIntervalAsync } from "set-interval-async"

export default class App {
    // database connections
    private dnDb: Knex
    private idDb: Knex

    // pg notify handlers
    private listeners: Map<string, ((self: App, msg: any) => Promise<void>)[]>
    // functions that execute on an interval
    private repeaters: ([number, (self: App) => Promise<void>])[]
    // async operations that are evaluated immediately
    private spawns: ((self: App) => Promise<void>)[]

    constructor() {
        this.dnDb = knex({
            client: "pg",
            connection: { connectionString: process.env.DISCPROV_DB_CONN_STRING }
        })
        this.idDb = knex({
            client: "pg",
            connection: { connectionString: process.env.IDENTITY_DB_CONN_STRING }
        })

        this.listeners = new Map()
        this.repeaters = []
        this.spawns = []
    }

    /* External Builder Methods */

    listen<T>(topic: string, callback: (self: App, msg: T) => Promise<void>): App {
        const listener = this.listeners.get(topic)
        if (listener === undefined) this.listeners.set(topic, [callback])
        else {
            // push then re-insert
            listener.push(callback)
            this.listeners.set(topic, listener)
        }
        return this;
    }

    repeat(intervalMs: number, callback: (self: App) => Promise<void>): App {
        this.repeaters.push([intervalMs, callback])
        return this;
    }

    spawn(func: (self: App) => Promise<void>): App {
        this.spawns.push(func)
        return this;
    }

    async run(): Promise<void> {
        /**
         * Establish PG notify and DB connections here
         */

        // setup all handlers
        const listeners = await this.initListenHandlers()
        const repeaters = this.initRepeatHandlers()
        const spawned = this.initSpawnHandlers()

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
        return this.idDb
    }

    /* Internal Builder Methods */

    private async initListenHandlers(): Promise<(() => Promise<void>)[]> {
        const listeners = []
        const db = this.dnDb
        for (const [topic, handlers] of this.listeners) {
            const conn = db.client.acquireConnection().catch(console.error)
            const sql = `LISTEN ${topic}`

            // package into async fn
            const func = async () => {
                conn.on("notification", async (msg: any) => {
                    for (const handler of handlers) {
                        await handler(this, JSON.parse(msg.payload)).catch(console.error)
                    }
                })
            }
            await conn.query(sql).catch(console.error);
            console.log(`listening on topic ${topic}`);
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


