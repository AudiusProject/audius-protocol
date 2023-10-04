import React, { CSSProperties } from 'react'
import BN from 'bn.js'
import { fraction } from '../../utils/numeric'
import { TICKER } from '../../utils/consts'

import desktopStyles from './VoteMeter.module.css'
import mobileStyles from './VoteMeterMobile.module.css'
import { createStyles } from '../../utils/mobile'
import DisplayAudio from '../../components/DisplayAudio'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  for: 'FOR',
  against: 'AGAINST',
  auds: TICKER
}

type OwnProps = {
  votesFor: BN
  votesAgainst: BN
}

type VoteMeterProps = OwnProps

const VoteMeter: React.FC<VoteMeterProps> = ({
  votesFor,
  votesAgainst
}: VoteMeterProps) => {
  const percentFor = fraction(votesFor, votesFor.add(votesAgainst)) * 100

  const votesForStyle: CSSProperties = {}
  const votesAgainstStyle: CSSProperties = {}
  if (!votesFor.isZero() || !votesAgainst.isZero()) {
    // If there are some votes, set the width of the bars
    votesForStyle.width = `${percentFor}%`
    votesAgainstStyle.width = `${100 - percentFor}%`
  }

  return (
    <div className={styles.voteMeter}>
      <div className={styles.counts}>
        <div className={styles.count}>
          <DisplayAudio amount={votesFor} />
          <span>{messages.auds}</span>
        </div>
        <div className={styles.count}>
          <DisplayAudio amount={votesAgainst} />
          <span>{messages.auds}</span>
        </div>
      </div>

      <div className={styles.meter}>
        <div className={styles.votesFor} style={votesForStyle} />
        <div className={styles.votesAgainst} style={votesAgainstStyle} />
      </div>

      <div className={styles.labels}>
        <div className={styles.label}>{messages.for}</div>
        <div className={styles.label}>{messages.against}</div>
      </div>
    </div>
  )
}

export default VoteMeter
