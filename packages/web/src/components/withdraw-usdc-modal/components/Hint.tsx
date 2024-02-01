import {} from '@audius/stems'
import { IconComponent } from '@audius/harmony'

import { Text } from 'components/typography'

import styles from './Hint.module.css'

type HintProps = {
  onClick?: () => void
  text: string
  icon: IconComponent
  link: string
  linkText: string
}

export const Hint = ({
  onClick,
  text,
  icon: Icon,
  link,
  linkText
}: HintProps) => {
  return (
    <div className={styles.root}>
      <Icon className={styles.icon} />
      <div>
        <Text
          className={styles.text}
          variant='body'
          size='medium'
          strength='default'
        >
          {text}
        </Text>
        <a
          target='_blank'
          href={link}
          onClick={onClick}
          className={styles.link}
          rel='noreferrer'
        >
          {linkText}
        </a>
      </div>
    </div>
  )
}
