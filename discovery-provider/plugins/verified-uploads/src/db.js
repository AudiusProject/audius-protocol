import Knex from "knex";
import dotenv from "dotenv";
const { knex } = Knex;

const DB = async (url) => {
  const pg = knex({
    client: "pg",
    connection: url,
    pool: { min: 2, max: 10 },
  });
  console.log(`opening connection to ${url}`);
  return pg;
};

// GLOBAL db handles
dotenv.config();
const { DISCOVERY_DB_URL } = process.env;
export const dp_db = await DB(DISCOVERY_DB_URL).catch(console.error);

const shouldToggleOff = (topic) => {
  const { TOGGLE_OFF } = process.env;
  const toggledOffTopics = TOGGLE_OFF.split(",");
  const shouldToggle = toggledOffTopics.includes(topic) ? true : false;
  if (shouldToggle) {
    console.warn(`toggling off listener for topic '${topic}'`);
  }
  return shouldToggle;
};

export default async (topic, callback) => {
  if (shouldToggleOff(topic)) {
    return;
  }
  const conn = await dp_db.client.acquireConnection().catch(console.error);
  const sql = `LISTEN ${topic}`;
  conn.on("notification", async (msg) => {
    callback(JSON.parse(msg.payload));
  });
  conn.on("end", (err) => {
    console.log(err);
  });
  conn.on("error", (err) => {
    console.log(err);
  });
  await conn.query(sql).catch(console.error);
  console.log(`listening on topic ${topic}`);
};
