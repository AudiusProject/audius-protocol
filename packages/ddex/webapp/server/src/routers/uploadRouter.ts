import { z } from 'zod'
import createS3 from '../services/s3'
import { router, publicProcedure } from '../trpc'

export default function makeUploadRouter(s3: ReturnType<typeof createS3>) {
  return router({
    generateSignedUrl: publicProcedure
      .input(
        z.object({
          fileName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { fileName } = input
        return await s3.getSignedFileUrl(fileName)
      }),
  })
}
