import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconQuestionCircle,
  Switch
} from '@audius/stems'

import { ReactComponent as IconCaretLeft } from 'assets/img/iconCaretLeft.svg'
import { Divider } from 'components/divider'
import { Text } from 'components/typography'

import styles from './ConfirmTransferDetails.module.css'
import { Hint } from './Hint'
import { TextRow } from './TextRow'

const messages = {
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  review: 'Review Details Carefully',
  byProceeding:
    'By proceeding, you accept full responsibility for any errors, understanding that mistakes may lead to irreversible loss of funds. Transfers are final and cannot be reversed.',
  haveCarefully:
    'I have carefully reviewed the accuracy of this information and I understand transfers are final and cannot be reversed.',
  goBack: 'Go Back',
  confirm: 'Confirm Transfer',
  notSure: `Not sure what you’re doing? Visit the help center for guides & more info.`,
  guide: 'Guide to USDC Transfers on Audius'
}

export const ConfirmTransferDetails = () => {
  const wallet = '72pepj'
  const amount = '200'
  return (
    <div className={styles.root}>
      <div className={styles.amount}>
        <TextRow left={messages.amountToWithdraw} right={`-$${amount}`} />
      </div>
      <Divider style={{ margin: 0 }} />
      <div className={styles.destination}>
        <TextRow left={messages.destinationAddress} />
        <Text variant='body' size='medium' strength='default'>
          {wallet}
        </Text>
      </div>
      <div className={styles.details}>
        <Text variant='title' size='medium' strength='default'>
          {messages.review}
        </Text>
        <Text variant='body' size='small' strength='default'>
          {messages.byProceeding}
        </Text>
        <div className={styles.acknowledge}>
          <Switch checked={true} onChange={() => {}} />
          <Text variant='body' size='small' strength='default'>
            {messages.haveCarefully}
          </Text>
        </div>
      </div>
      <div className={styles.buttons}>
        <HarmonyButton
          iconLeft={IconCaretLeft}
          variant={HarmonyButtonType.SECONDARY}
          size={HarmonyButtonSize.DEFAULT}
          text={messages.goBack}
        />
        <HarmonyButton
          variant={HarmonyButtonType.SECONDARY}
          size={HarmonyButtonSize.DEFAULT}
          text={messages.confirm}
        />
      </div>
      <Hint
        text={messages.notSure}
        link={''} // TODO(USDC): Link
        icon={IconQuestionCircle}
        linkText={messages.guide}
      />
    </div>
  )
}
