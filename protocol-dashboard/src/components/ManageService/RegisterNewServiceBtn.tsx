import clsx from 'clsx'
import RegisterServiceModal from 'components/RegisterServiceModal'
import { useModalControls } from 'utils/hooks'
import styles from './ManageService.module.css'

import Button, { ButtonType } from 'components/Button'

const messages = {
  register: 'Register New Service'
}

export const RegisterNewServiceBtn = () => {
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <>
      <Button
        onClick={onClick}
        type={ButtonType.PRIMARY}
        text={messages.register}
        className={clsx(styles.registerBtn)}
        textClassName={styles.registerBtnText}
      />
      <RegisterServiceModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
