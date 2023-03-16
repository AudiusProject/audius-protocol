export default async (db, trackId) => {
  const result = await db
    .select("track_id", "title", "mood", "release_date", "is_premium")
    .from("tracks")
    .where("owner_id", 1);
  console.log(result);
};
