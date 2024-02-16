import { useCallback, useEffect, useState } from 'react'

import { DeveloperApp } from '@audius/common/api'
import {
  Modal,
  ModalContentPages,
  ModalHeader,
  ModalTitle,
  ModalProps,
  IconEmbed,
  IconTrash
} from '@audius/harmony'

import { AppDetailsPage } from './AppDetailsPage'
import { CreateNewAppPage } from './CreateNewAppPage'
import { DeleteAppConfirmationPage } from './DeleteAppConfirmationPage'
import styles from './DeveloperAppsSettingsModal.module.css'
import { YourAppsPage } from './YourAppsPage'
import { CreateAppsPages } from './types'

const messages = {
  title: 'Create Apps',
  deleteApp: 'Delete App'
}

type DeveloperAppsSettingsModalProps = Omit<ModalProps, 'children'>

const getCurrentPage = (currentPage: CreateAppsPages) => {
  switch (currentPage) {
    case CreateAppsPages.YOUR_APPS:
      return 0
    case CreateAppsPages.NEW_APP:
      return 1
    case CreateAppsPages.APP_DETAILS:
      return 2
    case CreateAppsPages.DELETE_APP:
      return 3
  }
}

const getTitle = (currentPage: CreateAppsPages) => {
  switch (currentPage) {
    case CreateAppsPages.DELETE_APP:
      return messages.deleteApp
    default:
      return messages.title
  }
}

const getTitleIcon = (currentPage: CreateAppsPages) => {
  switch (currentPage) {
    case CreateAppsPages.DELETE_APP:
      return <IconTrash className={styles.titleIcon} />
    default:
      return <IconEmbed className={styles.titleIcon} />
  }
}

export const DeveloperAppsSettingsModal = (
  props: DeveloperAppsSettingsModalProps
) => {
  const { isOpen } = props
  const [currentPage, setCurrentPage] = useState(CreateAppsPages.APP_DETAILS)

  const [currentPageParams, setCurrentPageParams] = useState<DeveloperApp>()

  const handleSetPage = useCallback(
    (page: CreateAppsPages, params?: DeveloperApp) => {
      setCurrentPage(page)
      if (params) {
        setCurrentPageParams(params)
      }
    },
    []
  )

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(CreateAppsPages.YOUR_APPS)
    }
  }, [isOpen])

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={getTitle(currentPage)}
            icon={getTitleIcon(currentPage)}
          />
        </ModalHeader>
        <ModalContentPages currentPage={getCurrentPage(currentPage)}>
          <YourAppsPage setPage={handleSetPage} />
          <CreateNewAppPage setPage={handleSetPage} />
          <AppDetailsPage setPage={handleSetPage} params={currentPageParams} />
          <DeleteAppConfirmationPage
            setPage={handleSetPage}
            params={currentPageParams}
          />
        </ModalContentPages>
      </Modal>
    </>
  )
}
