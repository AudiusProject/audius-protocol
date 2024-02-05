import { ID } from '@audius/common'
import cn from 'classnames'

import IconRemix from 'assets/img/iconRemix.svg'
import ConnectedRemixCard from 'components/remix-card/ConnectedRemixCard'
import SectionButton from 'components/section-button/SectionButton'
import { isMatrix } from 'utils/theme/theme'

import styles from './Remixes.module.css'

const messages = {
  title: 'Remixes',
  viewAll: (count: number | null) =>
    `View All ${count && count > 6 ? count : ''} Remixes`
}

type RemixesProps = {
  trackIds: ID[]
  goToAllRemixes: () => void
  count: number | null
}

const Remixes = ({ trackIds, goToAllRemixes, count }: RemixesProps) => {
  return (
    <div className={styles.remixes}>
      <div className={styles.header}>
        <IconRemix
          className={cn(styles.iconRemix, { [styles.matrix]: isMatrix() })}
        />
        <span>{messages.title}</span>
      </div>
      <div className={styles.tracks}>
        {trackIds.map((id) => {
          return <ConnectedRemixCard key={id} trackId={id} />
        })}
      </div>
      <div className={styles.button}>
        <SectionButton
          isMobile
          text={messages.viewAll(count)}
          onClick={goToAllRemixes}
        />
      </div>
    </div>
  )
}

export default Remixes
