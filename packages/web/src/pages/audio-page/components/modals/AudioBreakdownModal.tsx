import { useWalletAudioBalances, useConnectedWallets } from '@audius/common/api'
import { walletSelectors } from '@audius/common/store'
import { AUDIO } from '@audius/fixed-decimal'
import { IconInfo } from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import ModalDrawer from 'components/modal-drawer/ModalDrawer'
import Tooltip from 'components/tooltip/Tooltip'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import DisplayAudio from '../DisplayAudio'
import WalletsTable from '../WalletsTable'

import styles from './AudioBreakdownModal.module.css'
const { getAccountBalance } = walletSelectors

const messages = {
  modalTitle: '$AUDIO BREAKDOWN',
  total: 'TOTAL $AUDIO',
  audiusWallet: 'AUDIUS WALLET',
  audiusWalletDescription: 'You can use this $AUDIO throughout the app',
  linkedWallets: 'LINKED WALLETS',
  linkedWalletsDescription:
    'Linked wallets are more secure but not all features are supported',
  linkedWalletsTooltip:
    'Linked wallets affect VIP status and NFTs. Upcoming features may require different behavior to support linked wallets. '
}

const AudioBreakdownBody = () => {
  const wm = useWithMobileStyle(styles.mobile)
  const accountBalance = AUDIO(useSelector(getAccountBalance) ?? 0).value

  const { data: connectedWallets, isPending: isConnectedWalletsPending } =
    useConnectedWallets()
  const balances = useWalletAudioBalances(
    {
      wallets: connectedWallets ?? [],
      includeStaked: true
    },
    { enabled: !isConnectedWalletsPending }
  )

  const linkedWalletsBalance = AUDIO(
    balances.reduce((acc, result) => acc + (result.data ?? 0), 0)
  ).value

  const totalBalance = AUDIO(
    AUDIO(accountBalance).value + AUDIO(linkedWalletsBalance).value
  ).value

  return (
    <div className={wm(styles.container)}>
      <DisplayAudio
        showLabel={false}
        amount={totalBalance}
        className={wm(styles.sectionAmountContainer)}
        tokenClassName={wm(styles.totalAudio)}
      />
      <div className={wm(styles.totalText)}>{messages.total}</div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {messages.audiusWallet}
          <DisplayAudio
            showLabel={false}
            amount={accountBalance}
            className={wm(styles.sectionAmountContainer)}
            tokenClassName={wm(styles.sectionAmount)}
          />
        </div>
        <div className={wm(styles.sectionDescription)}>
          {messages.audiusWalletDescription}
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {messages.linkedWallets}
          <DisplayAudio
            showLabel={false}
            amount={linkedWalletsBalance}
            className={wm(styles.sectionAmountContainer)}
            tokenClassName={wm(styles.sectionAmount)}
          />
        </div>
        <WalletsTable className={styles.walletsTable} />
        <div className={wm(styles.sectionDescription)}>
          {messages.linkedWalletsDescription}
          <Tooltip
            text={messages.linkedWalletsTooltip}
            className={styles.tooltip}
            mouseEnterDelay={0.1}
            mount='body'
          >
            <IconInfo className={wm(styles.iconInfo)} />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

const AudioBreakdownModal = () => {
  const [isOpen, setOpen] = useModalState('AudioBreakdown')
  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={messages.modalTitle}
      isFullscreen={true}
      showTitleHeader
      showDismissButton
    >
      <AudioBreakdownBody />
    </ModalDrawer>
  )
}

export default AudioBreakdownModal
