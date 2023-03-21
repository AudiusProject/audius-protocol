import Knex from "knex";
const { knex } = Knex;

const DB = async (url) => {
  const pg = knex({
    client: "pg",
    connection: url,
    // may need to adjust this based on num of listeners
    pool: { min: 0, max: 7 },
  });
  return pg;
};

const shouldToggleOff = (topic) => {
  const { TOGGLE_OFF } = process.env;
  const toggledOffTopics = TOGGLE_OFF.split(",");
  const shouldToggle = toggledOffTopics.includes(topic) ? true : false;
  if (shouldToggle) {
    console.warn(`toggling off listener for topic '${topic}'`);
  }
  return shouldToggle;
};

export default async (topic, passthrough, callback) => {
  if (shouldToggleOff(topic)) {
    return;
  }
  const { DISCOVERY_DB_URL, IDENTITY_DB_URL } = process.env;
  // TODO: create this object once per app
  const dp_db = await DB(DISCOVERY_DB_URL).catch(console.error);
  const id_db = await DB(IDENTITY_DB_URL).catch(console.error);
  const conn = await dp_db.client.acquireConnection().catch(console.error);
  const sql = `LISTEN ${topic}`;
  conn.on("notification", async (msg) => {
    // add db ref to passthrough params so handlers dont need to recreate
    passthrough.dp_db = dp_db;
    passthrough.id_db = id_db;
    // fire and forget, no await
    callback(passthrough, JSON.parse(msg.payload));
  });
  // TODO: close connection here
  await conn.query(sql).catch(console.error);
  console.log(`listening on topic ${topic}`);
};
