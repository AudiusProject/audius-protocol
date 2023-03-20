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
    const ig = await id_db("InstagramUsers")
      .select("blockchainUserId")
      .where("blockchainUserId", "=", user_id)
      .first()
      .catch(console.error);

    const twitter = await id_db("TwitterUsers")
      .select("blockchainUserId")
      .where("blockchainUserId", "=", user_id)
      .first()
      .catch(console.error);

    const tiktok = await id_db("TikTokUsers")
      .select("blockchainUserId")
      .where("blockchainUserId", "=", user_id)
      .first()
      .catch(console.error);

    let source = "unknown";
    switch ((ig, twitter, tiktok)) {
      case (undefined, undefined, tiktok):
        source = "tiktok";
        break;
      case (undefined, twitter, undefined):
        source = "twitter";
        break;
      case (ig, undefined, undefined):
        source = "instagram";
        break;
    }

    const header = `:pikawave: a new challenger has appeared! *@${handle}*`;
    const body = {
      userId: user_id,
      handle: handle,
      link: `https://audius.co/${handle}`,
      source,
    };
    await slack.sendMsg(header, body).catch(console.error);
  }
};
