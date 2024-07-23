import { useField } from 'formik'

import { IconIndent } from '@audius/harmony-native'
import { FormScreen } from 'app/screens/form-screen'

import {
  IsrcField,
  LicenseTypeField,
  ReleaseDateField,
  SubmenuList
} from '../fields'
import { KeyBpmField } from '../fields/KeyBpmField'

const messages = {
  screenTitle: 'Advanced'
}

export const AdvancedScreen = () => {
  const [{ value: isUpload }] = useField('isUpload')
  const [{ value: isUnlisted }] = useField('is_unlisted')

  return (
    <FormScreen
      title={messages.screenTitle}
      icon={IconIndent}
      bottomSection={null}
      variant='white'
    >
      <SubmenuList>
        <LicenseTypeField />
        <IsrcField />
        {isUnlisted ? null : <ReleaseDateField />}
        {isUpload ? <></> : <KeyBpmField />}
      </SubmenuList>
    </FormScreen>
  )
}
