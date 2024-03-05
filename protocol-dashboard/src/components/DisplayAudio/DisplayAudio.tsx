import React, { useCallback, useEffect, useState } from 'react'
import BN from 'bn.js'
import clsx from 'clsx'

import Tooltip, { Position } from 'components/Tooltip'
import AudiusClient from 'services/Audius'
import { formatShortAud, formatWei, formatWeiNumber } from 'utils/format'

import styles from './DisplayAudio.module.css'
import copyToClipboard from 'utils/copyToClipboard'

type OwnProps = {
  className?: string
  amount: BN
  position?: Position
  label?: string
  shortFormat?: boolean
}

type DisplayAudioProps = OwnProps

const DisplayAudio: React.FC<DisplayAudioProps> = ({
  amount,
  className,
  position,
  label,
  shortFormat = false
}) => {
  const [showCopied, setShowCopied] = useState(false)
  const tooltipText = showCopied ? 'Copied!' : formatWei(amount)
  const formatter = shortFormat ? formatShortAud : AudiusClient.displayShortAud
  const onClick = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      copyToClipboard(formatWeiNumber(amount))
      setShowCopied(true)
      const timeout = setTimeout(() => {
        setShowCopied(false)
      }, 1000)
      return () => clearTimeout(timeout)
    },
    [amount, setShowCopied]
  )

  return (
    <Tooltip
      onClick={onClick}
      position={position}
      className={clsx(styles.tooltip, { [className!]: !!className })}
      text={tooltipText}
    >
      {`${formatter(amount)}${label ? ` ${label}` : ''}`}
    </Tooltip>
  )
}

export default DisplayAudio
