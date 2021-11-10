/* global Flow */
import { useEffect, useState } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { getAccountUser } from 'common/store/account/selectors'
import { useScript } from 'hooks/useScript'
import AudiusBackend from 'services/AudiusBackend'
import { COGNITO_SCRIPT_URL } from 'utils/constants'
import { SIGN_IN_PAGE, TRENDING_PAGE } from 'utils/route'

import './CheckPage.module.css'

declare global {
  interface Window {
    Flow: any
  }
}

const COGNITO_KEY = process.env.REACT_APP_COGNITO_KEY
const COGNITO_TEMPLATE_ID = process.env.REACT_APP_COGNITO_TEMPLATE_ID

const CheckPage = () => {
  const dispatch = useDispatch()
  const user = useSelector(getAccountUser)
  const scriptLoaded = useScript(COGNITO_SCRIPT_URL)
  const [didOpen, setDidOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      dispatch(pushRoute(SIGN_IN_PAGE))
    }
  }, [user, dispatch])

  useEffect(() => {
    if (user && scriptLoaded && !didOpen) {
      setDidOpen(true)
      const run = async () => {
        const { signature } = await AudiusBackend.getCognitoSignature()
        const flow = new window.Flow({
          publishableKey: COGNITO_KEY,
          templateId: COGNITO_TEMPLATE_ID,
          user: {
            customerReference: user.handle,
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
  }, [user, scriptLoaded, didOpen, dispatch])

  // This component need not render anything
  return null
}

export default CheckPage
