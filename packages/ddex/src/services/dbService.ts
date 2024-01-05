import postgres from 'postgres'

export const createDbService = (dbUrl: string) => {
  const sql = postgres(dbUrl)

  return {
    sql,
  }
}
