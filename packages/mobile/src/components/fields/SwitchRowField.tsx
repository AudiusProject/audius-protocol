import { useField } from 'formik'
import type { ViewStyle } from 'react-native'

import { Divider, Flex, Text } from '@audius/harmony-native'
import { Switch } from 'app/components/core'

type SwitchRowFieldProps = {
  name: string
  label: string
  description?: string
  style?: ViewStyle
}

export const SwitchRowField = (props: SwitchRowFieldProps) => {
  const { name, label, description } = props
  const [{ value }, , { setValue }] = useField(name)

  return (
    <>
      <Divider />
      <Flex column p='xl' w='100%'>
        <Flex gap='l' row justifyContent='space-between' alignItems='center'>
          <Text variant='title' strength='weak' size='l'>
            {label}
          </Text>
          <Switch value={value} onValueChange={setValue} />
        </Flex>
        {description ? <Text>{description}</Text> : null}
      </Flex>
    </>
  )
}
