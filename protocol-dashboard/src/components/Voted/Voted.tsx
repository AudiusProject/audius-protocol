import React from 'react'

import clsx from 'clsx'

import IconThumbDown from 'assets/img/iconThumbDown.svg?react'
import IconThumbUp from 'assets/img/iconThumbUp.svg?react'
import { Vote } from 'types'

import styles from './Voted.module.css'

const messages = {
  for: 'Voted For',
  against: 'Voted Against'
}

type OwnProps = {
  vote: Vote
}

type VotedProps = OwnProps

const Voted: React.FC<VotedProps> = ({ vote }: VotedProps) => {
  const isFor = vote === Vote.Yes

  const Icon = isFor ? IconThumbUp : IconThumbDown
  const text = isFor ? messages.for : messages.against

  return (
    <div className={styles.vote}>
      <div
        className={clsx(styles.circle, {
          [styles.isFor]: isFor
        })}
      >
        <Icon className={styles.icon} />
      </div>
      <div className={styles.text}>{text}</div>
    </div>
  )
}

export default Voted
