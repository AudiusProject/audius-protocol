import mongoose from 'mongoose'
import Indexed from '../models/indexed'
import Parsed from '../models/parsed'
import Published from '../models/published'

export const publishReleases = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentDate = new Date()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const documents = await Parsed.find({
        publish_date: { $lte: currentDate },
      }).session(session)

      for (const doc of documents) {
        // TODO download audio/image files from "indexed" s3 bucket
        // TODO publish release using SDK

        // Move document to 'published' collection
        const publishedData = {
          ...doc.toObject(),
          entity_id: 'todo',
        }
        const publishedDoc = new Published(publishedData)
        await publishedDoc.save({ session })
        await Parsed.deleteOne({ _id: doc._id }).session(session)
        // Update delivery_status to 'published' once all releases in the delivery are published
        const remainingCount = await Parsed.countDocuments({
          delivery_id: doc.delivery_id,
          _id: { $ne: doc._id },
        }).session(session)

        if (remainingCount === 0) {
          // Update delivery_status in indexed collection
          await Indexed.updateOne(
            { delivery_id: doc.delivery_id },
            { $set: { delivery_status: 'published' } },
            { session }
          )
        }
        console.log('Published release: ', publishedData)
      }

      await session.commitTransaction()
    } catch (error) {
      console.error('Error publishing release, rolling back.', error)
      await session.abortTransaction()
    } finally {
      session.endSession()
    }

    // 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
}
