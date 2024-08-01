import { useFormikContext } from 'formik'
import { View } from 'react-native'

import { IconInfo } from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { FormScreen } from 'app/screens/form-screen'
import { makeStyles } from 'app/styles'

import type { FormValues } from '../types'

const messages = {
  title: 'ISRC/ISWC',
  isrc: 'ISRC',
  iswc: 'ISWC'
}

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    paddingTop: spacing(8),
    paddingHorizontal: spacing(4)
  }
}))

export const IsrcIswcScreen = () => {
  const styles = useStyles()

  const { errors } = useFormikContext<FormValues>()

  const hasErrors = Boolean(errors.isrc || errors.iswc)

  return (
    <FormScreen
      title={messages.title}
      icon={IconInfo}
      variant='white'
      disableSubmit={hasErrors}
      revertOnCancel
    >
      <View style={styles.content}>
        <TextField
          name='isrc'
          label={messages.isrc}
          placeholder='CC-XXX-YY-NNNNN'
          errorBeforeSubmit
        />
        <TextField
          name='iswc'
          label={messages.iswc}
          placeholder='T-34524688-1'
          errorBeforeSubmit
        />
      </View>
    </FormScreen>
  )
}
