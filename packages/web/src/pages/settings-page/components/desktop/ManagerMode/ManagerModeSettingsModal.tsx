import { ChangeEvent, useCallback, useState } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { accountSelectors } from '@audius/common/store'
import { encodeHashId } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconEmbed,
  Modal,
  ModalContent,
  ModalHeader,
  ModalProps,
  ModalTitle,
  Radio,
  RadioGroup,
  RadioGroupProps,
  Text
} from '@audius/harmony'
import { Form, Formik, useField } from 'formik'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { TextField } from 'components/form-fields'

const messages = {
  title: 'Manager Mode',
  required: 'Value is required.',
  target: 'Target User Id',
  request: 'Request',
  accept: 'Accept',
  reject: 'Reject',
  revoke: 'Revoke'
}

type ManagerModeSettingsModalProps = Omit<ModalProps, 'children'>

type ManagerModeFormValues = {
  target: string
  grantType: 'request' | 'accept' | 'reject' | 'revoke'
}

// TODO: This is prototype code, please don't use it permanently
const useManagerModeState = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_ignored, setResult] = useState<string | null>(null)

  const { audiusSdk } = useAudiusQueryContext()
  const userIdRaw = useSelector(accountSelectors.getUserId)

  const handleSubmit = useCallback(
    async ({ target, grantType }: ManagerModeFormValues) => {
      setError(null)
      setIsLoading(true)
      try {
        if (!userIdRaw) throw new Error('User id not found')

        const currentUserId = encodeHashId(userIdRaw)
        const targetUserId = encodeHashId(parseInt(target))
        const sdk = await audiusSdk()
        let result: any
        switch (grantType) {
          case 'request':
            result = await sdk.grants.addManager({
              userId: currentUserId,
              managerUserId: targetUserId
            })
            break
          // TODO: 'grantor' in these operations is actually 'grantee' during indexing
          // so these are swapped for now. Will need to be switched back when the indexing
          // is working properly.
          // https://linear.app/audius/issue/PAY-2580/indexing-grant-approvals-seems-to-have-swapped-fields
          case 'accept':
            result = await sdk.grants.approveGrant({
              userId: currentUserId,
              grantorUserId: targetUserId
            })
            break
          case 'reject':
            result = await sdk.grants.removeManager({
              userId: targetUserId,
              managerUserId: currentUserId
            })
            break
          case 'revoke':
            result = await sdk.grants.removeManager({
              userId: currentUserId,
              managerUserId: targetUserId
            })
            break
        }
        console.debug(result)
        setResult(
          'Sucessfully submitted. Indexing of operation may take a moment.'
        )
      } catch (e) {
        console.error(e)
        setError(`${e}`)
        setResult(null)
      }
      setIsLoading(false)
    },
    [userIdRaw, audiusSdk]
  )

  return { isLoading, handleSubmit, error }
}

// TODO: Validate this as a user id
const managerModeSchema = toFormikValidationSchema(
  z.object({
    target: z.string({ required_error: messages.required })
  })
)

const GrantTypeField = (props: RadioGroupProps) => {
  const { name, ...other } = props
  const [field, _ignored, { setValue }] = useField(name)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setValue(value)
    },
    [setValue]
  )
  return <RadioGroup {...field} onChange={handleChange} {...other} />
}

export const ManagerModeSettingsModal = (
  props: ManagerModeSettingsModalProps
) => {
  const initialValues: ManagerModeFormValues = {
    target: '',
    grantType: 'request'
  }

  const { isLoading, handleSubmit, error } = useManagerModeState()

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle title={messages.title} icon={<IconEmbed />} />
        </ModalHeader>
        <ModalContent>
          <Flex gap='l' direction='column'>
            <Formik
              initialValues={initialValues}
              onSubmit={handleSubmit}
              validationSchema={managerModeSchema}
            >
              <Form>
                <Flex gap='l' direction='column'>
                  <GrantTypeField name='grantType' direction='column'>
                    <Flex gap='m' direction='column'>
                      <Flex gap='m'>
                        <Radio value='request' />
                        <Text color='default'>{messages.request}</Text>
                      </Flex>
                      <Flex gap='m'>
                        <Radio value='accept' />
                        <Text color='default'>{messages.accept}</Text>
                      </Flex>
                      <Flex gap='m'>
                        <Radio value='reject' />
                        <Text color='default'>{messages.reject}</Text>
                      </Flex>
                      <Flex gap='m'>
                        <Radio value='revoke' />
                        <Text color='default'>{messages.revoke}</Text>
                      </Flex>
                    </Flex>
                  </GrantTypeField>
                  <TextField name='target' label={messages.target} />
                  <Button type='submit' isLoading={isLoading}>
                    Submit
                  </Button>
                </Flex>
              </Form>
            </Formik>
            {error ? (
              <Text variant='body' color='danger'>
                {error}
              </Text>
            ) : null}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  )
}
