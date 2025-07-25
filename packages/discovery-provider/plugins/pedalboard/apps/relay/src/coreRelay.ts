import { ethers } from 'ethers'
import { create } from '@bufbuild/protobuf'
import { createClient, Client } from '@connectrpc/connect'
import {
  createGrpcTransport,
  createConnectTransport
} from '@connectrpc/connect-node'
import {
  Protocol,
  SignedTransactionSchema,
  ManageEntityLegacySchema,
  PingRequestSchema as GrpcPingRequestSchema,
  TransactionResponse as GrpcTransactionResponse
} from './core-sdk/protocol_pb'
import { ValidatedRelayRequest } from './types/relay'
import { readConfig } from './config/config.js'
import pino from 'pino'
import { CoreService } from './audiusd-sdk/core/v1/service_pb.js'
import {
  PingRequestSchema,
  SendTransactionResponse as ConnectTransactionResponse
} from './audiusd-sdk/core/v1/types_pb.js'
import { audiusSdk } from '.'

type ClientType = 'grpc' | 'connect'

interface ClientInfo {
  type: ClientType
  client: Client<typeof Protocol | typeof CoreService>
  lastSuccessfulPing: number
}

const clients: {
  grpc?: ClientInfo
  connect?: ClientInfo
} = {}

let activeClient: ClientInfo | null = null

async function pingClient(clientInfo: ClientInfo): Promise<boolean> {
  try {
    if (clientInfo.type === 'grpc') {
      await (clientInfo.client as Client<typeof Protocol>).ping(
        create(GrpcPingRequestSchema, {})
      )
    } else {
      await (clientInfo.client as Client<typeof CoreService>).ping(
        create(PingRequestSchema, {})
      )
    }
    clientInfo.lastSuccessfulPing = Date.now()
    return true
  } catch (e) {
    return false
  }
}

async function updateActiveClient(logger: pino.Logger) {
  // Ping both clients
  const results = await Promise.all([
    clients.grpc && pingClient(clients.grpc),
    clients.connect && pingClient(clients.connect)
  ])

  // Update active client based on most recent successful ping
  const grpcSuccess = results[0]
  const connectSuccess = results[1]

  if (grpcSuccess && connectSuccess) {
    // Use the client with the most recent successful ping
    activeClient =
      clients.grpc!.lastSuccessfulPing > clients.connect!.lastSuccessfulPing
        ? clients.grpc!
        : clients.connect!
  } else if (grpcSuccess) {
    activeClient = clients.grpc!
  } else if (connectSuccess) {
    activeClient = clients.connect!
  } else {
    activeClient = null
  }

  if (activeClient) {
    logger.info(`Using ${activeClient.type} client for transactions`)
  } else {
    logger.error('No clients are currently available')
  }
}

async function initializeClients(logger: pino.Logger): Promise<boolean> {
  const config = readConfig()

  // Try GRPC client
  try {
    const grpcTransport = createGrpcTransport({
      baseUrl: config.coreEndpoint,
      useBinaryFormat: true
    })
    const grpcClient = createClient(Protocol, grpcTransport)
    const grpcInfo: ClientInfo = {
      type: 'grpc',
      client: grpcClient,
      lastSuccessfulPing: 0
    }
    if (await pingClient(grpcInfo)) {
      clients.grpc = grpcInfo
      logger.info('Successfully connected using gRPC client')
    }
  } catch (e) {
    logger.warn({ err: e }, 'gRPC client initialization failed')
  }

  // Try Connect client
  try {
    const connectTransport = createConnectTransport({
      baseUrl: config.coreEndpoint,
      httpVersion: '2',
      useBinaryFormat: true
    })
    const connectClient = createClient(CoreService, connectTransport)
    const connectInfo: ClientInfo = {
      type: 'connect',
      client: connectClient,
      lastSuccessfulPing: 0
    }
    if (await pingClient(connectInfo)) {
      clients.connect = connectInfo
      logger.info('Successfully connected using Connect client')
    }
  } catch (e) {
    logger.warn({ err: e }, 'Connect client initialization failed')
  }

  // Update active client based on ping results
  await updateActiveClient(logger)

  // Start periodic ping checks if at least one client is available
  if (activeClient) {
    setInterval(() => updateActiveClient(logger), 30000) // Check every 30 seconds
    return true
  }

  logger.error('Failed to initialize any clients')
  return false
}

type CoreRelayResponse = {
  status: boolean
  transactionHash: string
  transactionIndex: number
  blockHash: string
  blockNumber: number
  from: string
  to: string
  contractAddress?: string
  cumulativeGasUsed: number
  gasUsed: number
  effectiveGasPrice: number
  // logs: Log[]
  // logsBloom: string
}

export const coreRelay = async (
  logger: pino.Logger,
  requestId: string,
  request: ValidatedRelayRequest
): Promise<CoreRelayResponse | null> => {
  try {
    // Initialize clients if needed
    const clientsInitialized = await initializeClients(logger)
    if (!clientsInitialized || !activeClient) {
      throw new Error('Failed to initialize any client')
    }

    const { encodedABI } = request

    const {
      userId,
      entityId,
      entityType,
      action,
      metadata,
      subjectSig,
      nonce: nonceBytes
    } = audiusSdk.services.entityManager.decodeManageEntity(
      encodedABI as `0x${string}`
    )

    const signer = request.senderAddress
    const signature = ethers.utils.hexlify(subjectSig)
    const nonce = ethers.utils.hexlify(nonceBytes)

    const manageEntity = create(ManageEntityLegacySchema, {
      userId,
      entityId,
      entityType,
      action,
      metadata,
      signature,
      signer,
      nonce
    })

    const signedTransaction = create(SignedTransactionSchema, {
      signature,
      transaction: {
        case: 'manageEntity' as const,
        value: manageEntity
      },
      requestId: requestId
    })

    // Use the active client to send transaction
    const res = await activeClient.client.sendTransaction({
      transaction: signedTransaction
    })

    // Extract transaction info based on client type
    let txHash = '',
      blockHeight = BigInt(0),
      blockHash = ''

    if (activeClient.type === 'grpc') {
      const grpcRes = res as GrpcTransactionResponse
      txHash = grpcRes.txhash
      blockHeight = grpcRes.blockHeight
      blockHash = grpcRes.blockHash
    } else {
      const connectRes = res as ConnectTransactionResponse
      if (connectRes.transaction) {
        txHash = connectRes.transaction.hash || ''
        blockHeight = connectRes.transaction.height || BigInt(0)
        blockHash = connectRes.transaction.blockHash || ''
      }
    }

    logger.info(
      {
        tx: res.transaction,
        txhash: txHash,
        block: blockHeight,
        blockhash: blockHash
      },
      'core relay success'
    )
    return {
      status: true,
      transactionHash: txHash,
      transactionIndex: 0,
      blockHash: blockHash,
      blockNumber: Number(blockHeight),
      from: signer || '',
      to: signer || '',
      cumulativeGasUsed: 10,
      gasUsed: 10,
      effectiveGasPrice: 420
    }
  } catch (e) {
    logger.error({ err: e }, 'core relay failure:')
    return null
  }
}
