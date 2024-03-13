import { useState, useEffect, useRef } from 'react'

import { confirmerSelectors } from '@audius/common/store'
import {
  Modal,
  setupHotkeys,
  removeHotkeys,
  ModifierKeys,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalContentText,
  ModalFooter,
  Button
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { isElectron } from 'utils/clientUtil'

const { getIsConfirming } = confirmerSelectors

const MESSAGE_TEXT = `
  We're working on syncing your
  latest changes to the Audius network.
  Please wait a moment for your changes to get saved.
  `

const RELOAD_TEXT = 'RELOAD ANYWAY'
const QUIT_TEXT = 'QUIT ANYWAY'

export const UnloadDialog = () => {
  const [showModal, setShowModal] = useState(false)
  const [reload, setReload] = useState(true)

  const isConfirming = useSelector(getIsConfirming)

  const seenModalRef = useRef(false)
  const hotkeyHookRef = useRef<(e: KeyboardEvent) => void>()

  const addElectronListener = isElectron()
  const ipcRef = useRef<any>(null)

  useEffect(() => {
    if (isConfirming) {
      const beforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault()
        if (!seenModalRef.current) event.returnValue = ''
      }
      window.addEventListener('beforeunload', beforeUnload)

      if (addElectronListener) {
        // Configure IPC so we can send receive/send close/quit events from
        // the main process.
        const ipc = window.require('electron').ipcRenderer
        ipc.on('close', () => {
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
  }, [isConfirming, addElectronListener])

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
    <Modal isOpen={showModal} onClose={onModalClose}>
      <ModalHeader>
        <ModalTitle
          title={
            <>
              Hang tight! <i className='emoji woman-surfing' />
            </>
          }
        />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>{MESSAGE_TEXT}</ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' onClick={onModalClose}>
          Got It
        </Button>
        <Button
          variant='primary'
          onClick={reload ? onReloadAnyway : onQuitAnyway}
        >
          {reload ? RELOAD_TEXT : QUIT_TEXT}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
