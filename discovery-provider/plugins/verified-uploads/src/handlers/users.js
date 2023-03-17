export default async ({ slack, dp_db, id_db }, { user_id }) => {
  const result = await dp_db("users")
    .select("handle")
    .where("user_id", "=", user_id)
    .first()
    .catch(console.error);

  if (result) {
    const { handle } = result;

    // check identity db in twitter or instagram tables to see
    // which one verified the user

    const header = `:pikawave: a new challenger has appeared! *@${handle}*`;
    const body = {
      userId: user_id,
      handle: handle,
      link: `https://audius.co/${handle}`,
      source: null, // TODO
    };
    await slack.sendMsg(header, body).catch(console.error);
  }
};
