import { Id } from '@audius/sdk'
import { z } from 'zod'

import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'

export const DEVELOPER_APP_DESCRIPTION_MAX_LENGTH = 128
export const DEVELOPER_APP_NAME_MAX_LENGTH = 50
export const DEVELOPER_APP_IMAGE_URL_MAX_LENGTH = 2000
const DEVELOPER_APP_IMAGE_URL_REGEX = /^(https?):\/\//i

const messages = {
  invalidUrl: 'Invalid URL'
}

export const developerAppSchema = z.object({
  userId: z.number(),
  name: z.string().max(DEVELOPER_APP_NAME_MAX_LENGTH),
  imageUrl: z.optional(
    z
      .string()
      .max(DEVELOPER_APP_IMAGE_URL_MAX_LENGTH)
      .refine((value) => DEVELOPER_APP_IMAGE_URL_REGEX.test(value), {
        message: messages.invalidUrl
      })
  ),
  description: z.string().max(DEVELOPER_APP_DESCRIPTION_MAX_LENGTH).optional()
})

export const developerAppEditSchema = z.object({
  userId: z.number(),
  apiKey: z.string(),
  name: z.string().max(DEVELOPER_APP_NAME_MAX_LENGTH),
  imageUrl: z.optional(
    z
      .string()
      .max(DEVELOPER_APP_IMAGE_URL_MAX_LENGTH)
      .refine((value) => DEVELOPER_APP_IMAGE_URL_REGEX.test(value), {
        message: messages.invalidUrl
      })
  ),
  description: z.string().max(DEVELOPER_APP_DESCRIPTION_MAX_LENGTH).optional()
})

export type DeveloperApp = {
  name: string
  description?: string
  imageUrl?: string
  apiKey: string
  apiSecret?: string
}

type NewAppPayload = Omit<DeveloperApp, 'apiKey'> & {
  userId: number
}

type EditAppPayload = Omit<DeveloperApp, 'apiSecret'> & { userId: number }

type DeleteDeveloperAppArgs = {
  apiKey: string
  userId: number
}

const developerAppsApi = createApi({
  reducerPath: 'developerAppsApi',
  endpoints: {
    getDeveloperApps: {
      async fetch({ id }: { id: ID }, { audiusSdk }) {
        const encodedUserId = Id.parse(id)
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.users.getDeveloperApps({
          id: encodedUserId
        })

        return {
          apps: data.map(
            ({ address, name, description, imageUrl }): DeveloperApp => ({
              name,
              description,
              imageUrl,
              apiKey: address.slice(2)
            })
          )
        }
      },

      options: { idArgKey: 'id' }
    },
    addDeveloperApp: {
      async fetch(newApp: NewAppPayload, { audiusSdk }) {
        const { name, description, imageUrl, userId } = newApp
        const encodedUserId = Id.parse(userId)
        const sdk = await audiusSdk()

        const { apiKey, apiSecret } =
          await sdk.developerApps.createDeveloperApp({
            name,
            description,
            imageUrl,
            userId: encodedUserId
          })

        await sdk.grants.createGrant({
          userId: encodedUserId,
          appApiKey: apiKey
        })

        return { name, description, imageUrl, apiKey, apiSecret }
      },
      options: {
        idArgKey: 'name',
        type: 'mutation'
      },
      async onQuerySuccess(
        newApp: DeveloperApp,
        newAppArgs: NewAppPayload,
        { dispatch }
      ) {
        const { userId } = newAppArgs
        const { apiSecret: apiSecretIgnored, ...restNewApp } = newApp
        dispatch(
          developerAppsApi.util.updateQueryData(
            'getDeveloperApps',
            { id: userId },
            (state) => {
              state.apps.push(restNewApp)
            }
          )
        )
      }
    },
    editDeveloperApp: {
      async fetch(editApp: EditAppPayload, { audiusSdk }) {
        const { name, description, imageUrl, userId, apiKey } = editApp
        const encodedUserId = Id.parse(userId)
        const sdk = await audiusSdk()

        await sdk.developerApps.updateDeveloperApp({
          appApiKey: apiKey,
          name,
          description,
          imageUrl,
          userId: encodedUserId
        })

        return { name, description, imageUrl, apiKey }
      },
      options: {
        idArgKey: 'name',
        type: 'mutation'
      },
      async onQuerySuccess(
        editApp: DeveloperApp,
        editAppArgs: NewAppPayload,
        { dispatch }
      ) {
        const { userId } = editAppArgs
        dispatch(
          developerAppsApi.util.updateQueryData(
            'getDeveloperApps',
            { id: userId },
            (state) => {
              const appIndex = state.apps.findIndex(
                (app) => app.apiKey === editApp.apiKey
              )
              state.apps[appIndex] = editApp
            }
          )
        )
      }
    },
    deleteDeveloperApp: {
      async fetch(args: DeleteDeveloperAppArgs, { audiusSdk }) {
        const { userId, apiKey } = args
        const encodedUserId = Id.parse(userId)
        const sdk = await audiusSdk()

        await sdk.developerApps.deleteDeveloperApp({
          userId: encodedUserId,
          appApiKey: apiKey
        })
        return {}
      },
      options: {
        type: 'mutation'
      },
      async onQuerySuccess(_response, args, { dispatch }) {
        const { userId, apiKey } = args
        dispatch(
          developerAppsApi.util.updateQueryData(
            'getDeveloperApps',
            { id: userId },
            (state) => {
              const appIndex = state.apps.findIndex(
                (app) => app.apiKey === apiKey
              )
              state.apps.splice(appIndex, 1)
            }
          )
        )
      }
    }
  }
})

export const {
  useGetDeveloperApps,
  useAddDeveloperApp,
  useEditDeveloperApp,
  useDeleteDeveloperApp
} = developerAppsApi.hooks

export const developerAppsApiReducer = developerAppsApi.reducer
