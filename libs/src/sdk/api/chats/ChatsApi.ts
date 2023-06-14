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
  ChatGetBlockersRequest,
  ChatGetBlockersRequestSchema,
  ChatGetMessagesRequest,
  ChatGetMessagesRequestSchema,
  ChatGetPermissionRequest,
  ChatGetPermissionRequestSchema,
  ChatGetRequest,
  ChatGetRequestSchema,
  ChatGetUnreadCountRequest,
  ChatGetUnreadCountRequestSchema,
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
  /**
   * A map of chatId => chatSecret so we don't have to repeatedly fetch it
   */
  private chatSecrets: Record<string, Uint8Array> = {}
  /**
   * An event emitter that's used for consumers to listen for chat events
   */
  private readonly eventEmitter: TypedEmitter<ChatEvents>
  /**
   * The websocket currently in use
   */
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

  /**
   * Gets a single chat
   * @param requestParameters.chatId the chat to get
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the chat response
   */
  public async get(requestParameters: ChatGetRequest) {
    const { chatId, currentUserId } = parseRequestParameters(
      'get',
      ChatGetRequestSchema
    )(requestParameters)
    const response = await this.getRaw(chatId, currentUserId)
    return {
      ...response,
      data: response.data
        ? await this.decryptLastChatMessage(response.data)
        : response.data
    }
  }

  /**
   * Gets a list of chats
   * @param requestParameters.limit the max number of chats to get
   * @param requestParameters.before a timestamp cursor for pagination
   * @param requestParameters.after a timestamp cursor for pagination
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the chat list response
   */
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

  /**
   * Gets a list of messages
   * @param requestParameters.chatId the chat to get messages for
   * @param requestParameters.before a timestamp cursor for pagination
   * @param requestParameters.after a timestamp cursor for pagination
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the messages list response
   */
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

  /**
   * Gets the total unread message count for a user
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the unread count response
   */
  public async getUnreadCount(requestParameters: ChatGetUnreadCountRequest) {
    const { currentUserId } = parseRequestParameters(
      'getUnreadCount',
      ChatGetUnreadCountRequestSchema
    )(requestParameters)
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (currentUserId) {
      query['current_user_id'] = currentUserId
    }
    const res = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/unread`,
      headers: {},
      query
    })
    return (await res.json()) as TypedCommsResponse<number>
  }

  /**
   * Gets the permission settings of the given users
   * @param requestParameters.userIds the users to fetch permissions of
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the permissions response
   */
  public async getPermissions(requestParameters: ChatGetPermissionRequest) {
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    const { userIds, currentUserId } = parseRequestParameters(
      'getPermissions',
      ChatGetPermissionRequestSchema
    )(requestParameters)
    query['id'] = userIds
    if (currentUserId) {
      query['current_user_id'] = currentUserId
    }

    const res = await this.signAndSendRequest({
      method: 'GET',
      path: '/comms/chats/permissions',
      headers: {},
      query
    })
    return (await res.json()) as TypedCommsResponse<ValidatedChatPermissions[]>
  }

  /**
   * Gets the user ids that have blocked the current user
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the blockers response
   */
  public async getBlockers(requestParameters: ChatGetBlockersRequest) {
    const { currentUserId } = parseRequestParameters(
      'getBlockers',
      ChatGetBlockersRequestSchema
    )(requestParameters)
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (currentUserId) {
      query['current_user_id'] = currentUserId
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/blockers`,
      headers: {},
      query
    })
    return (await response.json()) as TypedCommsResponse<string[]>
  }

  /**
   * Gets the user ids the current user has blocked
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns
   */
  public async getBlockees(requestParameters: ChatGetBlockersRequest) {
    const { currentUserId } = parseRequestParameters(
      'getBlockees',
      ChatGetBlockersRequestSchema
    )(requestParameters)
    const query: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (currentUserId) {
      query['current_user_id'] = currentUserId
    }
    const response = await this.signAndSendRequest({
      method: 'GET',
      path: `/comms/chats/blockees`,
      headers: {},
      query
    })
    return (await response.json()) as TypedCommsResponse<string[]>
  }

  /**
   * Gets URL metadata useful for link previews
   * @param requestParameters.content the urls to get metadata for
   * @returns the unfurl response
   */
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

  /**
   * Creates a chat between users
   * @param requestParameters.userId the user id who is creating the chat
   * @param requestParameters.invitedUserIds the user ids to add to the chat
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Invites other users to an existing chat
   * @param requestParameters.chatId the chat id of the chat to invite to
   * @param requestParameters.userId the user id who is creating the chat
   * @param requestParameters.invitedUserIds the user ids to add to the chat
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Sends a message to a user in a chat
   * @param requestParameters.message the message
   * @param requestParameters.chatId the chat to send a message in
   * @param requestParameters.messageId the id of the message
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Reacts to a message
   * @param requestParameters.reaction the reaction
   * @param requestParameters.chatId the chat to send a reaction in
   * @param requestParameters.messageId the id of the message to react to
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Marks a chat as read
   * @param requestParameters.chatId the chat to mark as read
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Blocks a user from sending messages to the current user
   * @param requestParameters.userId the user to block
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Unblocks a user from sending messages to the current user
   * @param requestParameters.userId the user to unblock
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Clears a chat's history for the current user
   * @param requestParameters.chatId the chat to clear
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  /**
   * Sets the inbox settings permissions of the current user
   * @param requestParameters.permit the permission to set
   * @param requestParameters.currentUserId the user to act on behalf of
   * @returns the rpc object
   */
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

  private async getRaw(chatId: string, currentUserId?: string) {
    const path = `/comms/chats/${chatId}`
    const queryParameters: HTTPQuery = {
      timestamp: new Date().getTime()
    }
    if (currentUserId) {
      queryParameters['current_user_id'] = currentUserId
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
