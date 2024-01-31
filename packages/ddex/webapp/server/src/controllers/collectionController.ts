import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Sort } from 'mongodb'

export const collections = ['uploads', 'indexed', 'parsed', 'published']

export const getCollection = (collection: string) => {
  return async (req: Request, res: Response) => {
    try {
      const { nextId, prevId, limit = '10' } = req.query
      const numericLimit = Number(limit)
      if (
        Array.isArray(nextId) ||
        Array.isArray(prevId) ||
        !Number.isInteger(numericLimit)
      ) {
        return res.status(400).send('Invalid pagination parameters')
      }

      let query: Record<string, any> = {} // No pagination, fetch the first `limit` items
      let sort: Sort = { _id: 1 } // Ascending
      let flipResults = false

      if (nextId) {
        query = { _id: { $gt: new mongoose.Types.ObjectId(nextId as string) } } // IDs greater than nextId
      } else if (prevId) {
        query = { _id: { $lt: new mongoose.Types.ObjectId(prevId as string) } } // IDs less than prevId
        sort = { _id: -1 } // Descending
        flipResults = true
      }

      const items = await mongoose.connection.db
        .collection(collection)
        .find(query)
        .sort(sort)
        .limit(numericLimit)
        .toArray()

      if (flipResults) {
        items.reverse() // Reverse items to main correct asc order when prevId is used
      }

      res.json(items)
    } catch (err) {
      console.error(err)
      res.status(500).send('Server Error')
    }
  }
}
