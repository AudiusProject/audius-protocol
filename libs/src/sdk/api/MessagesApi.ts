import { BaseAPI, RequiredError } from './generated/default'
import * as aes from 'micro-aes-gcm'
import { bytesToBase64, base64ToBytes } from 'byte-base64'

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
    console.log({ sharedSecret })
    const encrypted = await aes.encrypt(
      sharedSecret.slice(sharedSecret.length - 32),
      requestParameters.message
    )

    return await this.sendRpc({
      method: 'send_message',
      params: {
        other_user_id: requestParameters.otherUserId,
        message: bytesToBase64(encrypted)
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
    const signature = await this.configuration.walletApi.sign(path)
    const messages: MessageResponse[] = await this.request({
      path: path,
      headers: {
        'x-sig': bytesToBase64(signature)
      },
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
    let base64key = ''
    if (userId === 'ngNmq') {
      base64key =
        'BMLr/Ia8LhZbf9Sn2NN4nRKq9udDDEdVT19FjLMj4olJriDnzlJylAwlcElB765qZdERS9XzDfj/cMlrlY8FiNQ='
    } else {
      base64key = await this.request({
        path: `/pubkey/${userId}`,
        method: 'GET',
        headers: {}
      })
    }
    return base64ToBytes(base64key)
  }

  private async sendRpc(args: SendRpcArgs) {
    if (!this.configuration.walletApi) {
      throw new AccessError('sendRpc')
    }
    const payload = JSON.stringify(args)
    const signature = await this.configuration.walletApi.sign(payload)
    console.log({
      path: `/send`,
      method: 'POST',
      headers: {
        'x-sig': bytesToBase64(signature)
      },
      body: payload
    })
    return await this.request({
      path: `/send`,
      method: 'POST',
      headers: {
        'x-sig': bytesToBase64(signature)
      },
      body: payload
    })
  }
}
