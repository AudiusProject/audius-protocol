/**
 * Collection of database initialization utilities. Can be used in the app module or standalone.
 */

import knex, { Knex } from "knex";

/**
 * Establishes a connection to the discovery database. Starts out using the passed in connection string,
 * then attempts to use `audius_db_url` env var, and lastly defaults to 'postgresql://postgres:postgres@db:5432/audius_discovery'.
 * @param connectionString optional param to pass in a specific database url
 * @returns knex object that's connected to the configured url
 */
export const initializeDiscoveryDb = (connectionString?: string): Knex => {
    // will first use connection string, next try env var, third default to local pg string
    const connection = connectionString || process.env.audius_db_url || "postgresql://postgres:postgres@db:5432/audius_discovery"
    return knex({
        client: "pg",
        connection,
    })
}

/**
 * Establishes a connection to the discovery database. Starts out using the passed in connection string,
 * then attempts to use `identity_db_url` env var, and lastly defaults to 'postgresql://postgres:postgres@db:5432/audius_identity_service'.
 * @param connectionString optional param to pass in a specific database url
 * @returns knex object that's connected to the configured url
 */
export const initializeIdentityDb = (connectionString?: string): Knex => {
    // will first use connection string, next try env var, third default to local pg string
    const connection = connectionString || process.env.identity_db_url || "postgresql://postgres:postgres@db:5432/audius_identity_service"
    return knex({
        client: "pg",
        connection,
    })
}

/**
 * Creates a listener on a pg_notify topic and sends messages back to an async callback for any usage the implementor may need.
 * @param db A knex connection to a postgres db.
 * @param onMessage Callback that takes an async function and passes the typed message to it.
 */
export const listenOn = async <T>(db: Knex, onMessage: (db: Knex, msg: T) => Promise<void>): Promise<void> => {
    const conn = await db.client.acquireConnection()
    conn.on("notification", async (msg: any) => {
        console.log(JSON.stringify(msg));
        const { payload } = msg;
        await onMessage(db, JSON.parse(payload))
    });
}
