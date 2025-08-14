import React from 'react'

import { useTheme } from '@audius/harmony'
import QRCode from 'react-qr-code'

type QRCodeProps = {
  value: string
  size?: number
}

export const QRCodeComponent = ({ value, size = 160 }: QRCodeProps) => {
  const { color } = useTheme()

  return (
    <QRCode
      value={value}
      size={size}
      fgColor={color.neutral.n950}
      bgColor='transparent'
    />
  )
}
