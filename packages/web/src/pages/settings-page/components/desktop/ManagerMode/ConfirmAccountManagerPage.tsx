import { useCallback, useState } from 'react'

import { accountSelectors } from '@audius/common/store'
import { encodeHashId } from '@audius/common/utils'
import {
  Button,
  Flex,
  Hint,
  IconCaretLeft,
  IconError,
  Text,
  TextLink,
  Box
} from '@audius/harmony'

import ArtistChip from 'components/artist/ArtistChip'
import { audiusSdk } from 'services/audius-sdk'
import { reportToSentry } from 'store/errors/reportToSentry'
import { useSelector } from 'utils/reducer'

import { sharedMessages } from './sharedMessages'
import {
  AccountsManagingYouPages,
  ConfirmAccountManagerPageProps
} from './types'

const { getUserId } = accountSelectors

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
  const { setPage, params } = props
  const userId = useSelector(getUserId)
  const [submitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const manager = params?.user
  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true)
    const sdk = await audiusSdk()
    if (!userId) {
      setError(messages.errorNoUserId)
      setIsSubmitting(false)
      return
    }
    try {
      // TODO(nkang - C-4315) - Turn into audius-query mutation
      await sdk.grants.addManager({
        userId: encodeHashId(userId),
        managerUserId: encodeHashId(manager!.user_id)
      })
    } catch (e) {
      setError(messages.errorGeneral)
      reportToSentry({ error: e instanceof Error ? e : new Error(String(e)) })
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
    setPage(AccountsManagingYouPages.HOME)
  }, [manager, userId, setPage])

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
          <ArtistChip user={manager} />
        </Box>
        <Hint
          icon={IconError}
          actions={
            <TextLink variant='visible' href='#' showUnderline>
              {sharedMessages.learnMore}
            </TextLink>
          }
        >
          {sharedMessages.accountManagersExplanation}
        </Hint>
        <Flex gap='s'>
          <Button
            fullWidth
            variant='secondary'
            iconLeft={IconCaretLeft}
            onClick={() =>
              setPage(AccountsManagingYouPages.FIND_ACCOUNT_MANAGER, {
                query: params?.query
              })
            }
          >
            {messages.back}
          </Button>
          <Button
            onSubmit={handleConfirm}
            disabled={submitting}
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
