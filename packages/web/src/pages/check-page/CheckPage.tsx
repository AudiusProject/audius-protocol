import { useCallback, useEffect, useState } from 'react'

import { useCurrentAccount } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { usePlaidLink } from 'react-plaid-link'
import { useDispatch, useSelector } from 'react-redux'

import Page from 'components/page/Page'
import { identityService } from 'services/audius-sdk/identity'
import { push as pushRoute } from 'utils/navigation'

import './CheckPage.module.css'

const { SIGN_IN_PAGE, TRENDING_PAGE } = route
const { getAccountStatus } = accountSelectors

const CheckPage = () => {
  const dispatch = useDispatch()
  const { data: accountHandle } = useCurrentAccount({
    select: (data) => data?.user.handle
  })
  const accountStatus = useSelector(getAccountStatus)

  useEffect(() => {
    if (accountStatus !== Status.LOADING && !accountHandle) {
      dispatch(pushRoute(SIGN_IN_PAGE))
    }
  }, [accountHandle, accountStatus, dispatch])

  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLinkToken() {
      const { linkToken } = await identityService.createPlaidLinkToken()
      setLinkToken(linkToken)
    }
    fetchLinkToken()
  }, [])

  const onSuccess = useCallback(() => {
    dispatch(pushRoute(TRENDING_PAGE))
  }, [dispatch])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess
  })

  useEffect(() => {
    if (ready) {
      const originalWidth = document.body.style.width
      document.body.style.setProperty('width', '100%', 'important')
      open()
      return () => {
        document.body.style.width = originalWidth
      }
    }
  }, [ready, open])

  return <Page title='Verification' description='Audius account verification' />
}

export default CheckPage
