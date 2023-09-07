import {
  useUSDCBalance,
  formatUSDCWeiToNumber,
  formatCurrencyBalance,
  BNUSDC,
  useWithdrawUSDCModal
} from '@audius/common'
import {
  HarmonyPlainButton,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType,
  IconCheck
} from '@audius/stems'
import BN from 'bn.js'
import { useField } from 'formik'

import { ReactComponent as IconExternalLink } from 'assets/img/iconExternalLink.svg'
import { Icon } from 'components/Icon'
import { Divider } from 'components/divider'
import { Text } from 'components/typography'
import {
  ADDRESS,
  AMOUNT
} from 'components/withdraw-usdc-modal/WithdrawUSDCModal'

import { TextRow } from './TextRow'
import styles from './TransferSuccessful.module.css'

const messages = {
  newBalance: 'New Balance',
  amountWithdrawn: 'Amount Withdrawn',
  destinationAddress: 'Destination Address',
  viewOn: 'View On Solana Block Explorer',
  success: 'Your Withdrawal Was Successful!'
}

const openExplorer = (signature: string) => {
  window.open(
    `https://solscan.io/tx/${signature}`,
    '_blank',
    'noreferrer,noopener'
  )
}

export const TransferSuccessful = () => {
  const { data: balance } = useUSDCBalance()
  const { data: modalData } = useWithdrawUSDCModal()
  const balanceNumber = formatUSDCWeiToNumber((balance ?? new BN(0)) as BNUSDC)
  const balanceFormatted = formatCurrencyBalance(balanceNumber)

  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)

  const { signature } = modalData

  return (
    <div className={styles.root}>
      <Divider style={{ margin: 0 }} />
      <TextRow left={messages.amountWithdrawn} right={`-$${amountValue}`} />
      <Divider style={{ margin: 0 }} />
      <div className={styles.newBalance}>
        <TextRow left={messages.newBalance} right={`$${balanceFormatted}`} />
      </div>
      <Divider style={{ margin: 0 }} />
      <div className={styles.destination}>
        <TextRow left={messages.destinationAddress} />
        <Text variant='body' size='medium' strength='default'>
          {addressValue}
        </Text>
        <HarmonyPlainButton
          style={{ padding: 0 }}
          onClick={() => openExplorer(signature ?? '')}
          iconRight={IconExternalLink}
          variant={HarmonyPlainButtonType.SUBDUED}
          size={HarmonyPlainButtonSize.DEFAULT}
          text={messages.viewOn}
        />
      </div>
      <div className={styles.success}>
        <div className={styles.completionCheck}>
          <Icon icon={IconCheck} size='xxSmall' color='white' />
        </div>
        <Text variant={'heading'} size='small' strength='default'>
          {messages.success}
        </Text>
      </div>
    </div>
  )
}
