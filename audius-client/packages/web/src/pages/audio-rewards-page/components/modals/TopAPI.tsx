import { useCallback } from 'react'

import AudiusAPI from 'assets/img/audiusAPI.png'
import { useModalState } from 'common/hooks/useModalState'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { AUDIUS_API_LINK } from 'utils/route'

import ButtonWithArrow from '../ButtonWithArrow'

import ModalDrawer from './ModalDrawer'
import styles from './TopApi.module.css'

const messages = {
  modalTitle: 'Audius API',
  title: "It's easy to build your own app on Audius",
  description: 'The top 10 Audius API apps each month win',
  button: 'Learn More About The Audius API'
}

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const TopAPIBody = () => {
  const wm = useWithMobileStyle(styles.mobile)

  const onClickAudiusAPI = useCallback(() => {
    window.open(AUDIUS_API_LINK, '__blank')
  }, [])

  return (
    <div className={wm(styles.container)}>
      <img src={AudiusAPI} alt='Audius API Logo' />
      <span className={styles.title}>{messages.title}</span>
      <span className={styles.subtitle}>{messages.description}</span>
      <ButtonWithArrow
        text={messages.button}
        className={styles.button}
        onClick={onClickAudiusAPI}
        textClassName={styles.buttonText}
      />
    </div>
  )
}

const TopAPIModal = () => {
  const [isOpen, setOpen] = useModalState('APIRewardsExplainer')

  return (
    <ModalDrawer
      isOpen={!IS_NATIVE_MOBILE && isOpen}
      onClose={() => setOpen(false)}
      title={messages.modalTitle}
      isFullscreen={false}
      showTitleHeader
      showDismissButton>
      <TopAPIBody />
    </ModalDrawer>
  )
}

export default TopAPIModal
