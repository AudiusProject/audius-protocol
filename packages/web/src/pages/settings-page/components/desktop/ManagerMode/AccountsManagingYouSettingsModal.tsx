import { useEffect, useState } from 'react'

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
import { RemoveManagerConfirmationPage } from './RemoveManagerConfirmationPage'
import { AccountsManagingYouPageState, AccountsManagingYouPages } from './types'

const messages = {
  accountsManagingYou: 'Accounts Managing You',
  findAccountManager: 'Find Account Manager',
  confirmNewManager: 'Confirm New Manager',
  removeManager: 'Remove Manager?'
}

const PAGE_TO_TITLE = {
  [AccountsManagingYouPages.HOME]: messages.accountsManagingYou,
  [AccountsManagingYouPages.FIND_ACCOUNT_MANAGER]: messages.findAccountManager,
  [AccountsManagingYouPages.CONFIRM_NEW_MANAGER]: messages.confirmNewManager,
  [AccountsManagingYouPages.CONFIRM_REMOVE_MANAGER]: messages.removeManager
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
    case AccountsManagingYouPages.CONFIRM_REMOVE_MANAGER:
      return 3
  }
}

export const AccountsManagingYouSettingsModal = (
  props: AccountsManagingYouSettingsModalProps
) => {
  const { isOpen } = props
  const [{ page, params, transitionDirection }, setPageState] =
    useState<AccountsManagingYouPageState>({
      page: AccountsManagingYouPages.HOME
    })

  useEffect(() => {
    if (!isOpen) {
      setPageState({ page: AccountsManagingYouPages.HOME })
    }
  }, [isOpen])

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={PAGE_TO_TITLE[page]}
            icon={
              page ===
              AccountsManagingYouPages.CONFIRM_REMOVE_MANAGER ? null : (
                <IconShieldUser />
              )
            }
          />
        </ModalHeader>
        <ModalContentPages
          className={styles.noPaddingH}
          currentPage={getCurrentPage(page)}
          transitionDirection={transitionDirection}
        >
          <AccountsManagingYouHomePage setPageState={setPageState} />
          <FindAccountManagerPage setPageState={setPageState} params={params} />
          <ConfirmAccountManagerPage
            setPageState={setPageState}
            params={params}
          />
          <RemoveManagerConfirmationPage
            setPageState={setPageState}
            params={params}
          />
        </ModalContentPages>
      </Modal>
    </>
  )
}
