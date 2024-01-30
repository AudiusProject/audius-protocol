import { useCallback, useEffect } from 'react'

import { Status, accountSelectors, Name } from '@audius/common'
import { useDeleteDeveloperApp } from '@audius/common/api'
import { Button, ButtonType, ModalFooter } from '@audius/stems'

import { useSelector } from 'common/hooks/useSelector'
import { make, useRecord } from 'common/store/analytics/actions'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './DeleteAppConfirmationPage.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'

const { getUserId } = accountSelectors

const messages = {
  confirmation:
    'Are you sure you want to delete this app? \n\n You will permanently lose access to any accounts that have authorized this app in the past.',
  cancel: 'Cancel',
  deleteApp: 'Delete App',
  deletingApp: 'Deleting App'
}

type DeleteAppConfirmationPageProps = CreateAppPageProps

export const DeleteAppConfirmationPage = (
  props: DeleteAppConfirmationPageProps
) => {
  const { params, setPage } = props
  const [deleteDeveloperApp, result] = useDeleteDeveloperApp()
  const { status, errorMessage } = result
  const userId = useSelector(getUserId)
  const record = useRecord()
  const apiKey = params?.apiKey

  const handleCancel = useCallback(() => {
    setPage(CreateAppsPages.YOUR_APPS)
  }, [setPage])

  const handleDelete = useCallback(() => {
    if (!userId || !apiKey) return
    deleteDeveloperApp({ userId, apiKey })
  }, [userId, apiKey, deleteDeveloperApp])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setPage(CreateAppsPages.YOUR_APPS)
      record(
        make(Name.DEVELOPER_APP_DELETE_SUCCESS, {
          name: params?.name,
          apiKey: params?.apiKey
        })
      )
    }
  }, [status, setPage, record, params?.name, params?.apiKey])

  useEffect(() => {
    if (status === Status.ERROR) {
      setPage(CreateAppsPages.YOUR_APPS)
      record(
        make(Name.DEVELOPER_APP_DELETE_ERROR, {
          name: params?.name,
          apiKey: params?.apiKey,
          error: errorMessage
        })
      )
    }
  }, [status, setPage, record, params?.name, params?.apiKey, errorMessage])

  if (!params) return null

  const { name } = params

  const isDeleting = status !== Status.IDLE

  return (
    <div>
      <h4 className={styles.header}>{name}</h4>
      <p className={styles.confirmation}>{messages.confirmation}</p>
      <ModalFooter className={styles.deleteAppFooter}>
        <Button
          type={ButtonType.COMMON_ALT}
          text={messages.cancel}
          fullWidth
          onClick={handleCancel}
          disabled={isDeleting}
        />
        <Button
          type={ButtonType.DESTRUCTIVE}
          text={isDeleting ? messages.deletingApp : messages.deleteApp}
          fullWidth
          onClick={handleDelete}
          rightIcon={
            isDeleting ? (
              <LoadingSpinner className={styles.deletingSpinner} />
            ) : undefined
          }
          disabled={isDeleting}
        />
      </ModalFooter>
    </div>
  )
}
