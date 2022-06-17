import { useEffect, useRef, useState } from 'react'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  SegmentedControl
} from '@audius/stems'

import {
  FEATURE_FLAG_OVERRIDE_KEY,
  OverrideSetting
} from 'common/hooks/useFeatureFlag'
import { useModalState } from 'common/hooks/useModalState'
import { FeatureFlags } from 'common/services/remote-config'
import { useDevModeHotkey } from 'hooks/useHotkey'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import zIndex from 'utils/zIndex'

import styles from './FeatureFlagOverrideModal.module.css'

const flags = Object.values(FeatureFlags)
const messages = {
  title: 'Feature Flag Override Settings'
}

const getOverrideSetting = (flag: string) =>
  localStorage.getItem(
    `${FEATURE_FLAG_OVERRIDE_KEY}:${flag}`
  ) as OverrideSetting

const setOverrideSetting = (flag: string, val: OverrideSetting) => {
  const flagKey = `${FEATURE_FLAG_OVERRIDE_KEY}:${flag}`
  if (val === null) return localStorage.removeItem(flagKey)
  localStorage.setItem(flagKey, val)
}

export const FeatureFlagOverrideModal = () => {
  const hotkeyToggle = useDevModeHotkey(70 /* f */)
  const [hotkeyLoaded, setHotkeyLoaded] = useState(false)
  const [isOpen, setIsOpen] = useModalState('FeatureFlagOverride')
  const defaultSettings = useRef<Record<string, boolean>>({})
  const [overrideSettings, setOverrideSettings] = useState(
    flags.reduce<Record<string, OverrideSetting>>(
      (acc, flag) => ({ ...acc, [flag]: getOverrideSetting(flag) }),
      {}
    )
  )

  useEffect(() => {
    const updateDefaultSettings = () => {
      defaultSettings.current = flags.reduce<Record<string, boolean>>(
        (acc, flag) => ({
          ...acc,
          [flag]: remoteConfigInstance.getFeatureEnabled(flag) ?? false
        }),
        {}
      )
    }

    remoteConfigInstance.waitForUserRemoteConfig().then(updateDefaultSettings)
  }, [])

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  useEffect(() => {
    if (hotkeyLoaded) {
      isOpen ? closeModal() : openModal()
    } else {
      setHotkeyLoaded(true)
    }
  }, [hotkeyToggle])

  return (
    <Modal
      title={messages.title}
      onClose={closeModal}
      isOpen={isOpen}
      zIndex={zIndex.FEATURE_FLAG_OVERRIDE_MODAL}
    >
      <ModalHeader onClose={closeModal}>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <div className={styles.optionContainer}>
          {flags.map(flag => (
            <div key={flag} className={styles.option}>
              <span>{flag}: </span>
              <SegmentedControl
                options={[
                  {
                    key: 'default',
                    text: `Default (${
                      defaultSettings.current[flag] ? 'Enabled' : 'Disabled'
                    })`
                  },
                  { key: 'enabled', text: 'Enabled' },
                  { key: 'disabled', text: 'Disabled' }
                ]}
                selected={overrideSettings[flag] ?? 'default'}
                onSelectOption={(key: string) => {
                  const val: OverrideSetting =
                    key === 'default' ? null : (key as OverrideSetting)
                  setOverrideSettings(prev => ({ ...prev, [flag]: val }))
                  setOverrideSetting(flag as FeatureFlags, val)
                }}
              />
            </div>
          ))}
        </div>
      </ModalContent>
    </Modal>
  )
}
