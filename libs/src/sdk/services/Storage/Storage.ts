import FormData from 'form-data'
import axios from 'axios'

import fetch from 'cross-fetch'
import { wait } from '../../utils/wait'
import type {
  FileTemplate,
  ProgressCB,
  StorageService,
  StorageServiceConfig,
  UploadResponse
} from './types'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import {
  defaultStorageServiceConfig,
  MAX_IMAGE_RESIZE_TIMEOUT_MS,
  MAX_TRACK_TRANSCODE_TIMEOUT,
  POLL_STATUS_INTERVAL
} from './constants'
import type { CrossPlatformFile as File } from '../../types/File'
import { isNodeFile } from '../../utils/file'
import type { StorageNodeSelectorService } from '../StorageNodeSelector'

export class Storage implements StorageService {
  /**
   * Configuration passed in by consumer (with defaults)
   */
  private readonly config: StorageServiceConfig
  private readonly storageNodeSelector: StorageNodeSelectorService

  constructor(config: StorageServiceConfig) {
    this.config = mergeConfigWithDefaults(config, defaultStorageServiceConfig)
    this.storageNodeSelector = this.config.storageNodeSelector
  }

  /**
   * Upload a file to a content node
   * @param file
   * @param onProgress
   * @param template
   * @returns
   */
  async uploadFile({
    file,
    onProgress,
    template
  }: {
    file: File
    onProgress?: ProgressCB
    template: FileTemplate
  }) {
    const formData: FormData = new FormData()
    formData.append('template', template)
    // TODO: Test this in a browser env
    formData.append('files', isNodeFile(file) ? file.buffer : file, file.name)

    const contentNodeEndpoint = await this.storageNodeSelector.getSelectedNode()

    if (!contentNodeEndpoint) {
      throw new Error('No content node available for upload')
    }

    // Using axios for now because it supports upload progress,
    // and Node doesn't support XmlHttpRequest
    const response = await axios({
      method: 'post',
      url: `${contentNodeEndpoint}/uploads`,
      data: formData,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
      },
      onUploadProgress: (progressEvent) =>
        onProgress?.(progressEvent.loaded, progressEvent.total)
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
  private async pollProcessingStatus(id: string, maxPollingMs: number) {
    const start = Date.now()
    while (Date.now() - start < maxPollingMs) {
      try {
        const resp = await this.getProcessingStatus(id)
        if (resp?.status === 'done') {
          return resp
        }
        if (resp?.status === 'error') {
          throw new Error(
            `Upload failed: id=${id}, resp=${JSON.stringify(resp)}`
          )
        }
      } catch (e: any) {
        // Rethrow if error is "Upload failed" or if status code is 422 (Unprocessable Entity)
        if (
          e.message?.startsWith('Upload failed') ||
          (e.response && e.response?.status === 422)
        ) {
          throw e
        }

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
  private async getProcessingStatus(id: string): Promise<UploadResponse> {
    const contentNodeEndpoint = await this.storageNodeSelector.getSelectedNode()
    const response = await fetch(`${contentNodeEndpoint}/uploads/${id}`)
    return await response.json()
  }
}
