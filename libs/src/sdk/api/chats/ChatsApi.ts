import {
  BaseAPI,
  Configuration,
  HTTPQuery,
  RequestOpts
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
import {
  ChatBlockRequest,
  ChatBlockRequestSchema,
  ChatCreateRequest,
  ChatCreateRequestSchema,
  ChatDeleteRequest,
  ChatDeleteRequestSchema,
  ChatEvents,
  ChatGetAllRequest,
  ChatGetAllRequestSchema,
  ChatGetMessagesRequest,
  ChatGetMessagesRequestSchema,
  ChatGetPermissionRequest,
  ChatGetPermissionRequestSchema,
  ChatGetRequest,
  ChatGetRequestSchema,
  ChatInviteRequest,
  ChatInviteRequestSchema,
  ChatListenRequest,
  ChatListenRequestSchema,
  ChatMessageRequest,
  ChatMessageRequestSchema,
  ChatPermitRequest,
  ChatPermitRequestSchema,
  ChatReactRequest,
  ChatReactRequestSchema,
  ChatReadRequest,
  ChatReadRequestSchema,
  ChatUnfurlRequest,
  ChatUnfurlRequestSchema,
  TypedCommsResponse,
  UnfurlResponse
} from './clientTypes'
import WebSocket from 'isomorphic-ws'
import EventEmitter from 'events'
import type TypedEmitter from 'typed-emitter'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector/types'
import type { AuthService } from '../../services/Auth'
import type { EventEmitterTarget } from '../../utils/EventEmitterTarget'
import { parseRequestParameters } from '../../utils/parseRequestParameters'

export class ChatsApi
  extends BaseAPI
  implements EventEmitterTarget<ChatEvents>
{
  private chatSecrets: Record<string, Uint8Array> = {}
  private readonly eventEmitter: TypedEmitter<ChatEvents>
  private websocket: WebSocket | undefined
  /**
   * The current user ID to use when connecting/reconnecting the websocket
   */
  private listenUserId?: string

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
    private readonly auth: AuthService,
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

  /**
   * Establishes a websocket connection for listening to chat events.
   * @param requestParameters.currentUserId the user to listen for chat events for
   */
  public async listen(requestParameters: ChatListenRequest) {
    const { currentUserId } = parseRequestParameters(
      'listen',
      ChatListenRequestSchema
    )(requestParameters)
    this.listenUserId = currentUserId
    const endpoint =
      await this.discoveryNodeSelectorService.getSelectedEndpoint()
    if (endpoint) {
      this.websocket = await this.createWebsocket(endpoint)
    } else {
      throw new Error('No services available to listen to')
    }
  }

  public async get(requestParameters: ChatGetRequest) {
    const { chatId } = parseRequestParameters(
      'get',
      ChatGetRequestSchema
    )(requestParameters)
    const response = await this.getRaw(chatId)
    return {
      ...response,
      data: response.data
        ? await this.decryptLastChatMessage(response.data)
        : response.data
    }
  }

  public async getAll(requestParameters?: ChatGetAllRequest) {
    const { currentUserId, limit, before, after } = parseRequestParameters(
      'getAll',
      ChatGetAllRequestSchema
    )(requestParameters)
    const path = `/comms/chats`
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (limit) {
      query['limit'] = limit
    }
    if (before) {
      query['before'] = before
    }
    if (after) {
      query['after'] = after
    }
    if (currentUserId) {
      query['current_user_id'] = currentUserId
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
    const { currentUserId, chatId, limit, before, after } =
      parseRequestParameters(
        'getMessages',
        ChatGetMessagesRequestSchema
      )(requestParameters)

    const sharedSecret = await this.getChatSecret(chatId)
    const path = `/comms/chats/${chatId}/messages`
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (limit) {
      query['limit'] = limit
    }
    if (before) {
      query['before'] = before
    }
    if (after) {
      query['after'] = after
    }
    if (currentUserId) {
      query['current_user_id'] = currentUserId
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
    const res = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/unread`,
      headers: {},
      query
    })
    return (await res.json()) as TypedCommsResponse<number>
  }

  public async getPermissions(requestParameters: ChatGetPermissionRequest) {
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    const { userIds } = parseRequestParameters(
      'getPermissions',
      ChatGetPermissionRequestSchema
    )(requestParameters)
    query['id'] = userIds

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

  public async unfurl(requestParameters: ChatUnfurlRequest) {
    const { urls } = parseRequestParameters(
      'unfurl',
      ChatUnfurlRequestSchema
    )(requestParameters)
    const query: HTTPQuery = {
      content: urls
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
    const { currentUserId, userId, invitedUserIds } = parseRequestParameters(
      'create',
      ChatCreateRequestSchema
    )(requestParameters)

    const chatId = [userId, ...invitedUserIds].sort().join(':')
    const chatSecret = secp.utils.randomPrivateKey()
    this.chatSecrets[chatId] = chatSecret
    const invites = await this.createInvites(userId, invitedUserIds, chatSecret)

    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.create',
      params: {
        chat_id: chatId,
        invites
      }
    })
  }

  public async invite(requestParameters: ChatInviteRequest) {
    const { currentUserId, chatId, userId, invitedUserIds } =
      parseRequestParameters(
        'invite',
        ChatInviteRequestSchema
      )(requestParameters)

    const chatSecret = await this.getChatSecret(chatId)
    const invites = await this.createInvites(userId, invitedUserIds, chatSecret)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.invite',
      params: {
        chat_id: chatId,
        invites
      }
    })
  }

  public async message(requestParameters: ChatMessageRequest) {
    const { currentUserId, chatId, message, messageId } =
      parseRequestParameters(
        'message',
        ChatMessageRequestSchema
      )(requestParameters)
    const chatSecret = await this.getChatSecret(chatId)
    const encrypted = await this.encryptString(chatSecret, message)
    const encodedMessage = base64.encode(encrypted)

    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.message',
      params: {
        chat_id: chatId,
        message_id: messageId ?? ulid(),
        message: encodedMessage
      }
    })
  }

  public async react(requestParameters: ChatReactRequest) {
    const { currentUserId, chatId, messageId, reaction } =
      parseRequestParameters('react', ChatReactRequestSchema)(requestParameters)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.react',
      params: {
        chat_id: chatId,
        message_id: messageId,
        reaction: reaction
      }
    })
  }

  public async read(requestParameters: ChatReadRequest) {
    const { currentUserId, chatId } = parseRequestParameters(
      'read',
      ChatReadRequestSchema
    )(requestParameters)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.read',
      params: {
        chat_id: chatId
      }
    })
  }

  public async block(requestParameters: ChatBlockRequest) {
    const { currentUserId, userId } = parseRequestParameters(
      'block',
      ChatBlockRequestSchema
    )(requestParameters)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.block',
      params: {
        user_id: userId
      }
    })
  }

  public async unblock(requestParameters: ChatBlockRequest) {
    const { currentUserId, userId } = parseRequestParameters(
      'unblock',
      ChatBlockRequestSchema
    )(requestParameters)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.unblock',
      params: {
        user_id: userId
      }
    })
  }

  public async delete(requestParameters: ChatDeleteRequest) {
    const { currentUserId, chatId } = parseRequestParameters(
      'delete',
      ChatDeleteRequestSchema
    )(requestParameters)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.delete',
      params: {
        chat_id: chatId
      }
    })
  }

  public async permit(requestParameters: ChatPermitRequest) {
    const { currentUserId, permit } = parseRequestParameters(
      'permit',
      ChatPermitRequestSchema
    )(requestParameters)
    return await this.sendRpc({
      current_user_id: currentUserId,
      method: 'chat.permit',
      params: {
        permit
      }
    })
  }

  // #endregion

  // #region PRIVATE

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
    const sharedSecret = await this.auth.getSharedSecret(inviteePublicKey)
    const encryptedChatSecret = await this.encrypt(sharedSecret, chatSecret)
    const inviteCode = new Uint8Array(65 + encryptedChatSecret.length)
    inviteCode.set(userPublicKey)
    inviteCode.set(encryptedChatSecret, 65)
    return inviteCode
  }

  private async readInviteCode(inviteCode: Uint8Array) {
    const friendPublicKey = inviteCode.slice(0, 65)
    const chatSecretEncrypted = inviteCode.slice(65)
    const sharedSecret = await this.auth.getSharedSecret(friendPublicKey)
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
    const [allSignatureBytes, recoveryByte] = await this.auth.sign(payload)
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

  private async sendRpc(
    args: RPCPayloadRequest & { current_user_id?: string }
  ) {
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
    let originalUrl = `/comms/chats/ws?timestamp=${timestamp}`
    if (this.listenUserId) {
      originalUrl = `${originalUrl}&current_user_id=${this.listenUserId}`
    }
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
