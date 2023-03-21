export default async ({ slack, dp_db, id_db }, { user_id }) => {
  const result = await dp_db("users")
    .select("handle", "is_verified")
    .where("user_id", "=", user_id)
    .orderBy("blocknumber", "desc")
    .limit(2)
    .catch(console.error);

  const current = result[0];
  const old = result[1];

  console.log(`user event ${JSON.stringify(result)}`);
  if (result.length == 2 && current.is_verified !== old.is_verified) {
    const is_verified = current.is_verified;
    const handle = current.handle;
    const header = `User ${handle} ${
      is_verified ? "is now" : "is no longer"
    } verified.`;

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

    if (ig) {
      source = "instagram";
    }

    if (twitter) {
      source = "twitter";
    }

    if (tiktok) {
      source = "tiktok";
    }

    const body = {
      userId: user_id,
      handle,
      link: `https://audius.co/${handle}`,
      source,
    };
    await slack.sendMsg(header, body).catch(console.error);
  }
};
