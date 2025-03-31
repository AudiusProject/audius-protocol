import {
  EthWallet,
  Hedgehog,
  WalletManager,
  getPlatformCreateKey
} from '@audius/hedgehog'
import type { SetAuthFn, SetUserFn, GetFn, CreateKey } from '@audius/hedgehog'
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import sigUtil from 'eth-sig-util'

import { uuid } from '~/utils/uid'

import type { LocalStorage } from '../local-storage'

import { AuthHeaders } from './types'

export type HedgehogConfig = {
  identityServiceEndpoint: string
  useLocalStorage?: boolean
  localStorage?: LocalStorage
  createKey?: CreateKey
}

export type ConfirmCredentialsArgs = {
  username: string
  password: string
  email?: string
  otp?: string
  softCheck?: boolean
}

export type HedgehogInstance = Hedgehog & {
  generateRecoveryInfo: () => Promise<{ login: string; host: string }>
  confirmCredentials: (args: ConfirmCredentialsArgs) => Promise<boolean>
}

export const createHedgehog = ({
  identityServiceEndpoint,
  useLocalStorage = true,
  localStorage,
  createKey = getPlatformCreateKey()
}: HedgehogConfig): HedgehogInstance => {
  const getAuthHeaders = async (wallet: EthWallet) => {
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const message = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = sigUtil.personalSign(wallet.getPrivateKey(), {
      data: message
    })
    return {
      [AuthHeaders.Message]: message,
      [AuthHeaders.Signature]: signature
    }
  }

  const makeIdentityRequest = async <T = unknown>(
    axiosRequestObj: AxiosRequestConfig
  ) => {
    axiosRequestObj.baseURL = identityServiceEndpoint

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

  const getFn: GetFn = async (params) => {
    return await makeIdentityRequest({
      url: '/authentication',
      method: 'GET',
      params
    })
  }

  const setAuthFn: SetAuthFn = async (params) => {
    // Get wallet from hedgehog to use for signing, remove from params sent to identity
    const { wallet: ownerWallet, ...data } = params

    const headers = await getAuthHeaders(ownerWallet)

    return await makeIdentityRequest({
      url: '/authentication',
      method: 'post',
      headers,
      data
    })
  }

  const setUserFn: SetUserFn = async (params) => {
    return await makeIdentityRequest({
      url: '/user',
      method: 'post',
      data: params
    })
  }

  const hedgehog = new Hedgehog(
    getFn as GetFn,
    setAuthFn,
    setUserFn,
    useLocalStorage,
    localStorage,
    createKey
  )

  /**
   * Generate secure credentials to allow login
   */
  // @ts-expect-error -- adding our own custom method to hedgehog
  hedgehog.generateRecoveryInfo = async () => {
    const entropy = await WalletManager.getEntropyFromLocalStorage(
      hedgehog.localStorage
    )
    if (entropy === null) {
      throw new Error('generateRecoveryLink - missing entropy')
    }
    let btoa // binary to base64 ASCII conversion
    let currentHost
    if (typeof window !== 'undefined' && window && window.btoa) {
      btoa = window.btoa
      currentHost = window.location.origin
    } else {
      btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
      currentHost = 'localhost'
    }
    const recoveryInfo = { login: btoa(entropy), host: currentHost }
    return recoveryInfo
  }

  const getLookupKey = async ({
    username,
    password
  }: {
    username: string
    password: string
  }) => {
    return await WalletManager.createAuthLookupKey(
      username,
      password,
      hedgehog.createKey
    )
  }

  // Wrap the original login method to handle ready state
  const originalLogin = hedgehog.login.bind(hedgehog)
  hedgehog.login = async (...params: Parameters<typeof originalLogin>) => {
    hedgehog.ready = false
    try {
      const wallet = await originalLogin(...params)
      return wallet
    } finally {
      hedgehog.ready = true
    }
  }

  const originalConfirmCredentials = hedgehog.confirmCredentials.bind(hedgehog)
  hedgehog.confirmCredentials = async ({
    softCheck,
    ...confirmCredentialsArgs
  }: ConfirmCredentialsArgs) => {
    if (softCheck) {
      const lookupKey = await getLookupKey({
        username: confirmCredentialsArgs.username,
        password: confirmCredentialsArgs.password
      })
      try {
        const wallet = hedgehog.wallet
        if (!wallet) {
          throw new Error(
            'Cannot check credentials - user is not authenticated'
          )
        }
        const headers = await getAuthHeaders(wallet)
        if (headers[AuthHeaders.Message] && headers[AuthHeaders.Signature]) {
          return await makeIdentityRequest({
            url: '/authentication/check',
            method: 'GET',
            headers,
            params: { lookupKey }
          })
        } else {
          throw new Error(
            'Cannot check credentials - user is not authenticated'
          )
        }
      } catch (e) {
        return false
      }
    }
    return await originalConfirmCredentials(confirmCredentialsArgs)
  }

  return hedgehog as HedgehogInstance
}
