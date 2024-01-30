import { useCallback, useEffect, useState } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import { ChatPermission } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'

import { Name } from '~/models/Analytics'
import { Status } from '~/models/Status'
import { useAppContext } from 'src/context/appContext'
import { accountSelectors } from '~/store/account'
import { chatActions, chatSelectors } from '~/store/pages'

const { fetchPermissions } = chatActions
const { getUserChatPermissions } = chatSelectors
const { getUserId } = accountSelectors

type useSetInboxPermissionsProps = {
  audiusSdk: () => Promise<AudiusSdk>
}

const INBOX_PERMISSIONS_SPINNER_TIMEOUT = 1000

export const useSetInboxPermissions = ({
  audiusSdk
}: useSetInboxPermissionsProps) => {
  const dispatch = useDispatch()
  const {
    analytics: { track, make }
  } = useAppContext()
  const permissions = useSelector(getUserChatPermissions)
  const userId = useSelector(getUserId)
  const currentPermission = permissions?.permits
  const [permissionStatus, setPermissionStatus] = useState<Status>(Status.IDLE)
  const [showSpinner, setShowSpinner] = useState(false)
  const [localPermission, setLocalPermission] = useState<ChatPermission>(
    currentPermission ?? ChatPermission.ALL
  )

  // Update local permission state when permissions change in store.
  // Needed for when user closes/reopens settings before backend has updated.
  useEffect(() => {
    setLocalPermission(currentPermission ?? ChatPermission.ALL)
  }, [currentPermission])

  const doFetchPermissions = useCallback(() => {
    if (userId) {
      dispatch(fetchPermissions({ userIds: [userId] }))
    }
  }, [dispatch, userId])

  const _savePermissions = useCallback(
    async (permission: ChatPermission) => {
      if (permissionStatus !== Status.LOADING) {
        setPermissionStatus(Status.LOADING)
        setShowSpinner(false)
        // Only show the spinner if saving takes a while
        setTimeout(
          () => setShowSpinner(true),
          INBOX_PERMISSIONS_SPINNER_TIMEOUT
        )
        try {
          const sdk = await audiusSdk()
          await sdk.chats.permit({ permit: permission })
          setPermissionStatus(Status.SUCCESS)
          track(
            make({
              eventName: Name.CHANGE_INBOX_SETTINGS_SUCCESS,
              permission
            })
          )
        } catch (e) {
          console.error('Error saving chat permissions:', e)
          setPermissionStatus(Status.ERROR)
          track(
            make({
              eventName: Name.CHANGE_INBOX_SETTINGS_FAILURE,
              permission
            })
          )
        }
      }
    },
    [audiusSdk, track, make, permissionStatus]
  )

  // Save local permission state to backend. Useful in scenarios where we
  // want to save permissions on a button press, eg. desktop settings.
  const savePermissions = useCallback(async () => {
    await _savePermissions(localPermission)
  }, [_savePermissions, localPermission])

  // Set local permission state and save to backend. Useful in
  // scenarios where we want to set and save all at once, eg. mobile
  // settings screen with radio button options that fire when pressed.
  const setAndSavePermissions = useCallback(
    async (permission: ChatPermission) => {
      setLocalPermission(permission)
      await _savePermissions(permission)
    },
    [_savePermissions]
  )

  return {
    /**
     * The permission state that is set locally.
     */
    localPermission,
    /**
     * Setter for local permission state.
     */
    setLocalPermission,
    /**
     * Fetches the current user's permissions from the backend.
     */
    doFetchPermissions,
    /**
     * Saves the current user's permissions to the backend.
     */
    savePermissions,
    /**
     * Sets local permissions and saves it to the backend.
     */
    setAndSavePermissions,
    /**
     * The current save permission status.
     */
    permissionStatus,
    /**
     * Whether or not to show the spinner. Timer sets to
     * true 1s after saving permissions, use in conjunction
     * with permissionsStatus.
     */
    showSpinner
  }
}
