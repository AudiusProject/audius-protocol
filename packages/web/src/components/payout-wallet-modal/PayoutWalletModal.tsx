import { useCallback } from 'react'

import { SolanaWalletAddress } from '@audius/common/models'
import { accountSelectors, profilePageActions } from '@audius/common/store'
import {
  Button,
  Divider,
  Flex,
  IconLogoCircle,
  IconMoneyBracket,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Radio,
  RadioGroup,
  Text
} from '@audius/harmony'
import { Formik, useField } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useModalState } from 'common/hooks/useModalState'
import { TextField } from 'components/form-fields'
import { ModalForm } from 'components/modal-form/ModalForm'
import { isValidSolAddress } from 'services/solana/solana'

const { getAccountUser } = accountSelectors

const messages = {
  title: 'Payout Wallet',
  body: 'Automatically send USDC earned on Audius to an external Solana wallet.',
  destination: 'Select Destination',
  builtIn: 'Built-In Wallet',
  optionBuiltIn: 'Audius USDC Wallet (Default)',
  optionCustom: 'Custom Wallet Address',
  addressPlaceholder: 'Solana Wallet Address',
  invalidAddress: 'A valid Solana USDC wallet address is required.',
  back: 'Back',
  save: 'Save'
}

const payoutWalletSchema = z
  .object({
    option: z.enum(['default', 'custom']),
    address: z.string().optional()
  })
  .refine(
    async (data) => {
      if (data.option === 'default') {
        return true
      }
      return isValidSolAddress(data.address as SolanaWalletAddress)
    },
    { message: messages.invalidAddress, path: ['address'] }
  )

type PayoutWalletValues = z.input<typeof payoutWalletSchema>

const PayoutWalletSchema = toFormikValidationSchema(payoutWalletSchema)

const PayoutWalletModalForm = ({
  handleClose
}: {
  handleClose: () => void
}) => {
  const [optionField] = useField('option')
  const [addressField, { error }] = useField('address')

  return (
    <ModalForm>
      <ModalContent>
        <Flex direction='column' gap='l'>
          <Text variant='body' size='m'>
            {messages.body}
          </Text>
          <Text variant='label' size='l' color='subdued'>
            {messages.destination}
          </Text>
          <RadioGroup {...optionField}>
            <Flex gap='l' direction='column'>
              <Flex gap='m' alignItems='center'>
                <Radio value='default' />
                <Text variant='body' color='default' size='m'>
                  {messages.optionBuiltIn}
                </Text>
              </Flex>
              {optionField.value === 'default' ? (
                <Flex
                  backgroundColor='surface2'
                  gap='s'
                  border='strong'
                  borderRadius='xs'
                  p='s'
                  wrap='wrap'
                  justifyContent='center'
                  alignSelf='flex-start'
                >
                  <IconLogoCircle size='m' />
                  <Text variant='body' size='m' strength='strong'>
                    {messages.builtIn}
                  </Text>
                </Flex>
              ) : null}
              <Divider color='default' />
              <Flex gap='m' alignItems='center'>
                <Radio value='custom' />
                <Text variant='body' color='default' size='m'>
                  {messages.optionCustom}
                </Text>
              </Flex>
              {optionField.value === 'custom' ? (
                <TextField
                  {...addressField}
                  label={messages.addressPlaceholder}
                />
              ) : null}
            </Flex>
          </RadioGroup>
        </Flex>
      </ModalContent>
      <ModalFooter>
        <Button
          onClick={handleClose}
          variant='secondary'
          isLoading={false}
          fullWidth
        >
          {messages.back}
        </Button>
        <Button type='submit' isLoading={false} fullWidth disabled={!!error}>
          {messages.save}
        </Button>
      </ModalFooter>
    </ModalForm>
  )
}

export const PayoutWalletModal = () => {
  const [isOpen, setIsOpen] = useModalState('PayoutWallet')
  const user = useSelector(getAccountUser)
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleSubmit = useCallback(
    ({ option, address }: PayoutWalletValues) => {
      // TODO: Token account validation
      if (user) {
        const updatedUser = { ...user }
        if (option === 'default') {
          updatedUser.spl_usdc_payout_wallet = null
        } else {
          updatedUser.spl_usdc_payout_wallet = address as SolanaWalletAddress
        }
        dispatch(profilePageActions.updateProfile(updatedUser))
      }
      setIsOpen(false)
    },
    [dispatch, user, setIsOpen]
  )

  const initialValues: PayoutWalletValues = user?.spl_usdc_payout_wallet
    ? {
        option: 'custom',
        address: user.spl_usdc_payout_wallet as string
      }
    : { option: 'default' }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size='small'>
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.title} icon={<IconMoneyBracket />} />
      </ModalHeader>
      <Formik
        initialValues={initialValues}
        validationSchema={PayoutWalletSchema}
        onSubmit={handleSubmit}
      >
        <PayoutWalletModalForm handleClose={handleClose} />
      </Formik>
    </Modal>
  )
}
