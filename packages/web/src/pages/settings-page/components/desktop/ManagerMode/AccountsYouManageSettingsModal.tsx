import { useCallback, useEffect, useState } from 'react'

import {
  IconUserArrowRotate,
  Modal,
  ModalContentPages,
  ModalHeader,
  ModalProps,
  ModalTitle
} from '@audius/harmony'

import { AccountsYouManageHomePage } from './AccountsYouManageHomePage'
import { StopManagingConfirmationPage } from './StopManagingConfirmationPage'
import { AccountsYouManagePages, AccountsYouManagePagesParams } from './types'

const messages = {
  accountsYouManage: 'Accounts You Manage',
  stopManaging: 'Stop Managing?'
}

const PAGE_TO_TITLE = {
  [AccountsYouManagePages.HOME]: messages.accountsYouManage,
  [AccountsYouManagePages.STOP_MANAGING]: messages.stopManaging
}

type AccountsYouManageSettingsModalProps = Omit<ModalProps, 'children'>

const getCurrentPage = (currentPage: AccountsYouManagePages) => {
  switch (currentPage) {
    case AccountsYouManagePages.HOME:
      return 0
    case AccountsYouManagePages.STOP_MANAGING:
      return 1
  }
}

export const AccountsYouManageSettingsModal = (
  props: AccountsYouManageSettingsModalProps
) => {
  const { isOpen } = props
  const [currentPage, setCurrentPage] = useState(AccountsYouManagePages.HOME)

  const [currentPageParams, setCurrentPageParams] = useState<
    AccountsYouManagePagesParams | undefined
  >()

  const handleSetPage = useCallback(
    (page: AccountsYouManagePages, params?: AccountsYouManagePagesParams) => {
      setCurrentPage(page)
      if (params) {
        setCurrentPageParams(params)
      }
    },
    []
  )

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(AccountsYouManagePages.HOME)
      setCurrentPageParams(undefined)
    }
  }, [isOpen])

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={PAGE_TO_TITLE[currentPage]}
            icon={<IconUserArrowRotate />}
          />
        </ModalHeader>
        <ModalContentPages currentPage={getCurrentPage(currentPage)}>
          <AccountsYouManageHomePage setPage={handleSetPage} />

          <StopManagingConfirmationPage
            setPage={handleSetPage}
            params={currentPageParams}
          />
        </ModalContentPages>
      </Modal>
    </>
  )
}
