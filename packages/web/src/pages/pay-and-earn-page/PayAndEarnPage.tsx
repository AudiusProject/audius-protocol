import { useEffect } from 'react'

import { ErrorLevel } from '@audius/common/src/models/ErrorReporting'
import { buyUSDCActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'
import { authService } from 'services/audius-sdk'
import { reportToSentry } from 'store/errors/reportToSentry'

import { PayAndEarnPage as DesktopPayAndEarn } from './desktop/PayAndEarnPage'
import { PayAndEarnPage as MobilePayAndEarn } from './mobile/PayAndEarnPage'
import { PayAndEarnPageProps } from './types'

export const PayAndEarnPage = (props: PayAndEarnPageProps) => {
  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  // Always check for recoverable USDC on page load
  useEffect(() => {
    const privateKey = authService.getWallet()?.getPrivateKey()
    if (!privateKey) {
      reportToSentry({
        level: ErrorLevel.Error,
        error: new Error('No private key found in pay and earn page')
      })
      return
    }
    dispatch(buyUSDCActions.startRecoveryIfNecessary({ privateKey }))
  }, [dispatch])

  const Content = isMobile ? MobilePayAndEarn : DesktopPayAndEarn

  return <Content {...props} />
}
