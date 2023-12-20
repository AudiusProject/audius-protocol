import type { ReactNode } from 'react'
import { useState } from 'react'

import { css } from '@emotion/native'
import { Dimensions, ImageBackground, SafeAreaView } from 'react-native'
import RadialGradient from 'react-native-radial-gradient'
import Animated, {
  CurvedTransition,
  FadeIn,
  FadeOut,
  SlideInUp
} from 'react-native-reanimated'
import { usePrevious } from 'react-use'

import type { TextProps } from '@audius/harmony-native'
import {
  Flex,
  IconAudiusLogoHorizontalColor,
  Paper,
  Text
} from '@audius/harmony-native'
import DJBackground from 'app/assets/images/DJportrait.jpg'

import { AudiusValues } from '../components/AudiusValues'
import { PANEL_EXPAND_DELAY } from '../constants'

import { CreateEmailScreen } from './CreateEmailScreen'
import { SignInScreen } from './SignInScreen'
import type { SignOnScreenType } from './types'

const messages = {
  newToAudius: 'New to Audius?',
  createAccount: 'Create an Account'
}

const AnimatedPaper = Animated.createAnimatedComponent(Paper)
const AnimatedFlex = Animated.createAnimatedComponent(Flex)

const CreateAccountLink = (props: TextProps) => {
  const { onPress } = props
  return (
    <AnimatedFlex
      alignItems='center'
      justifyContent='flex-end'
      style={css({ flexGrow: 1 })}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <SafeAreaView>
        <Text
          textAlign='center'
          color='staticWhite'
          style={{ justifyContent: 'flex-end' }}
        >
          {messages.newToAudius}{' '}
          <Text
            color='staticWhite'
            style={css({ textDecorationLine: 'underline' })}
            onPress={onPress}
          >
            {messages.createAccount}
          </Text>
        </Text>
      </SafeAreaView>
    </AnimatedFlex>
  )
}

const Background = () => {
  return (
    <Flex
      h='100%'
      w='100%'
      alignItems='center'
      justifyContent='flex-end'
      style={css({
        position: 'absolute',
        top: 0,
        left: 0
      })}
    >
      <RadialGradient
        style={css({
          // NOTE: Width/Height styles are mandatory for gradient to work. Otherwise it will crash the whole app 🫠
          width: '100%',
          height: '100%',
          position: 'absolute',
          bottom: 0,
          zIndex: 2
        })}
        colors={[
          'rgba(91, 35, 225, 0.8)',
          'rgba(113, 41, 230, 0.64)',
          'rgba(162, 47, 235, 0.5)'
        ]}
        stops={[0.1, 0.67, 1]}
        radius={Dimensions.get('window').width / 1.2}
      />
      <ImageBackground
        source={DJBackground}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0
        }}
        resizeMode='cover'
      />
    </Flex>
  )
}

type ExpandablePanelProps = {
  children: ReactNode
}

const ExpandablePanel = (props: ExpandablePanelProps) => {
  const { children } = props
  return (
    <AnimatedPaper
      entering={SlideInUp.duration(880).delay(PANEL_EXPAND_DELAY)}
      layout={CurvedTransition}
      borderRadius='3xl'
      style={css({ overflow: 'hidden' })}
    >
      <SafeAreaView>
        <Flex gap='2xl' ph='l' pv='2xl'>
          {children}
        </Flex>
      </SafeAreaView>
    </AnimatedPaper>
  )
}

/*
 * Manages the container for sign-up and sign-in flow
 * Not using navigation for this due to transition between sign-in and sign-up
 */
export const SignOnScreen = () => {
  const [email, setEmail] = useState('')
  const [screen, setScreen] = useState<SignOnScreenType>('sign-up')
  const previousScreen = usePrevious(screen)

  const screenProps = {
    email,
    onChangeEmail: setEmail,
    onChangeScreen: setScreen
  }

  return (
    <>
      <Background />
      <Flex flex={1} style={css({ flexGrow: 1 })} h='100%'>
        <ExpandablePanel>
          <IconAudiusLogoHorizontalColor style={css({ alignSelf: 'center' })} />
          {screen === 'sign-up' ? (
            <CreateEmailScreen {...screenProps} />
          ) : (
            <SignInScreen {...screenProps} />
          )}
        </ExpandablePanel>
        {screen === 'sign-up' ? (
          <AudiusValues isPanelExpanded={!!previousScreen} />
        ) : (
          <CreateAccountLink onPress={() => setScreen('sign-up')} />
        )}
      </Flex>
    </>
  )
}
