import { useState, useEffect, useRef } from 'react'

import { confirmerSelectors } from '@audius/common/store'
import { Modal } from '@audius/stems'
import { connect } from 'react-redux'

import ConfirmationBox from 'components/confirmation-box/ConfirmationBox'
import { isElectron } from 'utils/clientUtil'
import { setupHotkeys, removeHotkeys, ModifierKeys } from 'utils/hotkeyUtil'

import styles from './UnloadDialog.module.css'

const { getIsConfirming } = confirmerSelectors

const MESSAGE_TEXT = `
  We're working on syncing your
  latest changes to the Audius network.
  Please wait a moment for your changes to get saved.
  `

const RELOAD_TEXT = 'RELOAD ANYWAY'
const QUIT_TEXT = 'QUIT ANYWAY'

const UnloadDialog = (props) => {
  const [showModal, setShowModal] = useState(false)
  const [reload, setReload] = useState(true)

  const seenModalRef = useRef(false)
  const hotkeyHookRef = useRef(null)

  const addElectronListener = isElectron()
  const ipcRef = useRef(null)

  useEffect(() => {
    if (props.isConfirming) {
      const beforeUnload = (event) => {
        event.preventDefault()
        if (!seenModalRef.current) event.returnValue = ''
      }
      window.addEventListener('beforeunload', beforeUnload)

      if (addElectronListener) {
        // Configure IPC so we can send receive/send close/quit events from
        // the main process.
        const ipc = window.require('electron').ipcRenderer
        ipc.on('close', (event, arg) => {
          setReload(false)
          setShowModal(true)
        })
        ipcRef.current = ipc
      }

      const hotkeyHook = setupHotkeys(
        {
          82 /* r */: {
            cb: onRefreshHotkey,
            or: [ModifierKeys.CTRL, ModifierKeys.CMD]
          }
        },
        /* throttleMs= */ 0
      )
      hotkeyHookRef.current = hotkeyHook
      return () => {
        removeHotkeys(hotkeyHook)
        window.removeEventListener('beforeunload', beforeUnload)
      }
    }
  }, [props.isConfirming, addElectronListener])

  const onRefreshHotkey = () => {
    setReload(true)
    setShowModal(true)
    setTimeout(() => {
      seenModalRef.current = true
    }, 0)
  }

  const onModalClose = () => {
    setShowModal(false)
    setTimeout(() => {
      seenModalRef.current = false
    }, 0)
  }

  const onReloadAnyway = () => {
    setShowModal(false)
    window.location.reload()
  }

  const onQuitAnyway = () => {
    if (ipcRef.current) {
      ipcRef.current.send('quit')
    }
  }

  return (
    <Modal
      title={
        <>
          Hang tight! <i className='emoji woman-surfing' />
        </>
      }
      isOpen={showModal}
      showTitleHeader
      onClose={onModalClose}
      bodyClassName={styles.modalBody}
      wrapperClassName={styles.modalWrapper}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
    >
      <ConfirmationBox
        text={MESSAGE_TEXT}
        rightText='GOT IT'
        leftText={reload ? RELOAD_TEXT : QUIT_TEXT}
        rightClick={onModalClose}
        leftClick={reload ? onReloadAnyway : onQuitAnyway}
      />
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  isConfirming: getIsConfirming(state)
})

const mapDispatchToProps = (dispatch) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(UnloadDialog)
