import mongoose from 'mongoose'

export const dialDb = async (dbUrl: string) => {
  await mongoose.connect(dbUrl)
  console.info('MongoDB connected...')
}
