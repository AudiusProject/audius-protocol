import { useContext } from 'react'

import { route } from '@audius/common/utils'
import { Button, Flex, IconError, Text } from '@audius/harmony'
import { useFormikContext } from 'formik'
import { useNavigate } from 'react-router-dom'

import { EditFormScrollContext } from '../../pages/edit-page/EditTrackPage'

import styles from './AnchoredSubmitRowEdit.module.css'
const { FEED_PAGE } = route

const messages = {
  save: 'Save Changes',
  cancel: 'Cancel',
  fixErrors: 'Fix errors to continue your update.'
}

export const AnchoredSubmitRowEdit = () => {
  const scrollToTop = useContext(EditFormScrollContext)
  const { isValid } = useFormikContext()

  const navigate = useNavigate()

  return (
    <>
      <Flex className={styles.buttonRow} gap='m'>
        <Flex gap='l'>
          <Button
            variant='secondary'
            size='default'
            onClick={() =>
              window.history.length > 0 ? navigate(-1) : navigate(FEED_PAGE)
            }
          >
            {messages.cancel}
          </Button>
          <Button
            variant='primary'
            size='default'
            onClick={() => {
              scrollToTop()
            }}
            type='submit'
          >
            {messages.save}
          </Button>
        </Flex>
        {!isValid ? (
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
