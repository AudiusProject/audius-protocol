import Knex from "knex";
const { knex } = Knex;

const DB = async (url) => {
  const pg = knex({
    client: "pg",
    connection: url,
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

export default async (url, callback) => {
  const db = await DB(url).catch(console.error);

  // https://github.com/AudiusProject/audius-protocol/blob/186f483a40dd05733442f447e916e005227baedf/discovery-provider/es-indexer/src/setup.ts#L4-L22
  // listens to same hook as es-indexer
  const sql = "LISTEN tracks";

  const notifConn = await db.client.acquireConnection().catch(console.error);
  notifConn.on("notification", async (msg) => {
    // aquire conn here so after handler we can close it
    // no matter the logic inside the handler
    const handlerConn = await db.client.acquireConnection();
    // fire and forget
    callback(handlerConn, JSON.parse(msg.payload));
    handlerConn.releaseConnection(handlerConn);
  });
  await notifConn.query(sql).catch(console.error);
  // TODO for testing, remove this later
  callback(db, null);
};
