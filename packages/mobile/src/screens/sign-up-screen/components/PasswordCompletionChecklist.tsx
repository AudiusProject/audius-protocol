import {
  passwordSchema,
  createPasswordPageMessages,
  type CompletionChecklistType
} from '@audius/common'
import { useField } from 'formik'
import { useAsync } from 'react-use'

import { Flex } from '@audius/harmony-native'
import { StatusMessage } from 'app/components/status-message'

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
  const [{ value: password }, passwordMeta] = useField('password')
  const [{ value: confirmPassword }, confirmMeta] = useField('confirmPassword')

  const { value: issues } = useAsync(async () => {
    try {
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
    } catch (e) {
      return null
    }
  }, [password, confirmPassword])

  return (
    <Flex gap='s' direction='column'>
      {checklist.map((check) => {
        const { type, path } = check
        const error = issues?.includes(type)
        const isTouched =
          path === 'password' ? passwordMeta.touched : confirmMeta.touched

        // TODO: uncomment when we use harmony CompletionChecklist
        // const status =
        //   !password || (!isTouched && error)
        //     ? 'incomplete'
        //     : error
        //     ? 'error'
        //     : 'complete'

        // These statuses match the legacy sign up StatusMessage component
        const status =
          !password || (!isTouched && error)
            ? 'default'
            : error
            ? 'error'
            : 'valid'

        return (
          <Flex key={type} direction='row' alignItems='center' gap='m'>
            {/* TODO: Temporary until CompletionCheck harmony component exists */}
            <StatusMessage
              label={messages[type]}
              status={status}
              style={{ margin: 0 }}
            />
            {/* TODO: uncomment when removing StatusMessage */}
            {/* <Text
              variant='body'
              strength='default'
              size='s'
              color={status === 'error' ? 'danger' : 'default'}
            >
              {messages[type]}
            </Text> */}
          </Flex>
        )
      })}
    </Flex>
  )
}
