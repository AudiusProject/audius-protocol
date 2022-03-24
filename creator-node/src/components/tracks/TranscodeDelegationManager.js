const axios = require('axios')
const fs = require('fs')
const fsExtra = require('fs-extra')
const FormData = require('form-data')
const retry = require('async-retry')

const config = require('../../config.js')
const Utils = require('../../utils')
const { logger: genericLogger } = require('../../logging')
const {
  generateTimestampAndSignatureForSPVerification
} = require('../../apiSigning')

const CREATOR_NODE_ENDPOINT = config.get('creatorNodeEndpoint')
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')
const NUMBER_OF_SPS_FOR_HANDOFF_TRACK = 3

class TranscodeDelegationManager {
  static async handOff({ req, logContext }) {
    const libs = req.libs
    const logger = genericLogger.child(logContext)
    let resp = {}

    let sps
    try {
      sps = await TranscodeDelegationManager.selectRandomSPs(libs)
    } catch (e) {
      logger.warn(`Could not select random SPs: ${e.message}`)
      return resp
    }

    for (const sp of sps) {
      try {
        logger.info(`Handing track off to sp=${sp}`)

        const transcodeAndSegmentUUID =
          await TranscodeDelegationManager.handOffToSp(logger, { sp, req })

        const polledTranscodeResponse =
          await TranscodeDelegationManager.pollForTranscode(logger, {
            sp,
            uuid: transcodeAndSegmentUUID
          })

        const localFilePaths =
          await TranscodeDelegationManager.fetchFilesAndWriteToFs(logger, {
            ...polledTranscodeResponse,
            sp,
            fileNameNoExtension: req.fileNameNoExtension
          })

        resp = localFilePaths
      } catch (e) {
        // TODO: delete tmp dir in external SP if fails and continue
        logger.warn(`Could not hand off track to sp=${sp} err=${e.toString()}`)
      }
    }

    return resp
  }

  // If any call fails -> throw error

  static async selectRandomSPs(libs) {
    let allSPs = await libs.ethContracts.getServiceProviderList('content-node')
    allSPs = allSPs.map((sp) => sp.endpoint)

    // If there are less Content Nodes than the default number, set the cap to the number
    // of available SPs. This will probably only happen in local dev :shrugs:
    const numberOfSps =
      allSPs.length < NUMBER_OF_SPS_FOR_HANDOFF_TRACK
        ? allSPs.length
        : NUMBER_OF_SPS_FOR_HANDOFF_TRACK

    const validSPs = new Set()
    while (validSPs.size < numberOfSps) {
      const index = Utils.getRandomInt(allSPs.length)
      const currentSP = allSPs[index]
      // do not pick self or a node that has already been chosen
      if (currentSP === CREATOR_NODE_ENDPOINT || validSPs.has(currentSP)) {
        continue
      }
      validSPs.add(currentSP)
    }

    return Array.from(validSPs)
  }

  static async handOffToSp(logger, { sp, req }) {
    const { fileDir, fileName, fileNameNoExtension, uuid: requestID } = req

    await TranscodeDelegationManager.fetchHealthCheck(sp)

    logger.info({ sp }, `Sending off transcode and segmenting request...`)
    const transcodeAndSegmentUUID =
      await TranscodeDelegationManager.sendTranscodeAndSegmentRequest({
        sp,
        fileDir,
        fileName,
        fileNameNoExtension
      })

    return transcodeAndSegmentUUID
  }

  static async pollForTranscode(logger, { uuid, sp }) {
    logger.info(
      { sp },
      `Polling for transcode and segments with uuid=${transcodeAndSegmentUUID}...`
    )

    return this.asyncRetry({
      asyncFn: async (bail, num) => {
        if (num === 50) {
          bail(
            new Error(`Transcode handoff max attempts reached for uuid=${uuid}`)
          )
          return
        }

        const { status, resp } =
          await TranscodeDelegationManager.fetchTrackContentProcessingStatus(
            sp,
            uuid
          )

        if (status && status === 'DONE') return resp
        if (status && status === 'FAILED') {
          bail(
            new Error(`Transcode handoff failed: uuid=${uuid}, error=${resp}`)
          )
          return
        }
      },
      asyncFnTask: 'polling transcode',
      retries: 50,
      minTimeout: 10000,
      maxTimeout: 10000
    })
  }

  static async fetchFilesAndWriteToFs(
    logger,
    {
      fileNameNoExtension,
      transcodeFilePath,
      segmentFileNames,
      segmentFilePaths,
      m3u8Path,
      sp
    }
  ) {
    let res

    // TODO: parallelize?

    // TODO: if any part of the below fails, we should remove any tmp dirs

    // Get segments and write to tmp disk
    logger.info({ sp }, `Fetching ${segmentFileNames.length} segments...`)
    for (let i = 0; i < segmentFileNames.length; i++) {
      const segmentFileName = segmentFileNames[i]
      const segmentFilePath = segmentFilePaths[i]

      res = await TranscodeDelegationManager.fetchSegment(
        sp,
        segmentFileName,
        fileNameNoExtension
      )
      await Utils.writeStreamToFileSystem(res.data, segmentFilePath)
    }

    // Get transcode and write to tmp disk
    logger.info({ sp, transcodeFilePath }, 'Fetching transcode...')
    const transcodeFileName = fileNameNoExtension + '-dl.mp3'
    res = await TranscodeDelegationManager.fetchTranscode(
      sp,
      transcodeFileName,
      fileNameNoExtension
    )
    await Utils.writeStreamToFileSystem(res.data, transcodeFilePath)

    // Get m3u8 file and write to tmp disk
    logger.info({ sp, m3u8Path }, 'Fetching m3u8...')
    const m3u8FileName = fileNameNoExtension + '.m3u8'
    res = await TranscodeDelegationManager.fetchM3U8File(
      sp,
      m3u8FileName,
      fileNameNoExtension
    )
    await Utils.writeStreamToFileSystem(res.data, m3u8Path)

    return {
      transcodeFilePath,
      segmentFileNames,
      m3u8Path
    }
  }

  static async sendTranscodeAndSegmentRequest({
    sp,
    fileDir,
    fileName,
    fileNameNoExtension
  }) {
    const originalTrackFormData =
      await TranscodeDelegationManager.createFormData(fileDir + '/' + fileName)

    // TODO: make this constant. perhaps in a class
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    const resp = await this.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/transcode_and_segment`,
        data: originalTrackFormData,
        headers: {
          ...originalTrackFormData.getHeaders()
        },
        params: {
          use_uuid_in_path: fileNameNoExtension,
          timestamp,
          signature,
          spID
        },
        adapter: require('axios/lib/adapters/http'),
        // Set content length headers (only applicable in server/node environments).
        // See: https://github.com/axios/axios/issues/1362
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      },
      asyncFnTask: 'transcode and segment'
    })

    return resp.data.data.uuid
  }

  static async createFormData(pathToFile) {
    const fileExists = await fsExtra.pathExists(pathToFile)
    if (!fileExists) {
      throw new Error(`File does not exist at path=${pathToFile}`)
    }

    const formData = new FormData()
    formData.append('file', fs.createReadStream(pathToFile))

    return formData
  }

  static async fetchHealthCheck(sp) {
    await axios({
      url: `${sp}/health_check`,
      method: 'get'
    })
  }

  /**
   * Gets the task progress given the task type and uuid associated with the task
   * @param {Object} param
   * @param {string} param.sp the current sp selected for track processing
   * @param {string} param.uuid the uuid of the track transcoding task
   * @returns the status, and the success or failed response if the task is complete
   */
  static async fetchTrackContentProcessingStatus({ sp, uuid }) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    const { data: body } = await this.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/async_processing_status`,
        params: { uuid, timestamp, signature, spID },
        method: 'get'
      },
      asyncFnTask: 'fetch track content processing status'
    })

    return body.data
  }

  static async fetchSegment(sp, segmentFileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return this.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/transcode_and_segment`,
        method: 'get',
        params: {
          fileName: segmentFileName,
          fileType: 'segment',
          uuidInPath: fileNameNoExtension,
          timestamp,
          signature,
          spID
        },
        responseType: 'stream'
      },
      asyncFnTask: 'fetch segment'
    })
  }

  static async fetchTranscode(sp, transcodeFileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return this.asyncRetry({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/transcode_and_segment`,
        method: 'get',
        params: {
          fileName: transcodeFileName,
          fileType: 'transcode',
          uuidInPath: fileNameNoExtension,
          timestamp,
          signature,
          spID
        },
        responseType: 'stream'
      },
      asyncFnTask: 'fetch transcode'
    })
  }

  static async fetchM3U8File(sp, m3u8FileName, fileNameNoExtension) {
    const spID = config.get('spID')
    const { timestamp, signature } =
      generateTimestampAndSignatureForSPVerification(spID, DELEGATE_PRIVATE_KEY)

    return axios({
      asyncFn: axios,
      asyncFnParams: {
        url: `${sp}/transcode_and_segment`,
        method: 'get',
        params: {
          fileName: m3u8FileName,
          fileType: 'm3u8',
          uuidInPath: fileNameNoExtension,
          timestamp,
          signature,
          spID
        },
        responseType: 'stream'
      },
      asyncFnTask: 'fetch m3u8'
    })
  }

  static async asyncRetry({
    asyncFn,
    asyncFnParams,
    asyncFnTask,
    retries = 5,
    minTimeout = 1000, // default for async-retry
    maxTimeout = 5000
  }) {
    return retry(
      async () => {
        if (asyncFnParams) {
          return asyncFn(asyncFnParams)
        }

        return asyncFn()
      },
      {
        retries,
        minTimeout,
        maxTimeout,
        onRetry: (err, i) => {
          if (err) {
            console.log(`${asyncFnTask} ${i} retry error: `, err)
          }
        }
      }
    )
  }
}

module.exports = TranscodeDelegationManager
