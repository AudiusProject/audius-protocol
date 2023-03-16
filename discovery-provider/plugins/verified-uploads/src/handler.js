export default async (db, trackId) => {
  const results = await db("tracks")
    .innerJoin("users", "tracks.owner_id", "=", "users.user_id")
    .select(
      "tracks.title",
      "tracks.mood",
      "tracks.release_date",
      "tracks.is_premium",
      "tracks.route_id",
      "tracks.owner_id",
      "users.user_id",
      "tracks.track_id",
      "users.is_verified"
    )
    .where("tracks.track_id", "=", trackId)
    .where("users.is_verified", "=", true)
    .first()
    .catch(console.error);

  if (results) {
    console.log("verified track found");
  }
};
