import Knex from "knex";
const { knex } = Knex;

const DB = async (url) => {
  const pg = knex({
    client: "pg",
    connection: url,
    pool: { min: 0, max: 7 },
  });
  // get a user just to test connection is working
  await pg
    .select("user_id", "handle", "is_verified", "name")
    .from("users")
    .where("user_id", 1)
    .first()
    .catch(console.error);
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
  const { DB_URL } = process.env;
  // TODO: create this object once per app
  const db = await DB(DB_URL).catch(console.error);
  const conn = await db.client.acquireConnection().catch(console.error);
  const sql = `LISTEN ${topic}`;
  conn.on("notification", async (msg) => {
    console.log(`listening on topic ${topic}`);
    // fire and forget, no await
    passthrough.db = db;
    callback(passthrough, JSON.parse(msg.payload));
  });
  // TODO: close connection here
  await conn.query(sql).catch(console.error);
};
