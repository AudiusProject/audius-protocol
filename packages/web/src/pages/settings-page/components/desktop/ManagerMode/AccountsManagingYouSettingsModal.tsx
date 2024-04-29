import { useCallback, useEffect, useState } from 'react'

import {
  IconShieldUser,
  Modal,
  ModalContentPages,
  ModalHeader,
  ModalProps,
  ModalTitle
} from '@audius/harmony'

import { AccountsManagingYouHomePage } from './AccountsManagingYouHomePage'
import styles from './AccountsManagingYouSettingsModal.module.css'
import { ConfirmAccountManagerPage } from './ConfirmAccountManagerPage'
import { FindAccountManagerPage } from './FindAccountManagerPage'
import {
  AccountsManagingYouPages,
  AccountsManagingYouPagesParams
} from './types'

const messages = {
  accountsManagingYou: 'Accounts Managing You',
  findAccountManager: 'Find Account Manager',
  confirmNewManager: 'Confirm New Manager'
}

const PAGE_TO_TITLE = {
  [AccountsManagingYouPages.HOME]: messages.accountsManagingYou,
  [AccountsManagingYouPages.FIND_ACCOUNT_MANAGER]: messages.findAccountManager,
  [AccountsManagingYouPages.CONFIRM_NEW_MANAGER]: messages.confirmNewManager
}

type AccountsManagingYouSettingsModalProps = Omit<ModalProps, 'children'>

const getCurrentPage = (currentPage: AccountsManagingYouPages) => {
  switch (currentPage) {
    case AccountsManagingYouPages.HOME:
      return 0
    case AccountsManagingYouPages.FIND_ACCOUNT_MANAGER:
      return 1
    case AccountsManagingYouPages.CONFIRM_NEW_MANAGER:
      return 2
  }
}

export const AccountsManagingYouSettingsModal = (
  props: AccountsManagingYouSettingsModalProps
) => {
  const { isOpen } = props
  const [currentPage, setCurrentPage] = useState(AccountsManagingYouPages.HOME)

  const [currentPageParams, setCurrentPageParams] = useState<
    AccountsManagingYouPagesParams | undefined
  >()

  const handleSetPage = useCallback(
    (
      page: AccountsManagingYouPages,
      params?: AccountsManagingYouPagesParams
    ) => {
      setCurrentPage(page)
      if (params) {
        setCurrentPageParams(params)
      }
    },
    []
  )

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(AccountsManagingYouPages.HOME)
    }
  }, [isOpen])

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={PAGE_TO_TITLE[currentPage]}
            icon={<IconShieldUser />}
          />
        </ModalHeader>
        <ModalContentPages
          className={styles.noPaddingH}
          currentPage={getCurrentPage(currentPage)}
        >
          <AccountsManagingYouHomePage setPage={handleSetPage} />
          <FindAccountManagerPage setPage={handleSetPage} />
          <ConfirmAccountManagerPage
            setPage={handleSetPage}
            params={currentPageParams}
          />
        </ModalContentPages>
      </Modal>
    </>
  )
}
