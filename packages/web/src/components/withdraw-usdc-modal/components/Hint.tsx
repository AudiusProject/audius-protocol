import { Flex, IconComponent, Text } from '@audius/harmony'

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
      <Flex alignItems='center' gap='s'>
        <Text variant='body' size='m' strength='default'>
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
      </Flex>
    </div>
  )
}
