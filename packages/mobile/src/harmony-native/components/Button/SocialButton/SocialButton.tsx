import { useState } from 'react'

import RadialGradient from 'react-native-radial-gradient'

import {
  IconInstagram,
  IconTikTok,
  IconTwitter
} from 'app/harmony-native/icons'

import { useTheme } from '../../../foundations/theme'
import { Box } from '../../layout'
import { Button } from '../Button/Button'
import type { ButtonProps } from '../types'
import { ButtonSize } from '../types'

import type { SocialButtonProps, SocialMedia } from './types'

const getButtonLogo = (type: SocialMedia) => {
  switch (type) {
    case 'instagram':
      return <IconInstagram color='staticWhite' size='l' />
    case 'tiktok':
      return <IconTikTok color='staticWhite' size='l' />
    case 'twitter':
      return <IconTwitter color='staticWhite' size='l' />
    default:
      return undefined
  }
}

const getSocialButtonProps = (type: SocialMedia): ButtonProps => {
  switch (type) {
    case 'tiktok':
      return { hexColor: '#fe2c55' }
    case 'twitter':
      return { hexColor: '#1ba1f1' }
    case 'instagram':
      return { hexColor: '#ca1d7e' }
    default:
      return {}
  }
}

export const SocialButton = (props: SocialButtonProps) => {
  const { socialType, ...rest } = props
  const socialButtonProps = getSocialButtonProps(socialType)
  const [isPressing, setIsPressing] = useState(false)
  const { iconSizes } = useTheme()

  const handlePressIn = () => {
    setIsPressing(true)
  }
  const handlePressOut = () => {
    setIsPressing(false)
  }

  const [buttonDimensions, setButtonDimensions] = useState<{
    height: number
    width: number
  }>({ height: 0, width: 0 })

  const gradientColors = isPressing
    ? ['#DFB600', '#D2501F', '#C33137', '#AA005E', '#5000DF']
    : ['#FFD600', '#F2703F', '#E35157', '#CA1D7E', '#7017FF']

  const radiusMod = rest.size === ButtonSize.LARGE ? 1.2 : 1.1
  const gradientCenter =
    rest.size === ButtonSize.SMALL
      ? [12, 36]
      : rest.size === ButtonSize.LARGE
      ? [20, 68]
      : [16, 52]

  return (
    <Button
      {...socialButtonProps}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={(e) => {
        setButtonDimensions({
          height: e.nativeEvent.layout.height,
          width: e.nativeEvent.layout.width
        })
      }}
      {...rest}
    >
      {socialType === 'instagram' ? (
        <>
          <RadialGradient
            colors={gradientColors}
            center={gradientCenter}
            style={{
              height: buttonDimensions.height,
              width: buttonDimensions.width,
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            stops={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            radius={buttonDimensions.width * radiusMod}
          >
            {getButtonLogo(socialType)}
          </RadialGradient>
          <Box w={iconSizes.l} />
        </>
      ) : (
        getButtonLogo(socialType)
      )}
    </Button>
  )
}
