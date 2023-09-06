import {
  useUSDCBalance,
  formatUSDCWeiToNumber,
  formatCurrencyBalance,
  BNUSDC
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconQuestionCircle,
  TokenAmountInput
} from '@audius/stems'
import BN from 'bn.js'

import { InputV2, InputV2Variant } from 'components/data-entry/InputV2'
import { Divider } from 'components/divider'
import { Text } from 'components/typography'

import styles from './EnterTransferDetails.module.css'
import { Hint } from './Hint'
import { TextRow } from './TextRow'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  specify: `Specify how much USDC you’d like to withdraw from your Audius Account.`,
  destinationDetails: 'Provide a Solana Wallet address to transfer funds to.',
  solanaWallet: 'Solana Wallet',
  amountInputLabel: 'Amount of USDC to withdraw',
  continue: 'Continue',
  notSure: `Not sure what you’re doing? Visit the help center for guides & more info.`,
  guide: 'Guide to USDC Transfers on Audius'
}

export const EnterTransferDetails = () => {
  const { data: balance } = useUSDCBalance()
  const balanceNumber = formatUSDCWeiToNumber((balance ?? new BN(0)) as BNUSDC)
  const balanceFormatted = formatCurrencyBalance(balanceNumber)
  return (
    <div className={styles.root}>
      <TextRow left={messages.currentBalance} right={`$${balanceFormatted}`} />
      <Divider style={{ margin: 0 }} />
      <div className={styles.amount}>
        <div className={styles.amountText}>
          <TextRow left={messages.amountToWithdraw} />
          <Text variant='body' size='medium' strength='default'>
            {messages.specify}
          </Text>
        </div>
        <TokenAmountInput aria-label={messages.amountInputLabel} />
      </div>
      <Divider style={{ margin: 0 }} />
      <div className={styles.destination}>
        <div className={styles.destinationText}>
          <TextRow left={messages.destinationAddress} />
          <Text variant='body' size='medium' strength='default'>
            {messages.destinationDetails}
          </Text>
        </div>
        <InputV2
          variant={InputV2Variant.ELEVATED_PLACEHOLDER}
          placeholder={messages.solanaWallet}
        />
      </div>
      <HarmonyButton
        variant={HarmonyButtonType.SECONDARY}
        size={HarmonyButtonSize.DEFAULT}
        fullWidth
        text={messages.continue}
      />
      <Hint
        text={messages.notSure}
        link={''} // TODO(USDC): Link
        icon={IconQuestionCircle}
        linkText={messages.guide}
      />
    </div>
  )
}
