import { NextFunction, Request, Response } from 'express'
import { RelayRequest } from '../types/relay'
import { validationError } from '../error'
import { Table, Users } from '@pedalboard/storage'
import { AudiusABIDecoder } from '@audius/sdk'
import { config, discoveryDb } from '..'
import { logger } from '../logger'

export const validator = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const body = request.body as RelayRequest

  logger.info({ body }, 'validating request')

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
  try {
    user = await retrieveUser(
      contractRegistryKey,
      contractAddress,
      encodedABI,
      senderAddress,
      handle
    )
  } catch (e) {
    logger.error(
      { e },
      'could not gather user from db, continuing with senderAddress and handle'
    )
  }

  // inject remaining fields into ctx for downstream middleware
  const ip = request.ip ?? ''

  const oldCtx = response.locals.ctx
  response.locals.ctx = {
    ...oldCtx,
    validatedRelayRequest,
    recoveredSigner: user,
    ip
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
): Promise<Users> => {
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

  if (!user) {
    throw new Error('user could not be found with provided information')
  }

  return user
}
