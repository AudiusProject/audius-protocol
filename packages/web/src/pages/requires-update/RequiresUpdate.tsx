import { Theme } from '@audius/common/models'
import { Button } from '@audius/harmony'

import tileBackground from 'assets/img/notFoundTiledBackround.png'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import styles from './RequiresUpdate.module.css'

const messages = {
  title: 'Please Update ✨',
  subtitle: "The version of Audius you're running is too far behind.",
  buttonUpdate: 'UPDATE NOW',
  buttonIsUpdating: 'UPDATING'
}

type SomethingWrongProps = {
  isUpdating: boolean
  theme: Theme
  onUpdate: () => void
}

const SomethingWrong = ({
  isUpdating,
  onUpdate,
  theme
}: SomethingWrongProps) => (
  <div className={styles.requiresUpdate}>
    <div
      className={styles.content}
      style={{
        backgroundImage: `url(${tileBackground})`,
        backgroundBlendMode:
          shouldShowDark(theme) || isMatrix() ? 'color-burn' : 'none'
      }}
    >
      <div className={styles.title}>{messages.title}</div>
      <div className={styles.subtitle}>{messages.subtitle}</div>
      <Button variant='primary' isLoading={isUpdating} onClick={onUpdate}>
        {isUpdating ? messages.buttonIsUpdating : messages.buttonUpdate}
      </Button>
    </div>
  </div>
)

export default SomethingWrong
