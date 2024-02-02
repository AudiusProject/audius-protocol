import { router } from '../trpc'
import createS3 from '../services/s3'
import makeUploadRouter from './uploadRouter'
import collectionRouters from './collectionRouters'

export default function createAppRouter(s3: ReturnType<typeof createS3>) {
  return router({
    upload: makeUploadRouter(s3),
    uploads: collectionRouters['uploads'],
    indexed: collectionRouters['indexed'],
    parsed: collectionRouters['parsed'],
    published: collectionRouters['published'],
  })
}
