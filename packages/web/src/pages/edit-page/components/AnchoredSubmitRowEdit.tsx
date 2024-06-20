import { useContext, useEffect, useState } from 'react'

import { Button, Flex, IconError, Text } from '@audius/harmony'
import { useFormikContext } from 'formik'

import { useHistoryContext } from 'app/HistoryProvider'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { FEED_PAGE } from 'utils/route'

import { EditFormScrollContext } from '../EditTrackPage'

import styles from './AnchoredSubmitRowEdit.module.css'

const messages = {
  save: 'Save Changes',
  cancel: 'Cancel',
  fixErrors: 'Fix errors to continue your update.'
}

export const AnchoredSubmitRowEdit = () => {
  const scrollToTop = useContext(EditFormScrollContext)
  const { isValid } = useFormikContext()
  const [showError, setShowError] = useState(false)

  // Whenever the error stops showing, reset our error state until they break the form again AND try to submit again
  useEffect(() => {
    if (isValid) {
      setShowError(false)
    }
  }, [isValid])

  const { history } = useHistoryContext()
  const navigate = useNavigateToPage()

  return (
    <>
      <Flex className={styles.buttonRow} gap='m'>
        <Flex gap='l'>
          <Button
            variant='secondary'
            size='default'
            onClick={() =>
              history.length > 0 ? history.goBack() : navigate(FEED_PAGE)
            }
          >
            {messages.cancel}
          </Button>
          <Button
            variant='primary'
            size='default'
            onClick={() => {
              scrollToTop()
              setShowError(true)
            }}
            type='submit'
          >
            {messages.save}
          </Button>
        </Flex>
        {showError && !isValid ? (
          <Flex alignItems='center' gap='xs'>
            <IconError color='danger' size='s' />
            <Text color='danger' size='s' variant='body'>
              {messages.fixErrors}
            </Text>
          </Flex>
        ) : null}
      </Flex>
      <div className={styles.placeholder} />
    </>
  )
}
