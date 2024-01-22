import { useEffect, useState } from 'react'

import { accountSelectors, Status } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useScript } from 'hooks/useScript'
import { getCognitoSignature } from 'services/audius-backend/Cognito'
import { env } from 'services/env'
import { COGNITO_SCRIPT_URL } from 'utils/constants'
import { SIGN_IN_PAGE, TRENDING_PAGE } from 'utils/route'

import './CheckPage.module.css'

const { getAccountUser, getAccountStatus } = accountSelectors

declare global {
  interface Window {
    Flow: any
  }
}

const COGNITO_KEY = env.COGNITO_KEY
const COGNITO_TEMPLATE_ID = env.COGNITO_TEMPLATE_ID

const CheckPage = () => {
  const dispatch = useDispatch()
  const account = useSelector(getAccountUser)
  const accountStatus = useSelector(getAccountStatus)
  const scriptLoaded = useScript(COGNITO_SCRIPT_URL)
  const [didOpen, setDidOpen] = useState(false)

  useEffect(() => {
    if (accountStatus !== Status.LOADING && !account) {
      dispatch(pushRoute(SIGN_IN_PAGE))
    }
  }, [account, accountStatus, dispatch])

  useEffect(() => {
    if (
      accountStatus !== Status.LOADING &&
      account &&
      scriptLoaded &&
      !didOpen
    ) {
      setDidOpen(true)
      const run = async () => {
        let signature = null
        try {
          const response = await getCognitoSignature()
          signature = response.signature
        } catch (e) {
          console.error('COGNITO: Failed to get Cognito signature', e)
        }
        if (!signature) {
          return
        }
        const flow = new window.Flow({
          publishableKey: COGNITO_KEY,
          templateId: COGNITO_TEMPLATE_ID,
          user: {
            customerReference: account.handle,
            signature
          }
        })

        flow.on('ui', (event: any) => {
          switch (event.action) {
            case 'closed':
              dispatch(pushRoute(TRENDING_PAGE))
              break
            default:
            // nothing
          }
        })

        flow.open()
      }
      run()
    }
  }, [account, accountStatus, scriptLoaded, didOpen, dispatch])

  // This component need not render anything
  return null
}

export default CheckPage
