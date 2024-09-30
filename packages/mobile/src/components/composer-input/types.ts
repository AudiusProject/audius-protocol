import type { LinkEntity } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import type { EntityType } from '@audius/sdk'

import type { TextInputProps } from '../core'

export type ComposerInputProps = {
  messageId: number
  extraOffset?: number // Additional padding needed if screen header size changes
  entityId?: ID
  entityType?: EntityType
  onChange?: (value: string, linkEntities: LinkEntity[]) => void
  onSubmit?: (value: string, linkEntities: LinkEntity[]) => void
  presetMessage?: string
  isLoading?: boolean
} & Pick<
  TextInputProps,
  'maxLength' | 'placeholder' | 'onPressIn' | 'readOnly' | 'id'
>
