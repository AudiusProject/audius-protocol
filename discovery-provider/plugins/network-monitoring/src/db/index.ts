
import { Sequelize } from 'sequelize'
import { SequelizeStorage, Umzug } from 'umzug'
import create_foreign_connection from './migrations/create_foreign_connection'
import create_tables from './migrations/create_tables'

// FIXME: Pull in env vars more robustly
const db = {
  name: process.env['DB_NAME'] || '',
  host: process.env['DB_HOST'] || '',
  port: parseInt(process.env['DB_PORT'] || ''),
  username: process.env['DB_USERNAME'] || '',
  password: process.env['DB_PASSWORD'] || '',
  sql_logger: (process.env['SQL_LOGGING'] || '') in ['T', 't', 'True', 'true', '1']
}

const dbConnectionPoolMax: number = 100

export const sequelizeConn = new Sequelize(
  db.name,
  db.username,
  db.password,
  {
    host: db.host,
    port: db.port,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: dbConnectionPoolMax,
      min: 5,
      acquire: 60000,
      idle: 10000
    }
  })

export const verifyDBConnection = async () => {
  try {
    console.info('Verifying DB connection...')
    await sequelizeConn.authenticate() // runs SELECT 1+1 AS result to check db connection
    console.info('DB connected successfully!')
  } catch (connectionError) {
    throw new Error('Error connecting to DB: ' + connectionError)
  }
}

export const runDBMigrations = async () => {
  try {
    console.info('Executing database migrations...')
    await runMigrations()
    console.info('Migrations completed successfully')
  } catch (migrationError) {
    throw new Error('Error in migrations: ' + migrationError)
  }
}

export async function runMigrations() {
  const umzug = new Umzug({
    migrations: [
      create_tables,
      create_foreign_connection,
    ],
    context: sequelizeConn.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: sequelizeConn }),
    logger: console,
  })
  return umzug.up()
}

export async function clearDatabase() {
  // clear and recreate database schema, which cascades to all tables and rows in tables
  // for use in testing only - will delete all data in the database!!
  await sequelizeConn.query('DROP SCHEMA IF EXISTS public CASCADE')
  await sequelizeConn.query('CREATE SCHEMA public')
}

export const connectToDBAndRunMigrations = async () => {
  await verifyDBConnection()
  await runDBMigrations()
}