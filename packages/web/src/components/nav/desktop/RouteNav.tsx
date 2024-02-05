import { useCallback } from 'react'

import { goBack, goForward } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import IconCaretRight from 'assets/img/iconCaretRight.svg'

import styles from './RouteNav.module.css'

export const RouteNav = () => {
  const dispatch = useDispatch()

  const handleGoBack = useCallback(() => {
    dispatch(goBack())
  }, [dispatch])

  const handleGoForward = useCallback(() => {
    dispatch(goForward())
  }, [dispatch])

  return (
    <div className={styles.wrapper}>
      <IconCaretRight className={styles.backButton} onClick={handleGoBack} />
      <IconCaretRight
        className={styles.forwardButton}
        onClick={handleGoForward}
      />
    </div>
  )
}
