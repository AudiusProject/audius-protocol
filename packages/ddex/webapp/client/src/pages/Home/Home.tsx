import { Button, Flex } from '@audius/harmony'

import Upload from 'pages/Upload/Upload'
import { useAudiusSdk } from 'providers/AudiusSdkProvider'

import styles from './Home.module.css'

export const Home = () => {
  const { audiusSdk, currentUser, oauthError } = useAudiusSdk()

  const handleOauth = () => {
    audiusSdk!.oauth!.login({ scope: 'write' })
  }

  if (!audiusSdk) {
    return <>{'Loading...'}</>
  } else if (!currentUser) {
    // Oauth screen
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
  } else {
    // Logged-in home page
    return <Upload />
  }
}
