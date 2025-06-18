import { useCallback, useEffect, useState } from 'react'

import { useCurrentUserId, useRequestAddManager } from '@audius/common/api'
import {
  Box,
  Button,
  Flex,
  Hint,
  IconCaretLeft,
  IconError,
  Text
} from '@audius/harmony'

import ArtistChip from 'components/artist/ArtistChip'

import { sharedMessages } from './sharedMessages'
import {
  AccountsManagingYouPages,
  ConfirmAccountManagerPageProps
} from './types'

const messages = {
  description:
    'Are you sure you want to authorize the following user to manage your Audius account?',
  confirm: 'Confirm',
  back: 'Back',
  errorNoUserId: 'Something went wrong - please refresh and try again.',
  errorGeneral: 'Something went wrong.'
}

export const ConfirmAccountManagerPage = (
  props: ConfirmAccountManagerPageProps
) => {
  const { setPageState, params } = props
  const { data: userId } = useCurrentUserId()
  const [submitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    mutate: requestAddManager,
    isSuccess,
    isError
  } = useRequestAddManager()

  const manager = params?.user
  useEffect(() => {
    if (isSuccess) {
      setPageState({
        page: AccountsManagingYouPages.HOME,
        transitionDirection: 'forward'
      })
    }
  }, [isSuccess, setPageState])

  useEffect(() => {
    if (isError) {
      setError(messages.errorGeneral)
      setIsSubmitting(false)
    }
  }, [isError])

  const handleConfirm = useCallback(() => {
    setIsSubmitting(true)
    setError(null)
    if (!userId) {
      setError(messages.errorNoUserId)
      setIsSubmitting(false)
      return
    }
    requestAddManager({ userId, managerUser: manager! })
  }, [manager, userId, requestAddManager])

  if (!manager) {
    return null
  }

  return (
    <Box ph='xl'>
      <Flex direction='column' gap='xl'>
        <Text variant='body' size='l'>
          {messages.description}
        </Text>
        <Box pv='l' ph='xl'>
          <ArtistChip userId={manager.user_id} />
        </Box>
        <Hint icon={IconError}>
          {sharedMessages.accountManagersExplanation}
        </Hint>
        <Flex gap='s'>
          <Button
            fullWidth
            variant='secondary'
            iconLeft={IconCaretLeft}
            disabled={submitting}
            onClick={() =>
              setPageState({
                page: AccountsManagingYouPages.FIND_ACCOUNT_MANAGER,
                params: {
                  query: params?.query
                }
              })
            }
          >
            {messages.back}
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={submitting}
            fullWidth
            variant='secondary'
          >
            {messages.confirm}
          </Button>
        </Flex>
        {error == null ? null : (
          <Text textAlign='center' color='danger' variant='body'>
            {error}
          </Text>
        )}
      </Flex>
    </Box>
  )
}
