import mongoose from 'mongoose'
import { collections } from '../controllers/collectionController'

const runMigrations = async () => {
  console.log('Running migrations...')
  const existingCollections = await mongoose.connection.db
    .listCollections()
    .toArray()
  const existingCollectionNames = existingCollections.map((c) => c.name)
  for (const collection of collections) {
    if (!existingCollectionNames.includes(collection)) {
      await mongoose.connection.db.createCollection(collection)
      console.log(`Collection ${collection} is created!`)
    } else {
      console.log(`Collection ${collection} already exists.`)
    }
  }
}

export const dialDb = async (dbUrl: string) => {
  await mongoose.connect(dbUrl)
  console.log('MongoDB connected...')

  await runMigrations()
}
