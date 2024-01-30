import { Theme } from '@audius/common/models'
import {} from '@audius/common'
import { Button, ButtonType, ButtonSize } from '@audius/stems'

import tileBackground from 'assets/img/notFoundTiledBackround.png'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
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
      <div className={styles.button}>
        <Button
          type={ButtonType.PRIMARY_ALT}
          rightIcon={
            isUpdating ? <LoadingSpinner className={styles.spinner} /> : null
          }
          text={isUpdating ? messages.buttonIsUpdating : messages.buttonUpdate}
          size={ButtonSize.MEDIUM}
          onClick={onUpdate}
        />
      </div>
    </div>
  </div>
)

export default SomethingWrong
