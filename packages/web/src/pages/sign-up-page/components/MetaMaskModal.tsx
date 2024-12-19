import React, { useCallback, useState } from 'react'

import { Button, Flex, Box, Text } from '@audius/harmony'
import cn from 'classnames'

import styles from './MetaMaskModal.module.css'

const messages = {
  title: '    Are You Sure You Want To Continue With MetaMask?   ',
  subHeader: '(not recommended)',
  body1:
    'Creating an Audius account with MetaMask will negatively impact your Audius experience in a significant way. We strongly suggest creating your account with an email and password.',
  body2:
    'To continue with MetaMask, please follow our advanced configuration guide.',
  metaMaskGuide: 'Read MetaMask Configuration Guide',
  continueOption: 'Yes, I Understand',
  stopOption: 'No, Take Me Back',
  metaMaskConfigure: 'Configure MetaMask to continue',
  configureError:
    'Your MetaMask is not properly configured. Make sure to set your network in MetaMask to the Audius network, and have at least one account in MetaMask. For more info, see the MetaMask Configuration Guide.',
  accessError:
    'You must grant Audius access to one of your MetaMask accounts in order to continue.'
}

type MetaMaskModalProps = {
  open: boolean
  configured?: boolean
  onClickReadConfig: () => void
  onClickBack: () => void
  onClickContinue: () => void
}

export const MetaMaskModal = ({
  open,
  onClickReadConfig,
  onClickBack,
  onClickContinue
}: MetaMaskModalProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [accessError, setAccessError] = useState(false)
  const [configureError, setConfigureError] = useState(false)

  const resetState = () => {
    setSubmitting(false)
    setAccessError(false)
    setConfigureError(false)
  }

  const handleClickContinue = useCallback(async () => {
    resetState()
    setSubmitting(true)
    onClickContinue()
    try {
      await window.ethereum?.enable()
    } catch (err) {
      setAccessError(true)
      return
    }
    // TODO: Fix MM auth
    // https://github.com/AudiusProject/audius-protocol/pull/10392
    setConfigureError(true)
  }, [onClickContinue])

  const onModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  const onContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClickBack()
  }

  return (
    <div
      className={cn(styles.container, { [styles.hidden]: !open })}
      onClick={onContainerClick}
    >
      <div className={styles.modal} onClick={onModalClick}>
        <div className={styles.header}>
          <div className={styles.title}>
            <i className='emoji large police-cars-revolving-light' />
            {messages.title}
            <i className='emoji large police-cars-revolving-light' />
          </div>
          <div className={styles.sub}>{messages.subHeader}</div>
        </div>
        <div className={styles.bodyContainer}>
          <div className={styles.bodyText}>{messages.body1}</div>
          <div className={styles.bodyText}>{messages.body2}</div>
        </div>
        <div className={styles.guideContainer}>
          <Button variant='primary' onClick={onClickReadConfig}>
            {messages.metaMaskGuide}
          </Button>
        </div>
        <Flex mt='2xl' w='100%' gap='l'>
          <Button
            variant='secondary'
            isLoading={submitting}
            onClick={handleClickContinue}
            fullWidth
          >
            {messages.continueOption}
          </Button>
          <Button
            variant='primary'
            fullWidth
            onClick={() => {
              resetState()
              onClickBack()
            }}
          >
            {messages.stopOption}
          </Button>
        </Flex>
        {accessError || configureError ? (
          <Box mt='l'>
            <Text variant='body' color='danger'>
              {accessError ? messages.accessError : messages.configureError}
            </Text>
          </Box>
        ) : null}
      </div>
    </div>
  )
}
