import { useCallback, useEffect } from 'react'

import { Button, Flex } from '@audius/harmony'
import { useSearchParams } from 'react-router-dom'

import { useAudiusSdk } from 'providers/AudiusSdkProvider'
import { useAuth } from 'providers/AuthProvider'

import styles from './Login.module.css'

const Login = () => {
  const [searchParams] = useSearchParams()
  const { audiusSdk, oauthError } = useAudiusSdk()
  const { login } = useAuth()

  const auto = searchParams.get('auto')
  const token = searchParams.get('token')

  useEffect(() => {
    if (audiusSdk && auto) {
      audiusSdk.oauth!.login({
        scope: 'write',
        redirectUri: new URL(window.location.href).origin,
        display: 'fullScreen'
      })
    }
  }, [audiusSdk, auto])

  useEffect(() => {
    if (token) {
      login(token)
    }
  }, [token, login])

  const handleOauth = useCallback(() => {
    audiusSdk!.oauth!.login({ scope: 'write' })
  }, [audiusSdk])

  if (!audiusSdk) {
    return null
  }

  return (
    <Flex
      p='xl'
      gap='m'
      direction='column'
      justifyContent='center'
      alignItems='center'
    >
      {!auto ? <Button onClick={handleOauth}>Login with Audius</Button> : null}
      {oauthError && <div className={styles.errorText}>{oauthError}</div>}
    </Flex>
  )
}

export default Login
