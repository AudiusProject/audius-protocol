export default async ({ slack, db }, { user_id }) => {
  const result = await db("users")
    .select("handle")
    .where("user_id", "=", user_id)
    .first()
    .catch(console.error);

  if (result) {
    const { handle } = result;
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
