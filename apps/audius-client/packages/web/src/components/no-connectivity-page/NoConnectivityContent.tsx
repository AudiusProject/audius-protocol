import React, { useState, useEffect } from 'react'
import styles from './NoConnectivityContent.module.css'
import { Button, ButtonType } from '@audius/stems'
import { ReactComponent as IconOffline } from 'assets/img/iconOffline.svg'
import cn from 'classnames'
import loadingSpinner from 'assets/animations/loadingSpinner.json'
import Lottie from 'react-lottie'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

const messages = {
  title: "You're not connected to the internet.",
  retry: 'Retry'
}

const REFRESH_TIMEOUT_MSEC = 2 * 1000

type NoConnectivityContentProps = {
  containerClassName?: string
  innerClassName?: string
}

const rootElement = document.querySelector('#root')

const NoConnectivityContent = ({
  containerClassName,
  innerClassName
}: NoConnectivityContentProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    rootElement && disableBodyScroll(rootElement)
    return () => {
      clearAllBodyScrollLocks()
    }
  }, [])

  const onClick = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), REFRESH_TIMEOUT_MSEC)
  }

  return (
    <div className={cn(styles.outerContainer, containerClassName)}>
      <div className={styles.spacer} />
      <div className={cn(styles.container, innerClassName)}>
        <IconOffline />
        <div>{messages.title}</div>
        <Button
          type={ButtonType.PRIMARY_ALT}
          onClick={onClick}
          isDisabled={isRefreshing}
          text={
            isRefreshing ? (
              <div className={styles.spinner}>
                <Lottie
                  isClickToPauseDisabled
                  options={{
                    loop: true,
                    autoplay: true,
                    animationData: loadingSpinner
                  }}
                />
              </div>
            ) : (
              messages.retry
            )
          }
          className={styles.button}
        />
      </div>
    </div>
  )
}

export default NoConnectivityContent
