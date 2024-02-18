import { AudiusSdk, TrackResponse, UserResponse, sdk } from '@audius/sdk'
import axios from 'axios'
import { useEffect, useState } from 'react'

const StageApiKey = import.meta.env.VITE_API_KEY_STAGE || ''
const StageApiSecret = import.meta.env.VITE_API_SECRET_STAGE || ''
const ProdAPiKey = import.meta.env.VITE_API_KEY_PROD || ''
const ProdApiSecret = import.meta.env.VITE_API_SECRET_PROD || ''

// const audiusSdkStage = sdk({
//   apiKey: StageApiKey,
//   apiSecret: StageApiSecret
// })

// const audiusSdkProd = sdk({
//   apiKey: ProdAPiKey,
//   apiSecret: ProdApiSecret
// })

// export const getSdk = (env: string): AudiusSdk =>
//   env === 'stage' ? audiusSdkStage : audiusSdkProd

export const getBaseUrl = (env: string): string =>
  env == 'stage'
    ? 'https://discoveryprovider.staging.audius.co/v1'
    : 'https://discoveryprovider.audius.co/v1'

/** hooks */

type GetUserResult = {
  user: UserResponse | null
  loading: boolean
  error: Error | null
}

export const getUser = (env: string, handle: string): GetUserResult => {
  const [data, setData] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const sdkRequest = async () => {
      const url = `${getBaseUrl(env)}/users/handle/${handle}`
      try {
        const user = await axios.get(url)
        setData(user.data)
      } catch (e) {
        const error: Error = e as Error
        setError(error)
      } finally {
        setLoading(false)
      }
    }
    sdkRequest()
  }, [handle])

  return { user: data, loading, error }
}

type GetTrackResult = {
  track: TrackResponse | null
  loading: boolean
  error: Error | null
}

export const getTrack = (
  env: string,
  handle: string,
  trackSlug: string
): GetTrackResult => {
  const [data, setData] = useState<TrackResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const sdkRequest = async () => {
      const url = `${getBaseUrl(env)}/tracks?handle=${handle}&slug=${trackSlug}`
      console.log({ url })
      try {
        const user = await axios.get(url)
        setData(user.data)
      } catch (e) {
        const error: Error = e as Error
        setError(error)
      } finally {
        setLoading(false)
      }
    }
    sdkRequest()
  }, [trackSlug])

  return { track: data, loading, error }
}
