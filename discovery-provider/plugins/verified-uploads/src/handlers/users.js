export default async ({ slack, db }, { user_id }) => {
  const result = await db("users")
    .select("handle", "name")
    .where("user_id", "=", user_id)
    .first()
    .catch(console.error);

  if (result) {
    const { handle, name } = result;
    const header = `:pikawave: a new challenger has appeared! *@${handle}*`;
    const body = {
      Id: user_id,
      Name: name,
      Handle: handle,
    };
    await slack.sendMsg(header, body).catch(console.error);
  }
};
