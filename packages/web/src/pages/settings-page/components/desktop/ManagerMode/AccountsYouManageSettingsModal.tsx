import { useCallback, useEffect, useState } from 'react'

import {
  Box,
  Divider,
  Flex,
  IconUserArrowRotate,
  Modal,
  ModalContent,
  ModalContentPages,
  ModalHeader,
  ModalProps,
  ModalTitle,
  Text,
  TextLink
} from '@audius/harmony'

import { AccountsManagingYouHomePage } from './AccountsManagingYouHomePage'
import styles from './AccountsManagingYouSettingsModal.module.css'
import { ConfirmAccountManagerPage } from './ConfirmAccountManagerPage'
import { FindAccountManagerPage } from './FindAccountManagerPage'
import {
  AccountsManagingYouPages,
  AccountsManagingYouPagesParams
} from './types'
import { sharedMessages } from './sharedMessages'
import { useGetManagedAccounts } from '@audius/common/api'

const messages = {
  accountsYouManage: 'Accounts You Manage',
  takeControl:
    'Take control of your managed accounts by making changes to their profiles, preferences, and content.',
  noAccounts: 'You don’t manage any accounts.'
}

type AccountsManagingYouSettingsModalProps = Omit<ModalProps, 'children'>

export const AccountsYouManageSettingsModal = (
  props: AccountsManagingYouSettingsModalProps
) => {
  const { isOpen } = props
  const { data: managedAccounts } = useGetManagedAccounts({})
  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={messages.accountsYouManage}
            icon={<IconUserArrowRotate />}
          />
        </ModalHeader>
        <ModalContent>
          <Flex direction='column' gap='xl'>
            <Text variant='body' size='l'>
              {messages.takeControl}{' '}
              <TextLink href='#' variant='visible'>
                {sharedMessages.learnMore}
              </TextLink>
            </Text>
            {/* Empty state */}
            {/* <Divider />
            <Box>
              <Text variant='body' size='l'>
                {messages.noAccounts}
              </Text>
            </Box> */}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  )
}
