import createS3 from '../services/s3'
import { router } from '../trpc'

import deliveriesRouter from './deliveriesRouter'
import releasesRouter from './releasesRouter'
import makeUploadRouter from './uploadRouter'
import usersRouter from './usersRouter'

export default function createAppRouter(s3: ReturnType<typeof createS3>) {
  return router({
    upload: makeUploadRouter(s3),
    deliveries: deliveriesRouter,
    releases: releasesRouter,
    users: usersRouter
  })
}
