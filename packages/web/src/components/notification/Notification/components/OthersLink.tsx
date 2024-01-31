import { MouseEventHandler } from 'react'

import { formatCount } from '@audius/common/utils'

import styles from './OthersLink.module.css'

const messages = {
  and: 'and',
  others: (othersCount: number) =>
    `${formatCount(othersCount)} other${othersCount > 1 ? 's' : ''}`
}
type OthersLinkProps = {
  othersCount: number
  onClick: MouseEventHandler
}

export const OthersLink = (props: OthersLinkProps) => {
  const { othersCount, onClick } = props

  return (
    <span className={styles.root}>
      {messages.and}{' '}
      <span className={styles.link} onClick={onClick} role='button'>
        {messages.others(othersCount)}
      </span>
    </span>
  )
}

type OthersTextProps = {
  othersCount: number
}
export const OthersText = (props: OthersTextProps) => {
  const { othersCount } = props
  return (
    <span className={styles.root}>
      {messages.and} {messages.others(othersCount)}
    </span>
  )
}
