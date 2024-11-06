import { useEffect, useState } from 'react'

import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useScript } from 'hooks/useScript'
import { getCognitoSignature } from 'services/audius-backend/Cognito'
import { env } from 'services/env'
import { COGNITO_SCRIPT_URL } from 'utils/constants'

import './CheckPage.module.css'

const { SIGN_IN_PAGE, TRENDING_PAGE } = route
const { getUserHandle, getAccountStatus } = accountSelectors

declare global {
  interface Window {
    Flow: any
  }
}

const COGNITO_KEY = env.COGNITO_KEY
const COGNITO_TEMPLATE_ID = env.COGNITO_TEMPLATE_ID

const CheckPage = () => {
  const dispatch = useDispatch()
  const accountHandle = useSelector(getUserHandle)
  const accountStatus = useSelector(getAccountStatus)
  const scriptLoaded = useScript(COGNITO_SCRIPT_URL)
  const [didOpen, setDidOpen] = useState(false)

  useEffect(() => {
    if (accountStatus !== Status.LOADING && !accountHandle) {
      dispatch(pushRoute(SIGN_IN_PAGE))
    }
  }, [accountHandle, accountStatus, dispatch])

  useEffect(() => {
    if (
      accountStatus !== Status.LOADING &&
      accountHandle &&
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
            customerReference: accountHandle,
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
  }, [accountHandle, accountStatus, scriptLoaded, didOpen, dispatch])

  // This component need not render anything
  return null
}

export default CheckPage
