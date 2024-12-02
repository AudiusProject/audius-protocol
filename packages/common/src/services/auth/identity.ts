import { SetAuthFn } from '@audius/hedgehog'
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import sigUtil from 'eth-sig-util'

import { uuid } from '~/utils/uid'

import { AuthHeaders } from './types'

type Data = Record<string, unknown>
type SetAuthFnParams = Parameters<SetAuthFn>[0]
export type RecoveryInfoParams = {
  login: string
  host: string
  data: string
  signature: string
}

export type IdentityRequestError = AxiosError

export type IdentityServiceConfig = {
  identityServiceEndpoint: string
}

export class IdentityService {
  identityServiceEndpoint: string

  constructor({ identityServiceEndpoint }: IdentityServiceConfig) {
    this.identityServiceEndpoint = identityServiceEndpoint
  }

  /* ------- HEDGEHOG AUTH ------- */

  async getFn(params: {
    lookupKey: string
    username: string
    visitorId?: string
    otp?: string
  }): Promise<{ iv: string; cipherText: string }> {
    return await this._makeRequest({
      url: '/authentication',
      method: 'get',
      params
    })
  }

  async setAuthFn(obj: SetAuthFnParams) {
    // get wallet from hedgehog and set as owner wallet
    const ownerWallet = obj.wallet
    // delete wallet object so it's not passed to identity
    // @ts-ignore
    delete obj.wallet

    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = sigUtil.personalSign(ownerWallet.getPrivateKey(), {
      data
    })
    const headers = {
      [AuthHeaders.Message]: data,
      [AuthHeaders.Signature]: signature
    }

    return await this._makeRequest({
      url: '/authentication',
      method: 'post',
      headers,
      data: obj
    })
  }

  async setUserFn(obj: Data & { token?: string }) {
    return await this._makeRequest({
      url: '/user',
      method: 'post',
      data: obj
    })
  }

  /* ------- USER FUNCTIONS ------- */
  async sendRecoveryInfo(data: RecoveryInfoParams) {
    return await this._makeRequest<{ status: true }>({
      url: '/recovery',
      method: 'post',
      data
    })
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  // TODO: Use regular `fetch` and same request patterns as SDK
  async _makeRequest<T = unknown>(axiosRequestObj: AxiosRequestConfig) {
    axiosRequestObj.baseURL =
      axiosRequestObj.baseURL || this.identityServiceEndpoint

    const requestId = uuid()
    axiosRequestObj.headers = {
      ...(axiosRequestObj.headers || {}),
      'X-Request-ID': requestId
    }

    // Axios throws for non-200 responses
    try {
      const resp: AxiosResponse<T> = await axios(axiosRequestObj)
      if (!resp.data) {
        throw new Error(
          `Identity response missing data field for url: ${axiosRequestObj.url}, req-id: ${requestId}`
        )
      }
      return resp.data
    } catch (e) {
      const error = e as AxiosError
      if (error.response?.data?.error) {
        console.error(
          `Server returned error for requestId ${requestId}: [${error.response.status.toString()}] ${
            error.response.data.error
          }`
        )
      }
      throw error
    }
  }
}
