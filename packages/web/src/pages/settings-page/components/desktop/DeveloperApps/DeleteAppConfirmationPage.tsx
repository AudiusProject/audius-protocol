import { useCallback, useEffect } from 'react'

import { useDeleteDeveloperApp } from '@audius/common/api'
import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Button, ModalFooter } from '@audius/harmony'

import { useSelector } from 'common/hooks/useSelector'
import { make, useRecord } from 'common/store/analytics/actions'

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
  const deleteDeveloperApp = useDeleteDeveloperApp()
  const userId = useSelector(getUserId)
  const record = useRecord()
  const apiKey = params?.apiKey

  const handleCancel = useCallback(() => {
    setPage(CreateAppsPages.YOUR_APPS)
  }, [setPage])

  const handleDelete = useCallback(() => {
    if (!userId || !apiKey) return
    deleteDeveloperApp.mutate({ userId, apiKey })
  }, [userId, apiKey, deleteDeveloperApp])

  useEffect(() => {
    if (deleteDeveloperApp.isSuccess) {
      setPage(CreateAppsPages.YOUR_APPS)
      record(
        make(Name.DEVELOPER_APP_DELETE_SUCCESS, {
          name: params?.name,
          apiKey: params?.apiKey
        })
      )
    }
  }, [
    deleteDeveloperApp.isSuccess,
    setPage,
    record,
    params?.name,
    params?.apiKey
  ])

  useEffect(() => {
    if (deleteDeveloperApp.isError) {
      setPage(CreateAppsPages.YOUR_APPS)
      record(
        make(Name.DEVELOPER_APP_DELETE_ERROR, {
          name: params?.name,
          apiKey: params?.apiKey,
          error: deleteDeveloperApp.error?.message
        })
      )
    }
  }, [
    deleteDeveloperApp.isError,
    setPage,
    record,
    params?.name,
    params?.apiKey,
    deleteDeveloperApp.error?.message
  ])

  if (!params) return null

  const { name } = params

  const isDeleting = deleteDeveloperApp.isPending

  return (
    <div>
      <h4 className={styles.header}>{name}</h4>
      <p className={styles.confirmation}>{messages.confirmation}</p>
      <ModalFooter css={{ paddingBottom: `0 !important` }}>
        <Button
          variant='secondary'
          onClick={handleCancel}
          disabled={isDeleting}
          fullWidth
        >
          {messages.cancel}
        </Button>
        <Button
          variant='destructive'
          fullWidth
          onClick={handleDelete}
          isLoading={isDeleting}
        >
          {isDeleting ? messages.deletingApp : messages.deleteApp}
        </Button>
      </ModalFooter>
    </div>
  )
}
