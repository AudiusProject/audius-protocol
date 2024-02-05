import mongoose from 'mongoose'
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
        // TODO publish release using SDK

        // Move document to 'published' collection
        const publishedData = {
          ...doc.toObject(),
          track_id: 'todo',
        }
        const publishedDoc = new Published(publishedData)
        await publishedDoc.save({ session })
        await Parsed.deleteOne({ _id: doc._id }).session(session)
        // TODO update indexed delivery_status to 'published'
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
