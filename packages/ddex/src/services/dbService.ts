import type { Sql } from 'postgres'
import postgres from 'postgres'
import crypto from 'crypto'

export const createDbService = async (dbUrl: string): Promise<Sql> => {
  const sql = postgres(dbUrl)

  const runMigrations = async () => {
    await sql`CREATE TABLE IF NOT EXISTS migrations (hash TEXT PRIMARY KEY)`
    const migrationsTable = await sql`SELECT * FROM migrations`
    const migrationsHashes = migrationsTable.map((m: any) => m.hash)

    const migrationsHash = (s: string) =>
      crypto.createHash('sha256').update(s).digest('hex')

    const runMigration = async (migration: string) => {
      const hash = migrationsHash(migration)
      if (migrationsHashes.includes(hash)) return
      await sql.unsafe(migration)
      await sql`INSERT INTO migrations (hash) VALUES (${hash})`
    }

    // TODO: Make statuses enums
    const migrations = [
      `CREATE TABLE IF NOT EXISTS xml_files (
        id SERIAL PRIMARY KEY,
        uploaded_by INTEGER NOT NULL,
        uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        from_zip_file UUID,
        xml_contents TEXT NOT NULL,
        status TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS releases (
        id SERIAL PRIMARY KEY,
        from_xml_file INTEGER NOT NULL,
        release_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        data JSON NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (from_xml_file) REFERENCES xml_files(id)
      );`,
    ]

    for (const migration of migrations) {
      await runMigration(migration)
    }
  }

  await runMigrations()

  return sql
}
