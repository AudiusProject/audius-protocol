import {
  passwordSchema,
  createPasswordPageMessages,
  type CompletionChecklistType
} from '@audius/common'
import { useField } from 'formik'
import { useAsync } from 'react-use'

import { Flex, Text } from '@audius/harmony-native'

const messages: Record<CompletionChecklistType, string> =
  createPasswordPageMessages.completionChecklist

// const passwordSchema = schemaBuilder()
console.log({ passwordSchema })

type ChecklistItem = { type: CompletionChecklistType; path: string }

const checklist: ChecklistItem[] = [
  { type: 'hasNumber', path: 'password' },
  { type: 'minLength', path: 'password' },
  { type: 'matches', path: 'confirmPassword' },
  { type: 'notCommon', path: 'password' }
]

export const CompletionChecklist = () => {
  const [{ value: password }, passwordMeta] = useField('password')
  const [{ value: confirmPassword }, confirmMeta] = useField('confirmPassword')

  //   console.log({ password, confirmPassword })
  console.log({ passwordSchema })

  const { value: issues } = useAsync(async () => {
    // console.log('getting result')
    try {
      console.log({ passwordSchema })
      const result = await passwordSchema.safeParseAsync({
        password,
        confirmPassword
      })
      console.log({ result })
      if (result.success) {
        return null
      }
      return []
    } catch (e) {
      console.log('dont worry I cuaght the error')
    }

    return null
    // return result.error.issues.map(
    //   (issue) => issue.message as CompletionChecklistType
    // )
  }, [password, confirmPassword])

  return (
    <Flex gap='s' direction='column'>
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
          <Flex key={type} direction='row' alignItems='center' gap='m'>
            <Text>
              {status === 'complete' && '✅'}
              {status === 'error' && '😡'}
              {status === 'incomplete' && '🔘'}
            </Text>
            <Text
              variant='body'
              strength='default'
              size='s'
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
