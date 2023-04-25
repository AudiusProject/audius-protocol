import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'

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

export type FileTemplate = 'audio' | 'img_square' | 'img_backdrop'

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

  async uploadFile(file: File, onProgress: ProgressCB, template: FileTemplate) {
    const formData = new FormData()
    formData.append('template', template)
    // TODO: Test this in a browser env
    formData.append('files', isNodeFile(file) ? file.buffer : file, file.name)

    const { status, body } = await new Promise<{
      status: any
      body: any
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) =>
        onProgress(e.loaded, e.total)
      )
      xhr.addEventListener('load', () =>
        resolve({ status: xhr.status, body: xhr.responseText })
      )
      xhr.addEventListener('error', () =>
        reject(new Error('File upload failed'))
      )
      xhr.addEventListener('abort', () =>
        reject(new Error('File upload aborted'))
      )
      xhr.setRequestHeader(
        'Content-Type',
        `multipart/form-data; boundary=${formData.getBoundary()}`
      )
      xhr.open('POST', `${this.contentNodeEndpoint}/mediorum/uploads`, true)
      xhr.send(formData)
    })

    return await this.pollProcessingStatus(
      body.data[0].id,
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
  private async pollProcessingStatus(id: string, maxPollingMs: number) {
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
  private async getProcessingStatus(id: string) {
    const response = await fetch(
      `${this.contentNodeEndpoint}/mediorum/uploads/${id}`
    )
    const { data } = await response.json()
    return data
  }
}
