
import { Sequelize } from 'sequelize'

import { getEnv } from '../config'

const { db } = getEnv()

const dbConnectionPoolMax: number = 250

export const sequelizeConn = new Sequelize(
  db.name,
  db.username,
  db.password,
  {
    host: db.host,
    port: db.port,
    dialect: 'postgres',
    logging: false,
    retry: {
      match: [/Deadlock/i],
      max: 1,
    },
    pool: {
      max: dbConnectionPoolMax,
      min: 5,
      // @note https://github.com/sequelize/sequelize/issues/8133#issuecomment-359993057
      acquire: 1_000_000,
      idle: 10_000,
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

export const clearDatabase = async () => {
  // clear and recreate database schema, which cascades to all tables and rows in tables
  // for use in testing only - will delete all data in the database!!
  await sequelizeConn.query('DROP SCHEMA IF EXISTS public CASCADE')
  await sequelizeConn.query('CREATE SCHEMA public')
}

export const closeDBConnection = async () => {
  await sequelizeConn.close()
}