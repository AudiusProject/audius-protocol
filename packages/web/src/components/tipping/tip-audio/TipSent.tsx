import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { deriveUserBankAddress } from '@audius/common/services'
import { accountSelectors, tippingSelectors } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { IconTwitter, IconCheck, Button } from '@audius/harmony'
import cn from 'classnames'

import { useSelector } from 'common/hooks/useSelector'
import { useRecord, make } from 'common/store/analytics/actions'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'
import { openTwitterLink } from 'utils/tweet'

import { ProfileInfo } from '../../profile-info/ProfileInfo'

import styles from './TipAudio.module.css'
const { getSendTipData } = tippingSelectors
const { getUserId, getAccountERCWallet, getUserHandle } = accountSelectors

const messages = {
  sending: 'SENDING',
  sentSuccessfully: 'SENT SUCCESSFULLY',
  supportOnTwitter: 'Share your support on Twitter!',
  shareToTwitter: 'Share to Twitter',
  twitterCopyPrefix: 'I just tipped ',
  twitterCopySuffix: ' $AUDIO on @audius #Audius #AUDIOTip'
}

export const TipSent = () => {
  const record = useRecord()
  const accountUserId = useSelector(getUserId)
  const accountHandle = useSelector(getUserHandle)
  const accountErcWallet = useSelector(getAccountERCWallet)
  const sendTipData = useSelector(getSendTipData)
  const { user: recipient, amount: sendAmount, source } = sendTipData

  const handleShareClick = useCallback(async () => {
    const formattedSendAmount = formatNumberCommas(sendAmount)
    const sdk = await audiusSdk()
    if (accountUserId && recipient) {
      let recipientAndAmount = `${recipient.name} ${formattedSendAmount}`
      if (recipient.twitter_handle) {
        recipientAndAmount = `@${recipient.twitter_handle} ${formattedSendAmount}`
      }
      const message = `${messages.twitterCopyPrefix}${recipientAndAmount}${messages.twitterCopySuffix}`
      openTwitterLink(`${env.AUDIUS_URL}/${recipient.handle}`, message)

      const [senderWallet, recipientWallet] = await Promise.all([
        deriveUserBankAddress(sdk, {
          ethAddress: accountErcWallet ?? undefined
        }),
        deriveUserBankAddress(sdk, {
          ethAddress: recipient.erc_wallet
        })
      ])

      record(
        make(Name.TIP_AUDIO_TWITTER_SHARE, {
          senderWallet,
          recipientWallet,
          senderHandle: accountHandle ?? '',
          recipientHandle: recipient.handle,
          amount: sendAmount,
          device: 'web',
          source
        })
      )
    }
  }, [
    sendAmount,
    accountUserId,
    recipient,
    accountErcWallet,
    record,
    accountHandle,
    source
  ])

  const renderSentAudio = () => (
    <div className={styles.modalContentHeader}>
      <div className={cn(styles.flexCenter, styles.modalContentHeaderTitle)}>
        <span className={styles.sentSuccessfullyIcon}>
          <IconCheck />
        </span>
        {messages.sentSuccessfully}
      </div>
      <div className={cn(styles.flexCenter, styles.modalContentHeaderSubtitle)}>
        <span className={styles.sendAmount}>{sendAmount}</span>
        $AUDIO
      </div>
    </div>
  )

  return recipient ? (
    <div className={styles.container}>
      {renderSentAudio()}
      <ProfileInfo
        user={recipient}
        className={styles.confirmReceiver}
        imgClassName={styles.smallDynamicPhoto}
      />
      <div className={cn(styles.flexCenter, styles.support)}>
        {messages.supportOnTwitter}
      </div>
      <div className={styles.flexCenter}>
        <Button
          variant='primary'
          color='blue'
          onClick={handleShareClick}
          iconLeft={IconTwitter}
        >
          {messages.shareToTwitter}
        </Button>
      </div>
    </div>
  ) : null
}
