import type Logger from 'bunyan'

import fs from 'fs-extra'
import { libs } from '@audius/sdk'

const DecisionTree = require('./decisionTree')
const LibsUtils = libs.Utils

export const EMPTY_FILE_CID = 'QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH' // deterministic CID for a 0 byte, completely empty file

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
