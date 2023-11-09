import cn from 'classnames'

import IconArrow from 'assets/img/iconArrow.svg'

import styles from './SectionButton.module.css'

type SectionButtonProps = {
  text: string
  onClick: () => void
  isMobile?: boolean
}

const SectionButton = ({ text, onClick, isMobile }: SectionButtonProps) => {
  return (
    <div
      className={cn(styles.container, { [styles.isMobile]: isMobile })}
      onClick={onClick}
    >
      <div className={styles.text}>{text}</div>
      <IconArrow className={styles.iconArrow} />
    </div>
  )
}

export default SectionButton
