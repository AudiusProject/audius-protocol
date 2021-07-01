import { useEffect, useState } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import AudiusBackend from 'services/AudiusBackend'
import { getAccountUser } from 'store/account/selectors'
import { SIGN_IN_PAGE, TRENDING_PAGE } from 'utils/route'

import './CheckPage.module.css'

const COGNITO_KEY = process.env.REACT_APP_COGNITO_KEY
const COGNITO_TEMPLATE_ID = process.env.REACT_APP_COGNITO_TEMPLATE_ID

const CheckPage = () => {
  const dispatch = useDispatch()
  const user = useSelector(getAccountUser)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [didOpen, setDidOpen] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')

    script.src = 'https://flow.cognitohq.com/assets/flow_client.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)

    document.body.appendChild(script)
  }, [])

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
        // @ts-ignore
        const flow = new Flow({
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
