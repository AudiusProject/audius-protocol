import { FeatureFlags } from '@audius/common'
import { Button, ButtonType } from '@audius/stems'

import Switch from 'components/switch/Switch'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './RemixSettingsModalTrigger.module.css'

const messages = {
  remixSettings: 'Remix Settings',
  hideRemixes: 'Hide Remixes on Track Page'
}

type RemixSettingsModalTriggerProps = {
  onClick: () => void
  hideRemixes: boolean
  handleToggle: () => void
}

export const RemixSettingsModalTrigger = (
  props: RemixSettingsModalTriggerProps
) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )

  if (isGatedContentEnabled) {
    return (
      <Button
        type={ButtonType.COMMON_ALT}
        name='remixSettings'
        text={messages.remixSettings}
        className={styles.trigger}
        textClassName={styles.triggerText}
        onClick={props.onClick}
      />
    )
  }

  return (
    <div className={styles.hideRemixes}>
      <div className={styles.hideRemixesText}>{messages.hideRemixes}</div>
      <Switch isOn={props.hideRemixes} handleToggle={props.handleToggle} />
    </div>
  )
}
