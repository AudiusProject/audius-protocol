import { useCallback, useEffect } from 'react'

import { useRemoveAuthorizedApp } from '@audius/common/api'
import { Name, Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Button, ModalFooter } from '@audius/harmony'

import { useSelector } from 'common/hooks/useSelector'
import { make, useRecord } from 'common/store/analytics/actions'

import styles from './RemoveAppConfirmationPage.module.css'
import { AuthorizedAppPageProps, AuthorizedAppsPages } from './types'

const { getUserId } = accountSelectors

const messages = {
  confirmation: 'Are you sure you want to remove this app?',
  cancel: 'Cancel',
  removeApp: 'Remove',
  removingApp: 'Removing'
}

type AuthorizedAppConfirmationPageProps = AuthorizedAppPageProps

export const RemoveAppConfirmationPage = (
  props: AuthorizedAppConfirmationPageProps
) => {
  const { params, setPage } = props
  const {
    mutate: removeAuthorizedApp,
    error,
    isError,
    isSuccess
  } = useRemoveAuthorizedApp()
  const userId = useSelector(getUserId)
  const record = useRecord()
  const apiKey = params?.apiKey

  const handleCancel = useCallback(() => {
    setPage(AuthorizedAppsPages.YOUR_APPS)
  }, [setPage])

  const handleRemove = useCallback(() => {
    if (!userId || !apiKey) return
    removeAuthorizedApp({ userId, apiKey })
  }, [userId, apiKey, removeAuthorizedApp])

  useEffect(() => {
    if (isSuccess) {
      setPage(AuthorizedAppsPages.YOUR_APPS)
      record(
        make(Name.AUTHORIZED_APP_REMOVE_SUCCESS, {
          name: params?.name,
          apiKey: params?.apiKey
        })
      )
    }
  }, [isSuccess, setPage, record, params?.name, params?.apiKey])

  useEffect(() => {
    if (status === Status.ERROR) {
      setPage(AuthorizedAppsPages.YOUR_APPS)
      record(
        make(Name.AUTHORIZED_APP_REMOVE_ERROR, {
          name: params?.name,
          apiKey: params?.apiKey,
          error: error?.message
        })
      )
    }
  }, [isError, setPage, record, params?.name, params?.apiKey, error])

  if (!params) return null

  const { name } = params

  const isRemoving = status !== Status.IDLE

  return (
    <div>
      <h4 className={styles.header}>{name}</h4>
      <p className={styles.confirmation}>{messages.confirmation}</p>
      <ModalFooter css={{ paddingBottom: `0 !important` }}>
        <Button
          variant='secondary'
          onClick={handleCancel}
          disabled={isRemoving}
          fullWidth
        >
          {messages.cancel}
        </Button>
        <Button
          variant='destructive'
          fullWidth
          onClick={handleRemove}
          isLoading={isRemoving}
        >
          {isRemoving ? messages.removingApp : messages.removeApp}
        </Button>
      </ModalFooter>
    </div>
  )
}
