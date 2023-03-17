export default async ({ slack, db }, { user_id }) => {
  const user = await db("users")
    .select("handle", "name")
    .where("user_id", "=", user_id)
    .first()
    .catch(console.error);

  if (user) {
  }
};
