import mongoose from 'mongoose'
import Deliveries from '../models/deliveries'
import PendingReleases from '../models/pendingReleases'
import PublishedReleases from '../models/publishedReleases'

export const publishReleases = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentDate = new Date()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const documents = await PendingReleases.find({
        publish_date: { $lte: currentDate },
      }).session(session)

      for (const doc of documents) {
        // TODO download audio/image files from "indexed" s3 bucket
        // TODO publish release using SDK

        // Move document to 'published_releases' collection
        const publishedData = {
          ...doc.toObject(),
          entity_id: 'todo',
          created_at: new Date(),
        }
        const publishedRelease = new PublishedReleases(publishedData)
        await publishedRelease.save({ session })
        await PendingReleases.deleteOne({ _id: doc._id }).session(session)
        // Update delivery_status to 'published' once all releases in the delivery are published
        const remainingCount = await PendingReleases.countDocuments({
          delivery_id: doc.delivery_id,
          _id: { $ne: doc._id },
        }).session(session)

        if (remainingCount === 0) {
          // Update delivery_status in deliveries collection
          await Deliveries.updateOne(
            { _id: doc.delivery_id },
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
