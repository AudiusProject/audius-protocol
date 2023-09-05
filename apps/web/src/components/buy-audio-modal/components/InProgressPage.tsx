import { ReactNode } from 'react'

import {
  buyAudioSelectors,
  BuyAudioStage,
  formatNumberString
} from '@audius/common'
import { IconCaretDown, IconMultiselectRemove } from '@audius/stems'
import { useSelector } from 'react-redux'

import { CollapsibleContent } from 'components/collapsible-content'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { IconAUDIO, IconSOL, IconUSD } from './Icons'
import styles from './InProgressPage.module.css'

const { getAudioPurchaseInfo, getBuyAudioFlowStage, getBuyAudioFlowError } =
  buyAudioSelectors

const messages = {
  pleaseHold: 'Please hold on. This may take a few moments.',
  completeWithCoinbase: 'Complete this step with Coinbase',
  step1: 'Step 1/3',
  step2: 'Step 2/3',
  step3: 'Step 3/3',
  purchasingSol: 'Purchasing SOL',
  convertingSol: 'Converting SOL to $AUDIO',
  finishingUp: 'Finalizing Transaction',
  moreInfo: 'More Info',
  lessInfo: 'Less Info',
  usd: 'USD',
  sol: 'SOL',
  audio: '$AUDIO',
  coinbaseClosedErrorMessage: 'Coinbase Pay Was Closed Unexpectedly',
  swapErrorMessage:
    'Refresh and we’ll try again.\nDon’t worry your funds are safe!',
  coinbaseErrorMessage:
    'Something’s gone wrong with Coinbase.\nPlease check your email for more information.'
}

type Token = {
  label: string
  amount: string | null
  icon: ReactNode
}

const stageToStep = (stage: BuyAudioStage) => {
  switch (stage) {
    case BuyAudioStage.PURCHASING:
      return 1
    case BuyAudioStage.CONFIRMING_PURCHASE:
    case BuyAudioStage.SWAPPING:
      return 2
    case BuyAudioStage.CONFIRMING_SWAP:
    case BuyAudioStage.TRANSFERRING:
      return 3
  }
  console.error('Reached unexpected stage in InProgressPage.tsx:', stage)
  return 1
}

const stepMessages = {
  1: {
    stepName: messages.step1,
    moreInfo: messages.purchasingSol
  },
  2: {
    stepName: messages.step2,
    moreInfo: messages.convertingSol
  },
  3: {
    stepName: messages.step3,
    moreInfo: messages.finishingUp
  }
}

export const InProgressPage = () => {
  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const buyAudioFlowStage = useSelector(getBuyAudioFlowStage)
  const isError = useSelector(getBuyAudioFlowError)
  const step = stageToStep(buyAudioFlowStage)
  let firstToken: Token | undefined
  let secondToken: Token | undefined
  if (purchaseInfo?.isError === false) {
    const solToken = {
      label: messages.sol,
      icon: <IconSOL />,
      amount: formatNumberString(purchaseInfo.estimatedSOL.uiAmountString, {
        maxDecimals: 2
      })
    }
    const audioToken = {
      label: messages.audio,
      icon: <IconAUDIO />,
      amount: formatNumberString(
        purchaseInfo.desiredAudioAmount.uiAmountString,
        {
          maxDecimals: 2
        }
      )
    }
    if (step === 1) {
      firstToken = {
        label: messages.usd,
        icon: <IconUSD />,
        amount: formatNumberString(purchaseInfo.estimatedUSD.uiAmountString, {
          minDecimals: 2,
          maxDecimals: 2
        })
      }
      secondToken = solToken
    } else if (step === 2) {
      firstToken = solToken
      secondToken = audioToken
    } else {
      firstToken = audioToken
    }
  }
  return (
    <div className={styles.inProgressPage}>
      <div className={styles.header}>{messages.pleaseHold}</div>
      <div className={styles.loader}>
        {isError ? (
          <IconMultiselectRemove />
        ) : (
          <LoadingSpinner className={styles.spinner} />
        )}
        <span className={styles.headerCaps}>{stepMessages[step].stepName}</span>
      </div>
      {isError ? (
        <div className={styles.error}>
          {buyAudioFlowStage === BuyAudioStage.PURCHASING
            ? messages.coinbaseClosedErrorMessage
            : buyAudioFlowStage === BuyAudioStage.CONFIRMING_PURCHASE
            ? messages.coinbaseErrorMessage
            : messages.swapErrorMessage}
        </div>
      ) : step === 1 ? (
        <div className={styles.callToAction}>
          {messages.completeWithCoinbase}
        </div>
      ) : null}
      <CollapsibleContent
        id='buy-audio-more-info'
        className={styles.showMoreToggle}
        toggleButtonClassName={styles.showMoreToggleButton}
        showText={messages.moreInfo}
        hideText={messages.lessInfo}
      >
        <div className={styles.moreInfo}>
          <div className={styles.headerCaps}>{stepMessages[step].moreInfo}</div>
          <div className={styles.quote}>
            {firstToken?.icon}
            <span className={styles.amount}>{firstToken?.amount}</span>
            <span className={styles.headerCaps}>{firstToken?.label}</span>
            {secondToken ? (
              <>
                <IconCaretDown className={styles.caret} />
                {secondToken.icon}
                <span className={styles.amount}>{secondToken.amount}</span>
                <span className={styles.headerCaps}>{secondToken.label}</span>
              </>
            ) : null}
          </div>
        </div>
      </CollapsibleContent>
    </div>
  )
}
