import { BaseAPI, RequiredError } from './generated/default'
import * as aes from 'micro-aes-gcm'
import { base64 } from '@scure/base'

type GetMessagesRequestArgs = {
  otherUserId: string
  last_message_id?: string
  limit?: number
}

type SendMessageRequestArgs = {
  otherUserId: string
  message: string
}

type SendMessageRpcMethodArgs = {
  method: 'send_message'
  params: {
    other_user_id: string
    message: string
  }
}

type MessageResponse = {
  sender_user_id: string
  receiver_user_id: string
  message: string
}

export type SendRpcArgs = SendMessageRpcMethodArgs

export class AccessError extends Error {
  constructor(method: string) {
    super(
      `The '${method}' method requires the user signature. Wallet API configuration missing.`
    )
  }
}

export class MessagesApi extends BaseAPI {
  public async sendMessage(requestParameters: SendMessageRequestArgs) {
    // Error checking
    if (!this.configuration.walletApi) {
      throw new AccessError('sendMessage')
    }
    if (!requestParameters.otherUserId) {
      throw new RequiredError(
        'otherUserId',
        'Required parameter requestParameters.otherUserId was null or undefined when calling sendMessage.'
      )
    }
    if (!requestParameters.message) {
      throw new RequiredError(
        'message',
        'Required parameter requestParameters.message was null or undefined when calling sendMessage.'
      )
    }

    const receiverPubKey = await this.getPublicKey(
      requestParameters.otherUserId
    )
    const sharedSecret = await this.configuration.walletApi.getSharedSecret(
      receiverPubKey
    )
    const encrypted = await aes.encrypt(
      sharedSecret.slice(sharedSecret.length - 32),
      requestParameters.message
    )

    return await this.sendRpc({
      method: 'send_message',
      params: {
        other_user_id: requestParameters.otherUserId,
        message: base64.encode(encrypted)
      }
    })
  }

  public async getMessages(requestParameters: GetMessagesRequestArgs) {
    // Error Checking
    if (!this.configuration.walletApi) {
      throw new AccessError('getMessages')
    }
    if (!requestParameters.otherUserId) {
      throw new RequiredError(
        'otherUserId',
        'Required parameter requestParameters.otherUserId was null or undefined when calling getMessages.'
      )
    }

    const path = `/messages/${requestParameters.otherUserId}`
    const senderPubKey = await this.getPublicKey(requestParameters.otherUserId)
    const sharedSecret = await this.configuration.walletApi.getSharedSecret(
      senderPubKey
    )
    const messages: MessageResponse[] = await this.request({
      path: path,
      headers: await this.getSignatureHeader(path),
      method: 'GET'
    })
    return await Promise.all(
      messages.map(async (m) => {
        const decrypted = await aes.decrypt(
          sharedSecret.slice(sharedSecret.length - 32),
          m.message
        )
        return {
          ...m,
          message: decrypted
        }
      })
    )
  }

  private async getPublicKey(userId: string) {
    const response = await this.request({
      path: `/pubkey/${userId}`,
      method: 'GET',
      headers: {}
    })
    const base64key = await response.text()
    return base64.decode(base64key)
  }

  private async getSignatureHeader(payload: string) {
    if (!this.configuration.walletApi) {
      throw new AccessError('getSignatureHeader')
    }
    const [allSignatureBytes, recoveryByte] =
      await this.configuration.walletApi.sign(payload)
    const signatureBytes = new Uint8Array(65)
    signatureBytes.set(allSignatureBytes, 0)
    signatureBytes[64] = recoveryByte
    return { 'x-sig': base64.encode(signatureBytes) }
  }

  private async sendRpc(args: SendRpcArgs) {
    if (!this.configuration.walletApi) {
      throw new AccessError('sendRpc')
    }
    const payload = JSON.stringify(args)
    return await this.request({
      path: `/send`,
      method: 'POST',
      headers: await this.getSignatureHeader(payload),
      body: payload
    })
  }
}
