import {
  BaseAPI,
  Configuration,
  HTTPQuery,
  RequestOpts,
  RequiredError
} from '../generated/default'
import * as aes from 'micro-aes-gcm'
import { base64 } from '@scure/base'
import { ulid } from 'ulid'

import * as secp from '@noble/secp256k1'
import type {
  ChatInvite,
  UserChat,
  ChatMessage,
  ChatWebsocketEventData,
  RPCPayloadRequest,
  ValidatedChatPermissions
} from './serverTypes'
import type {
  ChatBlockRequest,
  ChatCreateRequest,
  ChatDeleteRequest,
  ChatEvents,
  ChatGetAllRequest,
  ChatGetMessagesRequest,
  ChatGetPermissionRequest,
  ChatGetRequest,
  ChatInviteRequest,
  ChatMessageRequest,
  ChatPermitRequest,
  ChatReactRequest,
  ChatReadRequest,
  TypedCommsResponse,
  UnfurlResponse
} from './clientTypes'
import WebSocket from 'isomorphic-ws'
import EventEmitter from 'events'
import type TypedEmitter from 'typed-emitter'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector/types'
import type { WalletApiService } from '../../services/WalletApi'
import type { EventEmitterTarget } from '../../utils/EventEmitterTarget'

export class ChatsApi
  extends BaseAPI
  implements EventEmitterTarget<ChatEvents>
{
  private chatSecrets: Record<string, Uint8Array> = {}
  private readonly eventEmitter: TypedEmitter<ChatEvents>
  private websocket: WebSocket | undefined

  /**
   * Proxy to the event emitter addListener
   */
  public addEventListener
  /**
   * Proxy to the event emitter removeListener
   */
  public removeEventListener

  constructor(
    config: Configuration,
    private readonly walletService: WalletApiService,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService
  ) {
    super(config)
    this.eventEmitter = new EventEmitter() as TypedEmitter<ChatEvents>
    this.addEventListener = this.eventEmitter.addListener.bind(
      this.eventEmitter
    )
    this.removeEventListener = this.eventEmitter.removeListener.bind(
      this.eventEmitter
    )

    // Listen for discovery node selection changes and reinit websocket
    this.discoveryNodeSelectorService.addEventListener('change', (endpoint) => {
      if (this.websocket) {
        this.websocket.close()
        this.createWebsocket(endpoint).then((ws) => {
          this.websocket = ws
        })
      }
    })
  }

  // #region QUERY

  public async listen() {
    const endpoint =
      await this.discoveryNodeSelectorService.getSelectedEndpoint()
    if (endpoint) {
      this.websocket = await this.createWebsocket(endpoint)
    } else {
      throw new Error('No services available to listen to')
    }
  }

  public async get(requestParameters: ChatGetRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'getChat'
    )
    const response = await this.getRaw(requestParameters.chatId)
    return {
      ...response,
      data: response.data
        ? await this.decryptLastChatMessage(response.data)
        : response.data
    }
  }

  public async getAll(requestParameters?: ChatGetAllRequest) {
    const path = `/comms/chats`
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (requestParameters?.limit) {
      query['limit'] = requestParameters.limit
    }
    if (requestParameters?.before) {
      query['before'] = requestParameters.before
    }
    if (requestParameters?.after) {
      query['after'] = requestParameters.after
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      headers: {},
      path,
      query
    })
    const json = (await response.json()) as TypedCommsResponse<UserChat[]>

    const decrypted = await Promise.all(
      json.data.map(async (c) => await this.decryptLastChatMessage(c))
    )
    return {
      ...json,
      data: decrypted
    }
  }

  public async getMessages(
    requestParameters: ChatGetMessagesRequest
  ): Promise<TypedCommsResponse<ChatMessage[]>> {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'getMessages'
    )

    const sharedSecret = await this.getChatSecret(requestParameters.chatId)
    const path = `/comms/chats/${requestParameters.chatId}/messages`
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (requestParameters.limit) {
      query['limit'] = requestParameters.limit
    }
    if (requestParameters.before) {
      query['before'] = requestParameters.before
    }
    if (requestParameters.after) {
      query['after'] = requestParameters.after
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      headers: {},
      path,
      query
    })
    const json = (await response.json()) as TypedCommsResponse<ChatMessage[]>
    const decrypted = await Promise.all(
      json.data.map(async (m) => ({
        ...m,
        message: await this.decryptString(
          sharedSecret,
          base64.decode(m.message)
        ).catch((e) => {
          console.error(
            "[audius-sdk]: Error: Couldn't decrypt chat message",
            m,
            e
          )
          return "Error: Couldn't decrypt message"
        })
      }))
    )
    return {
      ...json,
      data: decrypted
    }
  }

  public async getUnreadCount() {
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/unread`,
      headers: {},
      query
    })
    const json = await response.json()
    return { data: json.data }
  }

  public async getPermissions(requestParameters?: ChatGetPermissionRequest) {
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    this.assertNotNullOrUndefined(
      requestParameters?.userIds,
      'requestParameters.userIds',
      'getPermissions'
    )
    this.assertMinLength(
      requestParameters?.userIds!,
      'requestParameters.userIds',
      'getPermissions'
    )
    query['id'] = requestParameters?.userIds!

    const res = await this.signAndSendRequest({
      method: 'GET',
      path: '/comms/chats/permissions',
      headers: {},
      query
    })
    return (await res.json()) as TypedCommsResponse<ValidatedChatPermissions[]>
  }

  public async getBlockers() {
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/blockers`,
      headers: {},
      query
    })
    return (await response.json()) as TypedCommsResponse<string[]>
  }

  public async getBlockees() {
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/blockees`,
      headers: {},
      query
    })
    return (await response.json()) as TypedCommsResponse<string[]>
  }

  public async unfurl(requestParameters: { urls: string[] }) {
    this.assertNotNullOrUndefined(
      requestParameters.urls,
      'requestParameters.urls',
      'unfurl'
    )
    this.assertMinLength(
      requestParameters.urls,
      'requestParameters.urls',
      'unfurl'
    )
    const query: HTTPQuery = {
      content: requestParameters.urls
    }
    const res = await this.request({
      method: 'GET',
      path: '/comms/unfurl',
      query,
      headers: {}
    })
    return (await res.json()) as UnfurlResponse[]
  }

  // #endregion

  // #region MUTATE

  public async create(requestParameters: ChatCreateRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.userId,
      'requestParameters.userId',
      'create'
    )
    this.assertNotNullOrUndefined(
      requestParameters.invitedUserIds,
      'requestParameters.invitedUserIds',
      'create'
    )
    this.assertMinLength(
      requestParameters.invitedUserIds,
      'requestParameters.invitedUserIds',
      'create'
    )

    const chatId = [
      requestParameters.userId,
      ...requestParameters.invitedUserIds
    ]
      .sort()
      .join(':')
    const chatSecret = secp.utils.randomPrivateKey()
    this.chatSecrets[chatId] = chatSecret
    const invites = await this.createInvites(
      requestParameters.userId,
      requestParameters.invitedUserIds,
      chatSecret
    )

    return await this.sendRpc({
      method: 'chat.create',
      params: {
        chat_id: chatId,
        invites
      }
    })
  }

  public async invite(requestParameters: ChatInviteRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'invite'
    )
    this.assertNotNullOrUndefined(
      requestParameters.userId,
      'requestParameters.userId',
      'invite'
    )
    this.assertNotNullOrUndefined(
      requestParameters.invitedUserIds,
      'requestParameters.invitedUserIds',
      'invite'
    )
    this.assertMinLength(
      requestParameters.invitedUserIds,
      'requestParameters.invitedUserIds',
      'invite'
    )

    const chatSecret = await this.getChatSecret(requestParameters.chatId)
    const invites = await this.createInvites(
      requestParameters.userId,
      requestParameters.invitedUserIds,
      chatSecret
    )
    return await this.sendRpc({
      method: 'chat.invite',
      params: {
        chat_id: requestParameters.chatId,
        invites
      }
    })
  }

  public async message(requestParameters: ChatMessageRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'message'
    )
    this.assertNotNullOrUndefined(
      requestParameters.message,
      'requestParameters.message',
      'message'
    )

    const chatSecret = await this.getChatSecret(requestParameters.chatId)
    const encrypted = await this.encryptString(
      chatSecret,
      requestParameters.message
    )
    const message = base64.encode(encrypted)

    return await this.sendRpc({
      method: 'chat.message',
      params: {
        chat_id: requestParameters.chatId,
        message_id: requestParameters.messageId ?? ulid(),
        message
      }
    })
  }

  public async react(requestParameters: ChatReactRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'react'
    )
    this.assertNotNullOrUndefined(
      requestParameters.messageId,
      'requestParameters.messageId',
      'react'
    )
    this.assertNotUndefined(
      requestParameters.reaction,
      'requestParameters.reaction',
      'react'
    )
    return await this.sendRpc({
      method: 'chat.react',
      params: {
        chat_id: requestParameters.chatId,
        message_id: requestParameters.messageId,
        reaction: requestParameters.reaction
      }
    })
  }

  public async read(requestParameters: ChatReadRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'read'
    )
    return await this.sendRpc({
      method: 'chat.read',
      params: {
        chat_id: requestParameters.chatId
      }
    })
  }

  public async block(requestParameters: ChatBlockRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.userId,
      'requestParameters.userId',
      'block'
    )
    return await this.sendRpc({
      method: 'chat.block',
      params: {
        user_id: requestParameters.userId
      }
    })
  }

  public async unblock(requestParameters: ChatBlockRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.userId,
      'requestParameters.userId',
      'unblock'
    )
    return await this.sendRpc({
      method: 'chat.unblock',
      params: {
        user_id: requestParameters.userId
      }
    })
  }

  public async delete(requestParameters: ChatDeleteRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.chatId,
      'requestParameters.chatId',
      'delete'
    )
    return await this.sendRpc({
      method: 'chat.delete',
      params: {
        chat_id: requestParameters.chatId
      }
    })
  }

  public async permit(requestParameters: ChatPermitRequest) {
    this.assertNotNullOrUndefined(
      requestParameters.permit,
      'requestParameters.permit',
      'permit'
    )
    return await this.sendRpc({
      method: 'chat.permit',
      params: {
        permit: requestParameters.permit
      }
    })
  }

  // #endregion

  // #region PRIVATE

  private assertNotNullOrUndefined(value: any, name: string, method: string) {
    if (value === null || value === undefined) {
      throw new RequiredError(
        name,
        `Required parameter ${name} was null or undefined when calling ${method}.`
      )
    }
  }

  private assertNotUndefined(value: any, name: string, method: string) {
    if (value === undefined) {
      throw new RequiredError(
        name,
        `Required parameter ${name} was undefined when calling ${method}.`
      )
    }
  }

  private assertMinLength(
    value: any[],
    name: string,
    method: string,
    minimumLength: number = 1
  ) {
    if (value.length < minimumLength) {
      throw new RequiredError(
        name,
        `Required parameter ${name} requires more than ${minimumLength} element when calling ${method}`
      )
    }
  }

  private async createInvites(
    userId: string,
    invitedUserIds: string[],
    chatSecret: Uint8Array
  ): Promise<ChatInvite[]> {
    const userPublicKey = await this.getPublicKey(userId)
    return await Promise.all(
      [userId, ...invitedUserIds].map(async (userId) => {
        const inviteePublicKey = await this.getPublicKey(userId)
        const inviteCode = await this.createInviteCode(
          userPublicKey,
          inviteePublicKey,
          chatSecret
        )
        return {
          user_id: userId,
          invite_code: base64.encode(inviteCode)
        }
      })
    )
  }

  private async createInviteCode(
    userPublicKey: Uint8Array,
    inviteePublicKey: Uint8Array,
    chatSecret: Uint8Array
  ) {
    const sharedSecret = await this.walletService.getSharedSecret(
      inviteePublicKey
    )
    const encryptedChatSecret = await this.encrypt(sharedSecret, chatSecret)
    const inviteCode = new Uint8Array(65 + encryptedChatSecret.length)
    inviteCode.set(userPublicKey)
    inviteCode.set(encryptedChatSecret, 65)
    return inviteCode
  }

  private async readInviteCode(inviteCode: Uint8Array) {
    const friendPublicKey = inviteCode.slice(0, 65)
    const chatSecretEncrypted = inviteCode.slice(65)
    const sharedSecret = await this.walletService.getSharedSecret(
      friendPublicKey
    )
    return await this.decrypt(sharedSecret, chatSecretEncrypted)
  }

  private async encrypt(secret: Uint8Array, payload: Uint8Array) {
    return await aes.encrypt(secret.slice(secret.length - 32), payload)
  }

  private async encryptString(secret: Uint8Array, payload: string) {
    return await this.encrypt(secret, new TextEncoder().encode(payload))
  }

  private async decrypt(secret: Uint8Array, payload: Uint8Array) {
    return await aes.decrypt(secret.slice(secret.length - 32), payload)
  }

  private async decryptString(secret: Uint8Array, payload: Uint8Array) {
    return new TextDecoder().decode(await this.decrypt(secret, payload))
  }

  private async decryptLastChatMessage(c: UserChat): Promise<UserChat> {
    const sharedSecret = await this.getChatSecret(c.chat_id)
    let lastMessage = ''
    if (c.last_message && c.last_message.length > 0) {
      try {
        lastMessage = await this.decryptString(
          sharedSecret,
          base64.decode(c.last_message)
        )
      } catch (e) {
        console.error(
          "[audius-sdk]: Error: Couldn't decrypt last chat message",
          c,
          e
        )
        lastMessage = "Error: Couldn't decrypt message"
      }
    }
    return {
      ...c,
      last_message: lastMessage
    }
  }

  private async getRaw(chatId: string) {
    const path = `/comms/chats/${chatId}`
    const queryParameters: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      headers: {},
      path,
      query: queryParameters
    })
    return (await response.json()) as TypedCommsResponse<UserChat>
  }

  private async getChatSecret(chatId: string) {
    const existingChatSecret = this.chatSecrets[chatId]
    if (!existingChatSecret) {
      const response = await this.getRaw(chatId)
      const chatSecret = await this.readInviteCode(
        base64.decode(response.data.invite_code)
      )
      this.chatSecrets[chatId] = chatSecret
      return chatSecret
    }
    return existingChatSecret
  }

  private async getPublicKey(userId: string) {
    const response = await this.request({
      path: `/comms/pubkey/${userId}`,
      method: 'GET',
      headers: {}
    })
    const json = await response.json()
    return base64.decode(json.data)
  }

  private async getSignatureHeader(payload: string) {
    const [allSignatureBytes, recoveryByte] = await this.walletService.sign(
      payload
    )
    const signatureBytes = new Uint8Array(65)
    signatureBytes.set(allSignatureBytes, 0)
    signatureBytes[64] = recoveryByte
    return { 'x-sig': base64.encode(signatureBytes) }
  }

  private async signAndSendRequest(request: RequestOpts) {
    const payload =
      request.method === 'GET'
        ? request.query
          ? `${request.path}?${this.configuration.queryParamsStringify(
              request.query
            )}`
          : request.path
        : request.body
    return await this.request({
      ...request,
      headers: {
        ...request.headers,
        ...(await this.getSignatureHeader(payload))
      }
    })
  }

  private async sendRpc(args: RPCPayloadRequest) {
    const payload = JSON.stringify({ ...args, timestamp: new Date().getTime() })
    await this.signAndSendRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      path: `/comms/mutate`,
      body: payload
    })
    return args
  }

  private async createWebsocket(endpoint: string) {
    const timestamp = new Date().getTime()
    const originalUrl = `/comms/chats/ws?timestamp=${timestamp}`
    const signatureHeader = await this.getSignatureHeader(originalUrl)
    const host = endpoint.replace(/http(s?)/g, 'ws$1')
    const url = `${host}${originalUrl}&signature=${encodeURIComponent(
      signatureHeader['x-sig']
    )}`
    const ws = new WebSocket(url)
    ws.addEventListener('message', (messageEvent) => {
      const handleAsync = async () => {
        const data = JSON.parse(messageEvent.data) as ChatWebsocketEventData
        if (data.rpc.method === 'chat.message') {
          const sharedSecret = await this.getChatSecret(data.rpc.params.chat_id)
          this.eventEmitter.emit('message', {
            chatId: data.rpc.params.chat_id,
            message: {
              message_id: data.rpc.params.message_id,
              message: await this.decryptString(
                sharedSecret,
                base64.decode(data.rpc.params.message)
              ).catch((e) => {
                console.error(
                  "[audius-sdk]: Error: Couldn't decrypt websocket chat message",
                  data,
                  e
                )
                return "Error: Couldn't decrypt message"
              }),
              sender_user_id: data.metadata.userId,
              created_at: data.metadata.timestamp,
              reactions: []
            }
          })
        } else if (data.rpc.method === 'chat.react') {
          this.eventEmitter.emit('reaction', {
            chatId: data.rpc.params.chat_id,
            messageId: data.rpc.params.message_id,
            reaction: {
              reaction: data.rpc.params.reaction,
              user_id: data.metadata.userId,
              created_at: data.metadata.timestamp
            }
          })
        }
      }
      handleAsync()
    })
    ws.addEventListener('open', () => {
      this.eventEmitter.emit('open')
    })
    ws.addEventListener('close', () => {
      this.eventEmitter.emit('close')
    })
    ws.addEventListener('error', (e) => {
      this.eventEmitter.emit('error', e)
    })
    return ws
  }

  // #endregion
}
