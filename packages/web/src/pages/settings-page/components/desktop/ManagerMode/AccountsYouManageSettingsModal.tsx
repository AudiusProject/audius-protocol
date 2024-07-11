import { useEffect, useState } from 'react'

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
import { AccountsYouManagePageState, AccountsYouManagePages } from './types'

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
  const [{ page, params, transitionDirection }, setPageState] =
    useState<AccountsYouManagePageState>({
      page: AccountsYouManagePages.HOME
    })

  useEffect(() => {
    if (!isOpen) {
      setPageState({ page: AccountsYouManagePages.HOME })
    }
  }, [isOpen])

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={PAGE_TO_TITLE[page]}
            icon={<IconUserArrowRotate />}
          />
        </ModalHeader>
        <ModalContentPages
          transitionDirection={transitionDirection}
          currentPage={getCurrentPage(page)}
        >
          <AccountsYouManageHomePage setPageState={setPageState} />

          <StopManagingConfirmationPage
            setPageState={setPageState}
            params={params}
          />
        </ModalContentPages>
      </Modal>
    </>
  )
}
