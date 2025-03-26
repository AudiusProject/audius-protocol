import { BaseAPI, JSONApiResponse } from '../../api/generated/default'

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
    userId,
    includeParent
  }: {
    trackId: string
    userId: string
    includeParent?: boolean
  }) {
    const response = await this.request({
      method: 'POST',
      path: `/stems/${trackId}`,
      query: {
        user_id: userId,
        include_parent: !!includeParent
      },
      headers: {}
    })
    return new JSONApiResponse<GetStemsArchiveJobStatusResponse>(
      response
    ).value()
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

  public async cancelStemsArchiveJob({ jobId }: { jobId: string }) {
    const response = await this.request({
      method: 'DELETE',
      path: `/stems/job/${jobId}`,
      headers: {}
    })
    return new JSONApiResponse<void>(response).value()
  }
}
