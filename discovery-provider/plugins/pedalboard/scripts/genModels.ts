import { knex } from "knex";
import { updateTypes } from "knex-types";

const db = knex({
    connection: ""
});

updateTypes(db, { output: "../src/models.ts" }).catch((err) => {
    console.error(err);
    process.exit(1);
});
