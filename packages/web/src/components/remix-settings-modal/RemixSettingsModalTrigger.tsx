import { FeatureFlags } from '@audius/common'
import { Button, ButtonSize, ButtonType, IconRemix } from '@audius/stems'

import Switch from 'components/switch/Switch'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './RemixSettingsModalTrigger.module.css'

const messages = {
  remixSettings: 'Remix Settings',
  hideRemixes: 'Hide Remixes on Track Page'
}

type RemixSettingsModalTriggerProps = {
  className?: string
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
        className={props.className}
        type={ButtonType.COMMON_ALT}
        name='remixSettings'
        text={messages.remixSettings}
        size={ButtonSize.SMALL}
        onClick={props.onClick}
        leftIcon={<IconRemix />}
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
