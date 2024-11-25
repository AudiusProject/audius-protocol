import { Button, Flex, Text } from '@audius/harmony'
import { useFormikContext } from 'formik'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'

const messages = {
  continueAsGuest: 'Continue as Guest'
}
export const GuestCheckout = ({ onConfirm }: {}) => {
  return (
    <Flex direction='column' gap='l'>
      <Text variant='title'>Contact Details</Text>
      <HarmonyTextField name='guestEmail' label='Email' />
      <Button
        variant='primary'
        fullWidth
        color='lightGreen'
        // disabled={isBuyButtonDisabled}
        type='submit'
        onClick={onConfirm}
      >
        {messages.continueAsGuest}
      </Button>
    </Flex>
  )
}
