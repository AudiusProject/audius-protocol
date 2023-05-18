import { Knex, knex } from "knex"

export default class App {
    // database connections
    dnDb: Knex
    idDb: Knex

    // pg notify handlers
    private listeners: Map<string, ((self: App, msg: any) => Promise<void>)[]>
    // functions that execute on an interval
    private repeaters: ([number, (self: App) => Promise<void>])[]
    // async operations that are evaluated immediately
    private runners: ((self: App) => Promise<void>)[]

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
        this.runners = []
    }

    listen<T>(topic: string, callback: (self: App, msg: T) => Promise<void>): App {
        return this;
    }

    repeat(intervalMs: number, callback: (self: App) => Promise<void>): App {
        return this;
    }
}


