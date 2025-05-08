import { useCallback, useEffect } from 'react'

import { useDeleteDeveloperApp } from '@audius/common/api'
import { Name } from '@audius/common/models'
import { Button, ModalFooter } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'

import styles from './DeleteAppConfirmationPage.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'

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
  const { isSuccess, isError, error, mutate, isPending } =
    useDeleteDeveloperApp()
  const record = useRecord()
  const apiKey = params?.apiKey
  const name = params?.name

  const handleCancel = useCallback(() => {
    setPage(CreateAppsPages.YOUR_APPS)
  }, [setPage])

  const handleDelete = useCallback(() => {
    if (!apiKey) return
    mutate(apiKey)
  }, [apiKey, mutate])

  useEffect(() => {
    if (isSuccess) {
      setPage(CreateAppsPages.YOUR_APPS)
      record(
        make(Name.DEVELOPER_APP_DELETE_SUCCESS, {
          name,
          apiKey
        })
      )
    }
  }, [isSuccess, setPage, record, name, apiKey])

  useEffect(() => {
    if (isError) {
      setPage(CreateAppsPages.YOUR_APPS)
      record(
        make(Name.DEVELOPER_APP_DELETE_ERROR, {
          name: params?.name,
          apiKey: params?.apiKey,
          error: error?.message
        })
      )
    }
  }, [isError, setPage, record, params?.name, params?.apiKey, error?.message])

  return (
    <div>
      <h4 className={styles.header}>{name}</h4>
      <p className={styles.confirmation}>{messages.confirmation}</p>
      <ModalFooter css={{ paddingBottom: `0 !important` }}>
        <Button
          variant='secondary'
          onClick={handleCancel}
          disabled={isPending}
          fullWidth
        >
          {messages.cancel}
        </Button>
        <Button
          variant='destructive'
          fullWidth
          onClick={handleDelete}
          isLoading={isPending}
        >
          {isPending ? messages.deletingApp : messages.deleteApp}
        </Button>
      </ModalFooter>
    </div>
  )
}
