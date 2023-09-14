import {
  useUSDCBalance,
  formatCurrencyBalance,
  BNUSDC,
  useWithdrawUSDCModal,
  formatUSDCWeiToFloorDollarNumber,
  makeSolanaTransactionLink
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
import { toHumanReadable } from 'utils/tokenInput'

import { TextRow } from './TextRow'
import styles from './TransferSuccessful.module.css'

const messages = {
  priorBalance: 'Prior Balance',
  newBalance: 'New Balance',
  amountWithdrawn: 'Amount Withdrawn',
  destinationAddress: 'Destination Address',
  viewOn: 'View On Solana Block Explorer',
  success: 'Your Withdrawal Was Successful!'
}

const openExplorer = (signature: string) => {
  window.open(
    makeSolanaTransactionLink(signature),
    '_blank',
    'noreferrer,noopener'
  )
}

export const TransferSuccessful = ({
  priorBalanceCents
}: {
  priorBalanceCents: number
}) => {
  const { data: balance } = useUSDCBalance()
  const { data: modalData } = useWithdrawUSDCModal()
  const balanceNumber = formatUSDCWeiToFloorDollarNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceNumber)

  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)

  const { signature } = modalData

  return (
    <div className={styles.root}>
      <TextRow
        left={messages.priorBalance}
        right={`$${toHumanReadable(priorBalanceCents)}`}
      />
      <Divider style={{ margin: 0 }} />
      <TextRow
        left={messages.amountWithdrawn}
        right={`-$${toHumanReadable(amountValue)}`}
      />
      <Divider style={{ margin: 0 }} />
      <TextRow left={messages.newBalance} right={`$${balanceFormatted}`} />
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
