import React, { useCallback } from 'react'
import styles from './ClickableAddress.module.css'
import cn from 'classnames'
import { ReactComponent as IconCopy } from 'assets/img/iconCopy.svg'
import { copyToClipboard } from 'utils/clipboardUtil'
import Tooltip from 'components/tooltip/Tooltip'
import Toast from 'components/toast/Toast'
import { ComponentPlacement, MountPlacement } from 'components/types'
import PurpleBox from './PurpleBox'

type DisplayAddressProps = {
  address: string
  className?: string
}

const messages = {
  copy: 'Copy to Clipboard',
  copied: 'Copied to Clipboard',
  yourAddr: 'YOUR ADDRESS'
}

const ClickableAddress = ({ address, className }: DisplayAddressProps) => {
  const onClickAddress = useCallback(() => {
    copyToClipboard(address)
  }, [address])

  return (
    <Tooltip text={messages.copy} placement={'top'} mount={'parent'}>
      <div className={cn(styles.toastContainer, { [className!]: !!className })}>
        <Toast
          text={messages.copied}
          delay={2000}
          overlayClassName={styles.toast}
          placement={ComponentPlacement.TOP}
          mount={MountPlacement.PARENT}
        >
          <PurpleBox
            label={messages.yourAddr}
            className={styles.container}
            onClick={onClickAddress}
            text={
              <div className={styles.addressContainer}>
                <div className={styles.address}>{address}</div>
                <IconCopy className={styles.icon} />
              </div>
            }
          />
        </Toast>
      </div>
    </Tooltip>
  )
}

export default ClickableAddress
