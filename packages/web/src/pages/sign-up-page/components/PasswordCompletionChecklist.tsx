import { passwordSchema } from '@audius/common'
import { CompletionCheck, Flex, Text } from '@audius/harmony'
import { useField } from 'formik'
import { useAsync } from 'react-use'

import { useMedia } from 'hooks/useMedia'
import {
  createPasswordPageMessages,
  CompletionChecklistType
} from '@audius/common/messages'

const messages: Record<CompletionChecklistType, string> =
  createPasswordPageMessages.completionChecklist

type ChecklistItem = { type: CompletionChecklistType; path: string }

const checklist: ChecklistItem[] = [
  { type: 'hasNumber', path: 'password' },
  { type: 'minLength', path: 'password' },
  { type: 'matches', path: 'confirmPassword' },
  { type: 'notCommon', path: 'password' }
]

export const PasswordCompletionChecklist = () => {
  const { isMobile } = useMedia()

  const [{ value: password }, passwordMeta] = useField('password')
  const [{ value: confirmPassword }, confirmMeta] = useField('confirmPassword')

  const { value: issues } = useAsync(async () => {
    const result = await passwordSchema.safeParseAsync({
      password,
      confirmPassword
    })
    if (result.success) {
      return null
    }

    return result.error.issues.map(
      (issue) => issue.message as CompletionChecklistType
    )
  }, [password, confirmPassword])

  return (
    <Flex gap={isMobile ? 's' : 'm'} direction='column'>
      {checklist.map((check) => {
        const { type, path } = check
        const error = issues?.includes(type)
        const isTouched =
          path === 'password' ? passwordMeta.touched : confirmMeta.touched

        const status =
          !password || (!isTouched && error)
            ? 'incomplete'
            : error
            ? 'error'
            : 'complete'

        return (
          <Flex key={type} alignItems='center' gap='m'>
            <CompletionCheck value={status} />
            <Text
              variant='body'
              strength='default'
              size={isMobile ? 's' : 'm'}
              color={status === 'error' ? 'danger' : 'default'}
            >
              {messages[type]}
            </Text>
          </Flex>
        )
      })}
    </Flex>
  )
}
