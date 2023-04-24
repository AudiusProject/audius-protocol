import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'

import type { TrackMetadata } from '../../types/types'
import retry from 'async-retry'
import { wait } from '../../utils/wait'
import type { StorageServiceConfig } from './types'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import {
  defaultStorageServiceConfig,
  MAX_IMAGE_RESIZE_TIMEOUT_MS,
  MAX_TRACK_TRANSCODE_TIMEOUT,
  POLL_STATUS_INTERVAL
} from './constants'
import type { CrossPlatformFile as File } from '../../types/File'
import { isNodeFile } from '../../utils/file'

type ProgressCB = (loaded: number, total: number) => void

export class StorageService {
  /**
   * Configuration passed in by consumer (with defaults)
   */
  private config: StorageServiceConfig

  private contentNodeEndpoint: string

  constructor(config?: StorageServiceConfig) {
    this.config = mergeConfigWithDefaults(config, defaultStorageServiceConfig)

    this.contentNodeEndpoint = this.config.contentNodeEndpoint
  }

  async uploadTrackAudioAndCoverArt(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: ProgressCB = () => {}
  ) {
    const updatedMetadata = { ...metadata }

    // Upload audio and cover art
    const [audioResp, coverArtResp] = await Promise.all([
      this._retry3(
        async () => await this.uploadTrackAudio(trackFile, onProgress),
        (e) => {
          console.log('Retrying uploadTrackAudio', e)
        }
      ),
      this._retry3(
        async () => await this.uploadTrackCoverArt(coverArtFile, onProgress),
        (e) => {
          console.log('Retrying uploadTrackCoverArt', e)
        }
      )
    ])

    // Update metadata to include uploaded CIDs
    updatedMetadata.track_segments = []
    updatedMetadata.track_cid = audioResp.results['320']
    if (updatedMetadata.download?.is_downloadable) {
      updatedMetadata.download.cid = updatedMetadata.track_cid
    }
    updatedMetadata.cover_art_sizes = coverArtResp.id

    return updatedMetadata
  }

  async uploadTrackAudio(file: File, onProgress: ProgressCB) {
    return await this.uploadFile(file, onProgress, 'audio')
  }

  async uploadTrackCoverArt(file: File, onProgress: ProgressCB) {
    return await this.uploadFile(file, onProgress, 'img_square')
  }

  async uploadProfilePicture(file: File, onProgress: ProgressCB = () => {}) {
    return await this.uploadFile(file, onProgress, 'img_square')
  }

  async uploadCoverPhoto(file: File, onProgress: ProgressCB = () => {}) {
    return await this.uploadFile(file, onProgress, 'img_backdrop')
  }

  async uploadFile(
    file: File,
    onProgress: ProgressCB,
    template: 'audio' | 'img_square' | 'img_backdrop'
  ) {
    const formData = new FormData()
    formData.append('template', template)
    // TODO: Test this in a browser env
    formData.append('files', isNodeFile(file) ? file.buffer : file, file.name)
    const response = await this._makeRequest({
      method: 'post',
      url: '/mediorum/uploads',
      data: formData,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
      },
      onUploadProgress: (progressEvent) =>
        onProgress(progressEvent.loaded, progressEvent.total)
    })
    return await this.pollProcessingStatus(
      response.data[0].id,
      template === 'audio'
        ? MAX_TRACK_TRANSCODE_TIMEOUT
        : MAX_IMAGE_RESIZE_TIMEOUT_MS
    )
  }

  /**
   * Works for both track transcode and image resize jobs
   * @param id ID of the transcode/resize job
   * @param maxPollingMs millis to stop polling and error if job is not done
   * @returns successful job info, or throws error if job fails / times out
   */
  async pollProcessingStatus(id: string, maxPollingMs: number) {
    const start = Date.now()
    while (Date.now() - start < maxPollingMs) {
      try {
        const resp = await this.getProcessingStatus(id)
        if (resp?.status === 'done') return resp
        if (resp?.status === 'error') {
          throw new Error(
            `Upload failed: id=${id}, resp=${JSON.stringify(resp)}`
          )
        }
      } catch (e) {
        // Swallow errors caused by failure to establish connection to node so we can retry polling
        console.error(`Failed to poll for processing status, ${e}`)
      }

      await wait(POLL_STATUS_INTERVAL)
    }

    throw new Error(`Upload took over ${maxPollingMs}ms. id=${id}`)
  }

  /**
   * Gets the task progress given the task type and id associated with the job
   * @param id the id of the transcoding or resizing job
   * @returns the status, and the success or failed response if the job is complete
   */
  async getProcessingStatus(id: string) {
    const { data } = await this._makeRequest({
      method: 'get',
      url: `/mediorum/uploads/${id}`
    })
    return data
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  /**
   * Makes an axios request to the connected creator node
   * @return response body
   */
  async _makeRequest(axiosRequestObj: AxiosRequestConfig) {
    // TODO: This might want to have other error handling, request UUIDs, etc...
    //       But I didn't want to pull in all the chaos and incompatiblity of the old _makeRequest
    axiosRequestObj.baseURL = this.contentNodeEndpoint
    return await axios(axiosRequestObj)
  }

  /**
   * Calls fn and then retries once after 500ms, again after 1500ms, and again after 4000ms
   */
  async _retry3(fn: () => Promise<any>, onRetry = (_err: any) => {}) {
    return await retry(fn, {
      minTimeout: 500,
      maxTimeout: 4000,
      factor: 3,
      retries: 3,
      onRetry
    })
  }
}
