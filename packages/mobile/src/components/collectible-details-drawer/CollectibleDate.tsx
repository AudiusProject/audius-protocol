import { formatDateWithTimezoneOffset } from '@audius/common/utils'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  dateWrapper: {
    flexDirection: 'row',
    marginTop: spacing(2),
    marginBottom: spacing(5)
  },
  date: {
    marginHorizontal: spacing(2)
  }
}))

type CollectibleDateProps = {
  date: string
  label: string
}

export const CollectibleDate = (props: CollectibleDateProps) => {
  const { date, label } = props
  const styles = useStyles()

  return (
    <View style={styles.dateWrapper}>
      <Text color='neutralLight4' weight='bold'>
        {label}
      </Text>
      <Text color='neutralLight2' style={styles.date}>
        {formatDateWithTimezoneOffset(date)}
      </Text>
    </View>
  )
}
