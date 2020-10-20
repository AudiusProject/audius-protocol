import TwitterButton from 'components/general/TwitterButton'
import React, { useCallback } from 'react'
import { BNWei } from 'store/wallet/slice'
import { ModalBodyWrapper } from '../WalletModal'
import DisplayAudio from './DisplayAudio'
import styles from './ClaimSuccessBody.module.css'
import { openTwitterLink } from 'utils/tweet'

const messages = {
  newBalance: 'Your $AUDIO balance is now:',
  subtitle:
    'You now own a small part of Audius. You can earn more just by using the platform and contributing to its success!',
  share: 'Share on Twitter'
}
type ClaimSuccessBodyProps = { balance: BNWei }

const ClaimSuccessBody = ({ balance }: ClaimSuccessBodyProps) => {
  const onTwitterClick = useCallback(() => {
    const url = 'https://audius.co'
    const text = 'I just claimed my $AUDIO tokens on @AudiusProject! #Audius'
    openTwitterLink(url, text)
  }, [])

  return (
    <ModalBodyWrapper>
      <div className={styles.balance}>{messages.newBalance}</div>
      <DisplayAudio amount={balance} />
      <div className={styles.subtitle}>{messages.subtitle}</div>
      <TwitterButton
        size={'large'}
        textLabel={messages.share}
        className={styles.btn}
        onClick={onTwitterClick}
      />
    </ModalBodyWrapper>
  )
}

export default ClaimSuccessBody
