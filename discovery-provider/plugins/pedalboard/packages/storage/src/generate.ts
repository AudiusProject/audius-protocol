import { knex } from "knex";
import { updateTypes } from "knex-types";

const connection = process.env.DB_CONNECTION_STRING || "postgresql://postgres:postgres@localhost:5432/audius_discovery"

const db = knex({
    client: "pg",
    connection
});

updateTypes(db, { output: "./src/index.ts" }).catch((err) => {
    console.error(err);
    process.exit(1);
});
