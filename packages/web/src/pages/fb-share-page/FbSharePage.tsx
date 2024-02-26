import React, { useEffect } from 'react'

import { accountSelectors } from '@audius/common/store'
import { Text } from '@audius/harmony'
import cn from 'classnames'

import { env } from 'services/env'
import { useSelector } from 'utils/reducer'

import styles from './FbSharePage.module.css'

const PUBLIC_HOSTNAME = env.PUBLIC_HOSTNAME

const messages = {
  share: 'Share your profile with your friends on Facebook!'
}

const injectScript = function () {
  const scriptElement = document.createElement('script')
  scriptElement.innerHTML = `(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));`
  document.head.appendChild(scriptElement)
}

export const FbSharePage = () => {
  useEffect(() => {
    injectScript()
  }, [])
  const handle = useSelector(accountSelectors.getUserHandle)
  return (
    <div className={styles.root}>
      <div id='fb-root'></div>
      <Text>{messages.share}</Text>
      {handle ? (
        <div
          className={cn('fb-share-button', styles.share)}
          data-href={`https://${PUBLIC_HOSTNAME}/${handle}`}
          data-layout='button'
          data-size='large'
        />
      ) : null}
    </div>
  )
}
