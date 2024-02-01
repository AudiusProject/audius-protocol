import { Flex, Box, Divider, IconCopy } from '@audius/harmony'

import { Text } from 'components/typography'

import styles from './PrivateKeyExporterPage.module.css'

const messages = {
  advancedWalletDetails: 'Advanced Wallet Details'
}

type KeyProps = {
  label: string
  value: string
}

const Key = ({ label, value }: KeyProps) => {
  return (
    <Flex border='strong' css={{ borderWidth: 1 }}>
      <Box p='xl' css={{ width: 150 }}>
        <Text variant='title' color='neutralLight2'>
          {label}
        </Text>
      </Box>
      <Divider orientation='vertical' />
      <Box p='xl' css={{ width: 484 }}>
        <Text variant='body'>{value}</Text>
      </Box>
      <Divider orientation='vertical' />
      <Box p='xl' css={{ cursor: 'pointer', width: 64 }}>
        <IconCopy width={16} height={16} className={styles.copyIcon} />
      </Box>
    </Flex>
  )
}

type AdvancedWalletDetailsProps = {
  keys: KeyProps[]
}
export const AdvancedWalletDetails = ({ keys }: AdvancedWalletDetailsProps) => {
  return (
    <Flex direction='column' gap='l' pv='xl'>
      <Text variant='title' color='neutralLight2'>
        {messages.advancedWalletDetails}
      </Text>
      <Text variant='body' color='neutralLight2'>
        This is your private key. Do not share this with anyone.
      </Text>
      {keys.map((key, i) => (
        <Key key={`key${i}`} {...key} />
      ))}
    </Flex>
  )
}
