import { dp_db } from "../db.js";
import { slack } from "../slack.js";

export default async ({ track_id }) => {
  const trackId = track_id;
  const results = await dp_db("tracks")
    .innerJoin("users", "tracks.owner_id", "=", "users.user_id")
    .innerJoin("track_routes", "tracks.track_id", "=", "track_routes.track_id")
    .select(
      "tracks.title",
      "tracks.mood",
      "tracks.genre",
      "tracks.release_date",
      "tracks.is_premium",
      "tracks.owner_id",
      "users.user_id",
      "users.handle",
      "users.name",
      "tracks.track_id",
      "users.is_verified",
      "track_routes.slug",
      "tracks.created_at",
      "tracks.updated_at"
    )
    .where("tracks.track_id", "=", trackId)
    .where("users.is_verified", "=", true)
    .first()
    .catch(console.error);

  console.log(results);

  console.log(results.created_at === results.updated_at);
  console.log(results.created_at == results.updated_at);
  console.log(results && results.created_at === results.updated_at);

  if (results && results.created_at === results.updated_at) {
    const { title, mood, release_date, is_premium, handle, name, genre, slug } =
      results;
    console.log(`received new verified track from ${handle}`);
    const { sendMsg } = slack;
    const header = `:audius-spin: New upload from *${name}* 🔥`;
    const data = {
      Title: title,
      Genre: genre,
      Mood: mood,
      Premium: is_premium,
      Handle: handle,
      Link: `https://audius.co/${handle}/${slug}`,
      Release: release_date,
    };
    await sendMsg(header, data).catch(console.error);
  }
};
