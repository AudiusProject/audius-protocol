import { useContext, useEffect, useState } from 'react'

import { Button, Flex, IconCloudUpload, IconError, Text } from '@audius/harmony'
import { useFormikContext } from 'formik'

import { UploadFormScrollContext } from '../UploadPage'

import styles from './AnchoredSubmitRow.module.css'

const messages = {
  complete: 'Complete Uploadfdsa',
  fixErrors: 'Fix errors to continue your upload.'
}

export const AnchoredSubmitRow = () => {
  const scrollToTop = useContext(UploadFormScrollContext)
  const { isValid } = useFormikContext()
  const [showError, setShowError] = useState(false)

  // Whenever the error stops showing, reset our error state until they break the form again AND try to submit again
  useEffect(() => {
    if (isValid) {
      setShowError(false)
    }
  }, [isValid])

  return (
    <>
      <Flex className={styles.buttonRow} gap='m'>
        <Button
          variant='primary'
          size='default'
          iconRight={IconCloudUpload}
          onClick={() => {
            scrollToTop()
            setShowError(true)
          }}
          type='submit'
        >
          {messages.complete}
        </Button>
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
