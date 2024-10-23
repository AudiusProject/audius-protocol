import type { LinkEntity } from '@audius/common/hooks'
import type { ID, UserMetadata } from '@audius/common/models'
import type { EntityType } from '@audius/sdk'
import type { TextInput, TextStyle, ViewStyle } from 'react-native'

import type { StylesProp } from 'app/styles'

import type { TextInputProps } from '../core'

export type ComposerInputProps = {
  messageId: number
  entityId?: ID
  entityType?: EntityType
  onChange?: (value: string, linkEntities: LinkEntity[]) => void
  onSubmit?: (value: string, mentionIds: ID[]) => void
  onAutocompleteChange?: (isActive: boolean, value: string) => void
  setAutocompleteHandler?: (handler: (user: UserMetadata) => void) => void
  presetMessage?: string
  isLoading?: boolean
  styles?: StylesProp<{
    container: ViewStyle
    input: TextStyle
  }>
  TextInputComponent?: typeof TextInput
} & Pick<
  TextInputProps,
  'maxLength' | 'placeholder' | 'onPressIn' | 'readOnly' | 'id' | 'onLayout'
>
