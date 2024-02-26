import React, { useCallback, useState } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import Tooltip, { Position } from 'components/Tooltip'
import AudiusClient from 'services/Audius'
import copyToClipboard from 'utils/copyToClipboard'
import { formatShortAud, formatWei, formatWeiNumber } from 'utils/format'

import styles from './DisplayAudio.module.css'

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
  const [tooltipText, setTooltipText] = useState(formatWei(amount))
  const formatter = shortFormat ? formatShortAud : AudiusClient.displayShortAud
  const onClick = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      copyToClipboard(formatWeiNumber(amount))
      setTooltipText('Copied!')
      const timeout = setTimeout(() => {
        setTooltipText(formatWei(amount))
      }, 1000)
      return () => clearTimeout(timeout)
    },
    [amount, setTooltipText]
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
