import { Button, Text } from '@audius/harmony'

import { getCopyableLink } from '../../util/shareUtil'

const messages = {
  listen: 'Listen on Audius'
}

const ListenOnAudiusCTA = ({ audiusURL }) => {
  const onClick = () => {
    window.open(getCopyableLink(audiusURL), '_blank')
  }

  return (
    <Button fullWidth onClick={onClick}>
      <Text variant='title' size='l'>
        {messages.listen}
      </Text>
    </Button>
  )
}

export default ListenOnAudiusCTA
