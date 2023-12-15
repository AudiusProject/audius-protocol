import { fillString, welcomeModalMessages as messages } from '@audius/common'
import { css } from '@emotion/native'
import { getNameField } from 'audius-client/src/common/store/pages/signon/selectors'
import { useSelector } from 'react-redux'

import {
  Flex,
  IconArrowRight,
  IconCloudUpload,
  Text
} from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'

import {
  ReadOnlyCoverPhotoBanner,
  ReadOnlyProfilePicture
} from './AccountHeader'

export const WelcomeDrawer = () => {
  const { value: displayName } = useSelector(getNameField)

  const navigation = useNavigation()

  const { onClose: closeDrawer } = useDrawer('Welcome')

  return (
    <NativeDrawer drawerName='Welcome'>
      <Flex w='100%' h={96} style={css({ zIndex: 1 })}>
        <ReadOnlyCoverPhotoBanner />
        <Flex
          w='100%'
          alignItems='center'
          style={css({
            position: 'absolute',
            top: 40,
            zIndex: 2
          })}
        >
          <ReadOnlyProfilePicture />
        </Flex>
      </Flex>

      <Flex direction='column' p='xl' pt='3xl' gap='xl'>
        <Flex direction='column' alignItems='center' gap='l'>
          <Text
            variant='label'
            size='xl'
            strength='strong'
            id='welcome-title'
            color='accent'
          >
            {fillString(
              messages.welcome,
              displayName ? `, ${displayName}` : ''
            )}
          </Text>
          <Text variant='body' size='l'>
            {messages.youreIn}
          </Text>
        </Flex>
        <Flex direction='column' gap='s'>
          {/* TODO: replace with harmony button */}
          <Button
            icon={IconArrowRight}
            onPress={closeDrawer}
            title={messages.startListening}
            fullWidth
          />
          {/* TODO: replace with harmony button */}
          <Button
            icon={IconCloudUpload}
            variant='secondaryAlt'
            onPress={() => {
              closeDrawer()
              navigation.navigate('HomeStack', { screen: 'Upload' })
            }}
            title={messages.upload}
            fullWidth
          />
        </Flex>
      </Flex>
    </NativeDrawer>
  )
}
