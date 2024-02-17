import { Button, Flex } from '@audius/harmony'

import { useAudiusSdk } from 'providers/AudiusSdkProvider'

import styles from './Login.module.css'

const Login = () => {
  const { audiusSdk, oauthError } = useAudiusSdk()

  const handleOauth = () => {
    audiusSdk!.oauth!.login({ scope: 'write' })
  }

  if (!audiusSdk) {
    return <>{'Loading...'}</>
  }
  return (
    <Flex
      p='xl'
      gap='m'
      direction='column'
      justifyContent='center'
      alignItems='center'
    >
      <Button onClick={handleOauth}>Login with Audius</Button>
      {oauthError && <div className={styles.errorText}>{oauthError}</div>}
    </Flex>
  )
}

export default Login
