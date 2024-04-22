import createS3 from '../services/s3'
import { router } from '../trpc'

import collectionRouters from './collectionRouters'
import makeUploadRouter from './uploadRouter'

export default function createAppRouter(s3: ReturnType<typeof createS3>) {
  return router({
    upload: makeUploadRouter(s3),
    uploads: collectionRouters.uploads,
    deliveries: collectionRouters.deliveries,
    pendingReleases: collectionRouters.pending_releases,
    publishedReleases: collectionRouters.published_releases
  })
}
