import { Nullable } from '@audius/common/utils'
import { advancedAlbumMessages as messages } from '@audius/common/messages'
import { Flex, IconIndent, IconInfo, Text } from '@audius/harmony'
import { useField } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { Tooltip } from 'components/tooltip'

type AdvancedAlbumFieldValues = {
  upc: Nullable<string>
}

const advancedSchema = z.object({
  upc: z
    .string()
    .regex(/^\d{12}$/, messages.upcInputError)
    .nullable()
})

export const AdvancedAlbumField = () => {
  const [{ value: upc }, , { setValue }] = useField('upc')

  return (
    <ContextualMenu
      icon={<IconIndent />}
      label={messages.title}
      description={messages.description}
      initialValues={{ upc }}
      validationSchema={toFormikValidationSchema(advancedSchema)}
      onSubmit={(values: AdvancedAlbumFieldValues) => {
        const { upc } = values
        setValue(upc)
      }}
      renderValue={() =>
        upc ? <SelectedValue label={`${messages.upcValue} ${upc}`} /> : null
      }
      menuFields={
        <Flex direction='column' gap='l'>
          <Flex gap='s' alignItems='center'>
            <Text variant='title' size='l'>
              {messages.upcTitle}
            </Text>
            <Tooltip text={messages.upcDescription} placement='bottom'>
              <IconInfo size='s' color='subdued' />
            </Tooltip>
          </Flex>
          <HarmonyTextField
            name='upc'
            label={messages.upcInputLabel}
            transformValueOnChange={(value) => value.replace(/\D/g, '')}
            maxLength={12}
          />
        </Flex>
      }
    />
  )
}
