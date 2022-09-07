import type Logger from 'bunyan'

import fs from 'fs-extra'
import axios from 'axios'
import config from '../config'
import { generateTimestampAndSignature } from '../apiSigning'
import { libs } from '@audius/sdk'
import { getAllRegisteredCNodes } from './cnodeUtils'
import { getIfAttemptedStateFix, writeStreamToFileSystem } from './fsUtils'

const DecisionTree = require('./decisionTree')
const asyncRetry = require('./asyncRetry')
const LibsUtils = libs.Utils

export const EMPTY_FILE_CID = 'QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH' // deterministic CID for a 0 byte, completely empty file

/**
 * Fetches a CID from the Content Node network, verifies content, and writes to disk up to numRetries times.
 * If the fetch request is unauthorized or bad, or if the target content is delisted or not found, do not retry on
 * the particular Content Node.
 * Also do not retry if after content verifications that recently written content is not what is expected.
 *
 * @param {String} filePath location of the file on disk
 * @param {String} cid content hash of the file
 * @param {Object} logger logger object
 * @param {Object} libs libs instance
 * @param {Integer?} trackId optional trackId that corresponds to the cid, see file_lookup route for more info
 * @param {Array?} excludeList optional array of content nodes to exclude in network wide search
 * @param {number?} [numRetries=5] the number of retries to attempt to fetch cid, write to disk, and verify
 * @returns {Boolean} returns true if the file was found in the network
 */
export async function findCIDInNetwork(
  filePath: string,
  cid: string,
  logger: Logger,
  libs: any,
  trackId: string | null = null,
  excludeList: string[] = [],
  numRetries = 5
) {
  if (!config.get('findCIDInNetworkEnabled')) return false

  const attemptedStateFix = await getIfAttemptedStateFix(filePath)
  if (attemptedStateFix) return false

  // Get all registered Content Nodes
  const creatorNodes = await getAllRegisteredCNodes(libs)
  if (!creatorNodes.length) return false

  // Remove excluded nodes from list of creator nodes or self, no-op if empty list or nothing passed in
  const creatorNodesFiltered = creatorNodes.filter(
    (c: { endpoint: string }) =>
      !excludeList.includes(c.endpoint) ||
      config.get('creatorNodeEndpoint') !== c.endpoint
  )

  // Generate signature to auth fetching files
  const delegateWallet = config.get('delegateOwnerWallet').toLowerCase()
  const { signature, timestamp } = generateTimestampAndSignature(
    { filePath, delegateWallet },
    config.get('delegatePrivateKey')
  )

  let found = false
  for (const { endpoint } of creatorNodesFiltered) {
    if (found) break

    try {
      found = await asyncRetry({
        asyncFn: async (bail: (e: Error) => void) => {
          let response
          try {
            response = await axios({
              method: 'get',
              url: `${endpoint}/file_lookup`,
              params: {
                filePath,
                timestamp,
                delegateWallet,
                signature,
                trackId
              },
              responseType: 'stream',
              timeout: 1000
            })
          } catch (e: any) {
            if (
              e.response?.status === 403 || // delist
              e.response?.status === 401 || // unauth
              e.response?.status === 400 || // bad req
              e.response?.status === 404 // not found
            ) {
              bail(
                new Error(
                  `Content is not available with statusCode=${e.response?.status}`
                )
              )
              return
            }

            throw new Error(
              `Failed to fetch content with statusCode=${e.response?.status}. Retrying..`
            )
          }

          if (!response || !response.data) {
            throw new Error('Received empty response from file lookup')
          }

          await writeStreamToFileSystem(
            response.data,
            filePath,
            /* createDir */ true
          )

          const CIDMatchesExpected = await verifyCIDMatchesExpected({
            cid,
            path: filePath,
            logger
          })

          if (!CIDMatchesExpected) {
            try {
              await fs.unlink(filePath)
            } catch (e) {
              logger.error(`Could not remove file at path=${filePath}`)
            }

            throw new Error('CID does not match what is expected to be')
          }

          logger.info(
            `Successfully fetched CID=${cid} file=${filePath} from node ${endpoint}`
          )

          return true
        },
        logger,
        logLabel: 'findCIDInNetwork',
        options: {
          retries: numRetries,
          minTimeout: 3000
        }
      })
    } catch (e: any) {
      // Do not error and stop the flow of execution for functions that call it
      logger.error(
        `findCIDInNetwork error from ${endpoint} for ${cid} - ${e.message}`
      )
    }
  }

  return found
}

/**
 * Verify that the file written matches the hash expected
 * @param {Object} param
 * @param {string} param.cid target cid
 * @param {string} param.path the path at which the cid exists
 * @param {Object} param.logger
 * @returns boolean if the cid is proper or not
 */
export async function verifyCIDMatchesExpected({
  cid,
  path,
  logger,
  decisionTree = null
}: {
  cid: string
  path: string
  logger: Logger
  decisionTree?: typeof DecisionTree | null
}) {
  const fileSize = (await fs.stat(path)).size
  const fileIsEmpty = fileSize === 0

  // there is one case where an empty file could be valid, check for that CID explicitly
  if (fileIsEmpty && cid !== EMPTY_FILE_CID) {
    logger.error(`File has no content, content length is 0: ${cid}`)
    return false
  }

  // @ts-ignore
  const expectedCID = await LibsUtils.fileHasher.generateNonImageCid(path)

  const isCIDProper = cid === expectedCID
  if (!isCIDProper) {
    if (decisionTree) {
      decisionTree.recordStage({
        name: "File contents and hash don't match",
        data: {
          inputCID: cid,
          expectedCID
        }
      })
    } else {
      logger.error(
        `File contents and hash don't match. CID: ${cid} expectedCID: ${expectedCID}`
      )
    }
  }

  return isCIDProper
}
