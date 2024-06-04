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
import {
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  unpackAccount
} from '@solana/spl-token'
import { ComputeBudgetProgram, PublicKey, SystemProgram } from '@solana/web3.js'
import { Formik, useField } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useModalState } from 'common/hooks/useModalState'
import { TextField } from 'components/form-fields'
import { ModalForm } from 'components/modal-form/ModalForm'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'
import {
  getAssociatedTokenAccountOwner,
  isValidSolAddress
} from 'services/solana/solana'
import { reportToSentry } from 'store/errors/reportToSentry'

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
    async (
      { option, address }: PayoutWalletValues,
      { setErrors }: { setErrors: any }
    ) => {
      const sdk = await audiusSdk()
      try {
        if (!address || !user) {
          throw new Error('No user or address')
        }

        const usdcMint = new PublicKey(env.USDC_MINT_ADDRESS)
        const addressPubkey = new PublicKey(address)
        const info =
          await sdk.services.claimableTokensClient.connection.getAccountInfo(
            addressPubkey
          )

        let usdcAta: string | null = null

        const isRootWallet =
          (!info || info?.owner.equals(SystemProgram.programId)) &&
          PublicKey.isOnCurve(addressPubkey)

        if (!isRootWallet) {
          // If not a root wallet, maybe it's a USDC account
          try {
            const unpacked = unpackAccount(
              addressPubkey,
              info,
              TOKEN_PROGRAM_ID
            )
            if (unpacked.mint.equals(usdcMint)) {
              usdcAta = address
            }
          } catch (e) {
            console.debug(e)
            // fall through
          }
        } else {
          // It's a root wallet - check for USDC mint ATA
          const ataPubkey = getAssociatedTokenAddressSync(
            usdcMint,
            addressPubkey
          )
          try {
            const account = await getAccount(
              sdk.services.claimableTokensClient.connection,
              ataPubkey
            )
            if (account.mint.equals(usdcMint)) {
              usdcAta = ataPubkey.toBase58()
            }
          } catch (e) {
            // No USDC mint ATA. Make one if possible.
            if (e instanceof TokenAccountNotFoundError) {
              const payer = await sdk.services.solanaRelay.getFeePayer()
              const transaction =
                await sdk.services.claimableTokensClient.buildTransaction({
                  instructions: [
                    createAssociatedTokenAccountIdempotentInstruction(
                      payer,
                      ataPubkey,
                      addressPubkey,
                      usdcMint
                    ),
                    ComputeBudgetProgram.setComputeUnitPrice({
                      microLamports: 100000
                    })
                  ]
                })

              await sdk.services.solanaRelay.relay({
                transaction
              })
              usdcAta = ataPubkey.toBase58()
            }
          }
        }

        if (!usdcAta) {
          throw new Error('Cannot create USDC token account')
        }

        const updatedUser = { ...user }
        if (option === 'default') {
          updatedUser.spl_usdc_payout_wallet = null
        } else {
          updatedUser.spl_usdc_payout_wallet = usdcAta as SolanaWalletAddress
        }
        dispatch(profilePageActions.updateProfile(updatedUser))

        setIsOpen(false)
      } catch (e) {
        setErrors({ address: 'Please try again later' })
        await reportToSentry({
          error: e as Error,
          name: 'Payout Wallet: Error setting wallet'
        })
      }
    },
    [dispatch, user, setIsOpen]
  )

  const { value: payoutWallet } = useAsync(async () => {
    if (user?.spl_usdc_payout_wallet) {
      const owner = await getAssociatedTokenAccountOwner(
        user.spl_usdc_payout_wallet
      )
      return owner.toString()
    }
    return null
  }, [user])

  const initialValues: PayoutWalletValues = user?.spl_usdc_payout_wallet
    ? {
        option: 'custom',
        address: payoutWallet ?? ''
      }
    : { option: 'default' }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size='small'>
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.title} icon={<IconMoneyBracket />} />
      </ModalHeader>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={PayoutWalletSchema}
        onSubmit={handleSubmit}
      >
        <PayoutWalletModalForm handleClose={handleClose} />
      </Formik>
    </Modal>
  )
}
