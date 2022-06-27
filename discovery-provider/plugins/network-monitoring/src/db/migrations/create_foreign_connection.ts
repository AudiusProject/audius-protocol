'use-strict'

import type { QueryInterface } from "sequelize"
import type { MigrationParams, RunnableMigration } from "umzug"
import { getEnv } from "../../utils"

const { fdb } = getEnv()

const migration: RunnableMigration<QueryInterface> = {
    name: 'create_foreign_connection',
    up: async (params: MigrationParams<QueryInterface>) => {
        await params.context.sequelize.query(`
        CREATE EXTENSION postgres_fdw;

        CREATE SERVER fdw_server_connection
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (dbname :dbName, host :dbHost, port :dbPort);

        CREATE USER MAPPING FOR postgres
        SERVER fdw_server_connection
        OPTIONS (user :dbUsername, password :dbPassword);

        IMPORT FOREIGN SCHEMA "public" limit to (users, tracks, blocks, ursm_content_nodes) FROM SERVER fdw_server_connection INTO public;
      `, {
            replacements: {
                dbName: fdb.name,
                dbHost: fdb.host,
                dbPort: fdb.port,
                dbUsername: fdb.username,
                dbPassword: fdb.password,
            }
        })
    },
    down: async (_: MigrationParams<QueryInterface>) => {
        return
    }
}

export default migration;
