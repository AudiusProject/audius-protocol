import { useCallback, useState } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'

import { useAppContext } from '~/context/appContext'
import { Name } from '~/models/Analytics'
import { Status } from '~/models/Status'
import { accountSelectors } from '~/store/account'
import {
  chatActions,
  chatSelectors,
  InboxSettingsFormValues
} from '~/store/pages'
import { transformMapToPermitList } from '~/utils/chatUtils'

const { fetchPermissions } = chatActions
const { getChatPermissionsStatus, getUserChatPermissions } = chatSelectors
const { getUserId } = accountSelectors

type useSetInboxPermissionsProps = {
  audiusSdk: () => Promise<AudiusSdk>
}

const INBOX_PERMISSIONS_SPINNER_TIMEOUT = 1000

export const useSetInboxPermissions = ({
  audiusSdk
}: useSetInboxPermissionsProps) => {
  const dispatch = useDispatch()
  const permissions = useSelector(getUserChatPermissions)
  const {
    analytics: { track, make }
  } = useAppContext()
  const permissionsStatus = useSelector(getChatPermissionsStatus)
  const userId = useSelector(getUserId)
  const [savePermissionStatus, setSavePermissionStatus] = useState<Status>(
    Status.IDLE
  )
  const [showSpinner, setShowSpinner] = useState(false)

  const doFetchPermissions = useCallback(() => {
    if (userId) {
      dispatch(fetchPermissions({ userIds: [userId] }))
    }
  }, [dispatch, userId])

  const savePermissions = useCallback(
    async (permitMap: InboxSettingsFormValues) => {
      let permitList
      if (savePermissionStatus !== Status.LOADING) {
        setSavePermissionStatus(Status.LOADING)
        setShowSpinner(false)
        // Only show the spinner if saving takes a while
        setTimeout(
          () => setShowSpinner(true),
          INBOX_PERMISSIONS_SPINNER_TIMEOUT
        )
        try {
          const sdk = await audiusSdk()
          permitList = transformMapToPermitList(permitMap)
          await sdk.chats.permit({ permitList, allow: true })
          doFetchPermissions()
          setSavePermissionStatus(Status.SUCCESS)
          track(
            make({
              eventName: Name.CHANGE_INBOX_SETTINGS_SUCCESS,
              permitList
            })
          )
        } catch (e) {
          console.error('Error saving chat permissions:', e)
          setSavePermissionStatus(Status.ERROR)
          track(
            make({
              eventName: Name.CHANGE_INBOX_SETTINGS_FAILURE,
              permitList
            })
          )
        }
      }
    },
    [savePermissionStatus, audiusSdk, track, make, doFetchPermissions]
  )

  return {
    /**
     * The current user's permissions.
     */
    permissions,
    /**
     * The current permissions status.
     */
    permissionsStatus,
    /**
     * Fetches the current user's permissions from the backend.
     */
    doFetchPermissions,
    /**
     * Saves the current user's permissions to the backend.
     */
    savePermissions,
    /**
     * The status of the save permissions operation.
     */
    savePermissionStatus,
    /**
     * Whether or not to show the spinner. Timer sets to
     * true 1s after saving permissions, use in conjunction
     * with savePermissionStatus.
     */
    showSpinner
  }
}
