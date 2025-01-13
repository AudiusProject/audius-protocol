import { Id } from '@audius/sdk'

import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { DeveloperApp } from './developerApps'

type RemoveAuthorizedAppArgs = {
  apiKey: string
  userId: number
}

const authorizedAppsApi = createApi({
  reducerPath: 'authorizedAppsApi',
  endpoints: {
    getAuthorizedApps: {
      async fetch({ id }: { id: ID }, { audiusSdk }) {
        const encodedUserId = Id.parse(id)
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.users.getAuthorizedApps({
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
    removeAuthorizedApp: {
      async fetch(args: RemoveAuthorizedAppArgs, { audiusSdk }) {
        const { userId, apiKey } = args
        const encodedUserId = Id.parse(userId)
        const sdk = await audiusSdk()

        await sdk.grants.revokeGrant({
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
          authorizedAppsApi.util.updateQueryData(
            'getAuthorizedApps',
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

export const { useGetAuthorizedApps, useRemoveAuthorizedApp } =
  authorizedAppsApi.hooks

export const authorizedAppsApiReducer = authorizedAppsApi.reducer
