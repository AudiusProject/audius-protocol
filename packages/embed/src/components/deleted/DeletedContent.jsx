import cn from 'classnames'

import FullColorLogo from '../../assets/img/Horizontal-Logo-Full-Color.png'
import AudiusLogo from '../../assets/img/audiusLogoHorizontal.svg'
import { getCopyableLink } from '../../util/shareUtil'
import { PlayerFlavor } from '../app'
import Button from '../button/Button'

import styles from './DeletedContent.module.css'
import DeletedContentTiny from './DeletedContentTiny'

const messages = {
  mainLabel: 'This content was removed by the creator.',
  deleted: 'Deleted',
  subLabel1: 'Unlimited Uploads.',
  subLabel2: '320kbps Streaming.',
  subLabel3: '100% Free.',
  buttonLabel: 'Find more on'
}

const DeletedContent = ({ flavor, isBlocked }) => {
  const onClickFindMore = () => {
    window.open(getCopyableLink(), '_blank')
  }

  const isCard = flavor === PlayerFlavor.CARD
  const isTiny = flavor === PlayerFlavor.TINY
  if (isTiny) {
    return (
      <DeletedContentTiny onClick={onClickFindMore} isBlocked={isBlocked} />
    )
  }

  return (
    <div className={cn(styles.container, { [styles.cardContainer]: isCard })}>
      {isCard && (
        <div
          className={styles.logo}
          style={{
            background: `url(${FullColorLogo})`
          }}
        />
      )}
      <div className={styles.label}>
        {isBlocked ? messages.deleted : messages.mainLabel}
      </div>
      {isCard && (
        <div className={styles.subLabel}>
          <span>{messages.subLabel1}</span>
          <span>{messages.subLabel2}</span>
          <span>{messages.subLabel3}</span>
        </div>
      )}
      <Button
        className={styles.button}
        onClick={onClickFindMore}
        label={messages.buttonLabel}
        icon={<AudiusLogo />}
      />
    </div>
  )
}

export default DeletedContent
