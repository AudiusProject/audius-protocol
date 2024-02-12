import { View } from 'react-native'

import { IconInfo } from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { makeStyles } from 'app/styles'

import { FormScreen } from '../components'

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
  return (
    <FormScreen title={messages.title} icon={IconInfo} variant='white'>
      <View style={styles.content}>
        <TextField
          name='isrc'
          label={messages.isrc}
          placeholder='CC-XXX-YY-NNNNN'
        />
        <TextField
          name='iswc'
          label={messages.iswc}
          placeholder='T-34524688-1'
        />
      </View>
    </FormScreen>
  )
}
