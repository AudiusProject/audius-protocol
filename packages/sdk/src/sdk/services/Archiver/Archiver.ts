import { BaseAPI, JSONApiResponse } from '../../api/generated/default'

type CreateStemsArchiveResponse = {
  jobId: string
}

type GetStemsArchiveJobStatusResponse = {
  id: string
  state:
    | 'completed'
    | 'failed'
    | 'active'
    | 'waiting'
    | 'delayed'
    | 'prioritized'
  progress?: number
  failedReason?: string
}

export class ArchiverService extends BaseAPI {
  public async createStemsArchive({
    trackId,
    userId
  }: {
    trackId: string
    userId: string
  }) {
    const response = await this.request({
      method: 'POST',
      path: `/stems/${trackId}`,
      query: {
        user_id: userId
      },
      headers: {}
    })
    return new JSONApiResponse<CreateStemsArchiveResponse>(response).value()
  }

  public async getStemsArchiveJobStatus({ jobId }: { jobId: string }) {
    const response = await this.request({
      method: 'GET',
      path: `/stems/job/${jobId}`,
      headers: {}
    })
    return new JSONApiResponse<GetStemsArchiveJobStatusResponse>(
      response
    ).value()
  }
}
