import { NextFunction, Request, Response } from 'express'
import { RelayRequest } from '../types/relay'
import { validationError } from '../error'
import { DeveloperApps, Table, Users } from '@pedalboard/storage'
import { AudiusABIDecoder } from '@audius/sdk'
import { config, discoveryDb } from '..'
import { logger } from '../logger'

export const validator = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const body = request.body as RelayRequest

  // Validation of input fields
  const contractAddress =
    body.contractAddress || config.entityManagerContractAddress

  if (
    body.contractRegistryKey === null ||
    body.contractRegistryKey === undefined
  ) {
    validationError(next, 'contractRegistryKey is a required field')
    return
  }
  const contractRegistryKey = body.contractRegistryKey

  if (body.encodedABI === null || body.encodedABI === undefined) {
    validationError(next, 'encodedABI is a required field')
    return
  }
  const encodedABI = body.encodedABI

  // remove "null" possibility
  const gasLimit = body.gasLimit || 3000000
  const senderAddress = body.senderAddress || undefined
  const handle = body.handle || undefined

  const validatedRelayRequest = {
    contractAddress,
    contractRegistryKey,
    encodedABI,
    gasLimit,
    senderAddress,
    handle
  }

  // Gather user from input data
  // @ts-ignore, partially populate for now
  let user: Users = {
    wallet: senderAddress || null,
    handle: handle || null
  }
  let isApp = false
  try {
    const retrievedUser = await retrieveUser(
      contractRegistryKey,
      contractAddress,
      encodedABI,
      senderAddress,
      handle
    )

    if (retrievedUser !== undefined) {
      user = retrievedUser
    } else {
      const retrievedApp = await retrieveDeveloperApp({
        encodedABI, contractAddress
      })
      if (retrievedApp !== undefined) {
        isApp = true
      } else {
        throw new Error(`call for ${encodedABI} ${senderAddress} could not be found`)
      }
    }

  } catch (e) {
    logger.error(
      { e },
      'could not gather user or app from db, continuing with senderAddress and handle'
    )
  }

  // inject remaining fields into ctx for downstream middleware
  const ip = request.ip ?? ''

  const oldCtx = response.locals.ctx
  response.locals.ctx = {
    ...oldCtx,
    validatedRelayRequest,
    recoveredSigner: user,
    ip,
    isApp
  }
  next()
}

/** Retrieves user based on data that's available. */
export const retrieveUser = async (
  contractRegistryKey: string,
  contractAddress: string,
  encodedABI: string,
  senderAddress?: string,
  handle?: string
): Promise<Users | undefined> => {
  let query = discoveryDb<Users>(Table.Users)
  let addedWalletClause = false
  let addedHandleClause = false

  // if entitymanager transaction, recover signer
  if (contractRegistryKey === 'EntityManager') {
    const recoveredAddress = AudiusABIDecoder.recoverSigner({
      encodedAbi: encodedABI,
      entityManagerAddress: contractAddress,
      chainId: config.acdcChainId!
    })

    query = query.where('wallet', '=', recoveredAddress)
    addedWalletClause = true
  }

  // if something outside of entity manager, use sender address
  if (!addedWalletClause && senderAddress) {
    query = query.where('wallet', '=', senderAddress)
    addedWalletClause = true
  }

  if (!addedWalletClause && handle) {
    query = query.where('handle_lc', '=', handle.toLowerCase())
    addedHandleClause = true
  }

  if (!addedWalletClause && !addedHandleClause) {
    throw new Error('either handle or senderAddress is required')
  }

  const user = await query.andWhere('is_current', '=', true).first()
  return user
}

export const retrieveDeveloperApp = async(params: {
  encodedABI: string,
  contractAddress: string,
}): Promise<DeveloperApps | undefined> => {
  const { encodedABI, contractAddress } = params
  const recoveredAddress = AudiusABIDecoder.recoverSigner({
    encodedAbi: encodedABI,
    entityManagerAddress: contractAddress,
    chainId: config.acdcChainId!
  })
  return await discoveryDb<DeveloperApps>(Table.DeveloperApps)
    .where('address', '=', recoveredAddress)
    .first()
}
