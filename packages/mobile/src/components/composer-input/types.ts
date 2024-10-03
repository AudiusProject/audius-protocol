import type { LinkEntity } from '@audius/common/hooks'
import type { ID, UserMetadata } from '@audius/common/models'
import type { EntityType } from '@audius/sdk'
import type { TextStyle, ViewStyle } from 'react-native'

import type { StylesProp } from 'app/styles'

import type { TextInputProps } from '../core'

export type ComposerInputProps = {
  messageId: number
  entityId?: ID
  entityType?: EntityType
  onChange?: (value: string, linkEntities: LinkEntity[]) => void
  onSubmit?: (value: string, linkEntities: LinkEntity[]) => void
  onAutocompleteChange?: (isActive: boolean, value: string) => void
  setAutocompleteHandler?: (user: UserMetadata) => void
  presetMessage?: string
  isLoading?: boolean
  styles?: StylesProp<{
    container: ViewStyle
    input: TextStyle
  }>
} & Pick<
  TextInputProps,
  'maxLength' | 'placeholder' | 'onPressIn' | 'readOnly' | 'id'
>
