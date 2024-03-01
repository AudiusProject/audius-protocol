import { NextFunction, Request, Response } from 'express'
import { RelayRequest } from '../types/relay'
import { validationError } from '../error'
import { DeveloperApps, Table, Users } from '@pedalboard/storage'
import { AudiusABIDecoder } from '@audius/sdk'
import { config, discoveryDb } from '..'
import { logger } from '../logger'
import { isUserCreate, isUserDeactivate } from '../utils'

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
  let recoveredSigner: Users | DeveloperApps = {
    wallet: senderAddress || null,
    handle: handle || null
  }

  let signerIsApp = false
  let signerIsUser = false
  let createOrDeactivate = false
  const isSenderVerifier = senderAddress === config.verifierAddress

  const user = await retrieveUser(
    contractRegistryKey,
    contractAddress,
    encodedABI,
    senderAddress,
    handle
  )
  if (user !== undefined) {
    recoveredSigner = user
    signerIsUser = true
  }

  if (signerIsUser) {
    const isDeactivated = (recoveredSigner as Users).is_deactivated
    if (isUserDeactivate(isDeactivated, encodedABI)) {
      logger.info({ requestId: response.locals.ctx.requestId, encodedABI }, "user deactivation")
      createOrDeactivate = true
    }
  }

  if (isUserCreate(encodedABI)) {
    logger.info({ requestId: response.locals.ctx.requestId, encodedABI }, "user create")
    createOrDeactivate = true
  }

  // could not find user and is not create, find app
  if (!signerIsUser && !createOrDeactivate && !isSenderVerifier) {
    const developerApp = await retrieveDeveloperApp({ encodedABI, contractAddress })
    if (developerApp === undefined) {
      logger.error({ encodedABI }, "neither user nor developer app could be found for address")
      validationError(next, 'recoveredSigner not valid')
      return
    }
    recoveredSigner = developerApp
    signerIsApp = true
  }

  // inject remaining fields into ctx for downstream middleware
  const ip = request.ip ?? ''

  const oldCtx = response.locals.ctx
  response.locals.ctx = {
    ...oldCtx,
    validatedRelayRequest,
    recoveredSigner,
    createOrDeactivate,
    ip,
    signerIsApp,
    signerIsUser,
    isSenderVerifier
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

export const retrieveDeveloperApp = async (params: { encodedABI: string, contractAddress: string }): Promise<DeveloperApps | undefined> => {
  const { encodedABI, contractAddress } = params
  const recoveredAddress = AudiusABIDecoder.recoverSigner({
    encodedAbi: encodedABI,
    entityManagerAddress: contractAddress,
    chainId: config.acdcChainId!
  })
  return await discoveryDb<DeveloperApps>(Table.DeveloperApps).where('address', '=', recoveredAddress).first()
}
