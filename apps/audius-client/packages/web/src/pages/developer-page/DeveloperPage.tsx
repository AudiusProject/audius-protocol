import { useCallback, useState } from 'react'

import { encodeHashId, accountSelectors, FeatureFlags } from '@audius/common'
import {
  CreateGrantRequest,
  CreateDeveloperAppRequest,
  DeleteDeveloperAppRequest
} from '@audius/sdk'

import { useSelector } from 'common/hooks/useSelector'
import { useFlag } from 'hooks/useRemoteConfig'
import NotFoundPage from 'pages/not-found-page/NotFoundPage'
import { audiusSdk } from 'services/audius-sdk'

import styles from './DeveloperPage.module.css'

const { getAccountUser } = accountSelectors

// TODO: Move to saga, add confirmation (unless we confirm in SDK itself)
const createGrant = async ({ userId, appApiKey }: CreateGrantRequest) => {
  const sdk = await audiusSdk()
  await sdk.grants.createGrant({
    userId,
    appApiKey
  })
  return appApiKey
}

// TODO: Move to saga, add confirmation (unless we confirm in SDK itself)
const createDeveloperApp = async ({
  userId,
  name,
  isPersonalAccess
}: CreateDeveloperAppRequest) => {
  const sdk = await audiusSdk()
  const res = await sdk.developerApps.createDeveloperApp({
    userId,
    name,
    isPersonalAccess
  })
  return { apiKey: res.apiKey, apiSecret: res.apiSecret }
}

// TODO: Move to saga, add confirmation (unless we confirm in SDK itself)
const deleteDeveloperApp = async ({
  userId,
  appApiKey
}: DeleteDeveloperAppRequest) => {
  const sdk = await audiusSdk()
  await sdk.developerApps.deleteDeveloperApp({
    userId,
    appApiKey
  })
  return appApiKey
}

export const DeveloperPage = () => {
  const [createAppResult, setCreateAppResult] = useState<null | {
    apiKey: string
    apiSecret: string
  }>(null)
  const { isEnabled: isDeveloperAppsPageEnabled } = useFlag(
    FeatureFlags.DEVELOPER_APPS_PAGE
  )
  const [deleteSuccess, setDeleteSuccess] = useState<boolean | null>(null)
  const currentUserId = useSelector((state) => {
    return getAccountUser(state)?.user_id
  })

  const reset = () => {
    setCreateAppResult(null)
    setDeleteSuccess(null)
  }

  const handleSubmitDeveloperApp = useCallback(
    async (isPersonalAccess: boolean) => {
      if (!currentUserId) return
      reset()
      let res: { apiKey: string; apiSecret: string } | null = null
      const encodedUserId = encodeHashId(currentUserId)
      try {
        res = await createDeveloperApp({
          userId: encodedUserId,
          name: 'Test app',
          isPersonalAccess
        })
      } catch (e) {
        console.error('There was an error: ', e)
        return
      }

      // TODO: Ideally move this logic to SDK's createDeveloperApp
      if (isPersonalAccess) {
        try {
          await createGrant({ appApiKey: res.apiKey, userId: encodedUserId })
        } catch (e) {
          console.error('There was an error: ', e)
        }
      }
      setCreateAppResult(res)
    },
    [currentUserId]
  )

  const handleDeleteDeveloperApp = useCallback(async () => {
    if (!currentUserId || !createAppResult) return
    try {
      await deleteDeveloperApp({
        userId: encodeHashId(currentUserId),
        appApiKey: createAppResult.apiKey
      })
    } catch (e) {
      console.error('There was an error: ', e)
    }
    setDeleteSuccess(true)
  }, [createAppResult, currentUserId])

  if (!isDeveloperAppsPageEnabled) {
    return <NotFoundPage />
  }
  return (
    <div className={styles.container}>
      <button onClick={() => handleSubmitDeveloperApp(false)}>
        Create Developer App
      </button>
      <button onClick={() => handleSubmitDeveloperApp(true)}>
        Create Personal Use API Key
      </button>
      <div>
        {createAppResult == null ? null : (
          <div>
            <div>
              <p>Success! Here are your app&apos;s credentials:</p>
              <p>
                API Key: {createAppResult.apiKey}
                <br />
                API Secret: {createAppResult.apiSecret}
              </p>
            </div>
            <div>
              <button onClick={handleDeleteDeveloperApp}>Delete App</button>
              {deleteSuccess == null ? null : <p>App successfully deleted</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
