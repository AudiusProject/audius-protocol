import React from 'react'

import QRCode from 'react-native-qrcode-svg'

import { useTheme } from '@audius/harmony-native'

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
      color={color.neutral.n950}
      backgroundColor='transparent'
    />
  )
}
