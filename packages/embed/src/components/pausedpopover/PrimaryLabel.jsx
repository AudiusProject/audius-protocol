import { Text } from '@audius/harmony'

const messages = {
  label: 'Looking for more like this?'
}

const PrimaryLabel = () => {
  return (
    <Text color='default' variant='heading' size='s'>
      {messages.label}
    </Text>
  )
}

export default PrimaryLabel
