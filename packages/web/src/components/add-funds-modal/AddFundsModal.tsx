import { useCallback, useState } from 'react'

import {
  useAddFundsModal,
  buyUSDCActions,
  PurchaseMethod,
  DEFAULT_PURCHASE_AMOUNT_CENTS,
  PurchaseVendor,
  PayExtraPreset,
  getExtraAmount,
  StringKeys,
  usePayExtraPresets
} from '@audius/common'
import { ModalContent, ModalHeader } from '@audius/stems'
import cn from 'classnames'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { AddFunds } from 'components/add-funds/AddFunds'
import { Text } from 'components/typography'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

import styles from './AddFundsModal.module.css'
import { AddFundsSchema } from './validation'

const messages = {
  addFunds: 'Add Funds',
  cryptoTransfer: 'Crypto Transfer'
}

type Page = 'add-funds' | 'crypto-transfer'

export const AddFundsModal = () => {
  const { isOpen, onClose } = useAddFundsModal()
  const dispatch = useDispatch()
  const mobile = isMobile()

  const [page, setPage] = useState<Page>('add-funds')
  const presetValues = usePayExtraPresets(
    StringKeys.COINFLOW_ADD_FUNDS_PRESET_CENT_AMOUNTS
  )
  const initialValues = {
    AMOUNT_PRESET: PayExtraPreset.NONE,
    CUSTOM_AMOUNT: undefined
  }

  const handleClosed = useCallback(() => {
    setPage('add-funds')
  }, [setPage])

  const handleContinue = useCallback(
    ({
      purchaseMethod,
      purchaseVendor,
      amountPreset = PayExtraPreset.NONE,
      customAmount
    }: {
      purchaseMethod: PurchaseMethod
      purchaseVendor?: PurchaseVendor
      amountPreset?: PayExtraPreset
      customAmount?: number
    }) => {
      switch (purchaseMethod) {
        case PurchaseMethod.CRYPTO:
          setPage('crypto-transfer')
          break
        case PurchaseMethod.CARD: {
          dispatch(
            buyUSDCActions.onrampOpened({
              vendor: purchaseVendor || PurchaseVendor.STRIPE,
              purchaseInfo: {
                desiredAmount:
                  amountPreset !== PayExtraPreset.NONE
                    ? getExtraAmount({
                        amountPreset,
                        presetValues,
                        customAmount
                      })
                    : DEFAULT_PURCHASE_AMOUNT_CENTS
              }
            })
          )
          break
        }
        case PurchaseMethod.BALANCE:
          throw new Error('Add funds not supported with existing balance')
      }
    },
    [dispatch, presetValues]
  )

  return (
    <ModalDrawer
      zIndex={zIndex.ADD_FUNDS_MODAL}
      size={'small'}
      onClose={onClose}
      isOpen={isOpen}
      onClosed={handleClosed}
      bodyClassName={styles.modal}
      useGradientTitle={false}
      dismissOnClickOutside
      isFullscreen={false}
    >
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: mobile })}
        onClose={onClose}
        showDismissButton={!mobile}
      >
        <Text
          variant='label'
          color='neutralLight2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          {page === 'add-funds' ? messages.addFunds : messages.cryptoTransfer}
        </Text>
      </ModalHeader>
      <ModalContent className={styles.noPadding}>
        {page === 'add-funds' ? (
          <Formik
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(AddFundsSchema)}
            onSubmit={() => undefined} // Not using formik for submit
          >
            <AddFunds onContinue={handleContinue} />
          </Formik>
        ) : (
          <USDCManualTransfer onClose={() => setPage('add-funds')} />
        )}
      </ModalContent>
    </ModalDrawer>
  )
}
