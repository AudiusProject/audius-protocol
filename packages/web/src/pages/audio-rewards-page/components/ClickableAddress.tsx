import { ReactNode, useCallback } from 'react'

import cn from 'classnames'

import IconCopy from 'assets/img/iconCopy.svg'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import { ComponentPlacement, MountPlacement } from 'components/types'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './ClickableAddress.module.css'
import PurpleBox from './PurpleBox'

type DisplayAddressProps = {
  address: string
  className?: string
  isCompact?: boolean
  label?: ReactNode
}

const messages = {
  copy: 'Copy to Clipboard',
  copied: 'Copied to Clipboard',
  yourAddr: 'YOUR ADDRESS'
}

const ClickableAddress = ({
  address,
  className,
  label,
  isCompact = false
}: DisplayAddressProps) => {
  const onClickAddress = useCallback(() => {
    copyToClipboard(address)
  }, [address])

  return (
    <Tooltip
      text={messages.copy}
      placement={ComponentPlacement.TOP}
      mount={MountPlacement.PARENT}
    >
      <div className={cn(styles.toastContainer, { [className!]: !!className })}>
        <Toast
          text={messages.copied}
          delay={2000}
          overlayClassName={styles.toast}
          placement={ComponentPlacement.TOP}
          mount={MountPlacement.PARENT}
        >
          <PurpleBox
            label={label ?? messages.yourAddr}
            className={styles.container}
            onClick={onClickAddress}
            isCompact={isCompact}
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
