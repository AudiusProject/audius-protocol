import { Nullable } from '@audius/common/utils'
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

const messages = {
  title: 'Advanced',
  description:
    'Provide detailed metadata to help identify and manage your music.',
  value: 'UPC',
  menuLabel: 'UPC (Universal Product Code)',
  menuLabelDescription:
    'A Universal Product Code (UPC) is a unique barcode that identifies music releases.',
  inputLabel: 'UPC',
  inputError: 'Invalid UPC'
}

type AdvancedAlbumFieldValues = {
  upc: Nullable<string>
}

const advancedSchema = z.object({
  upc: z
    .string()
    .regex(/^\d{12}$/, messages.inputError)
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
        upc ? <SelectedValue label={`${messages.value} ${upc}`} /> : null
      }
      menuFields={
        <Flex direction='column' gap='l'>
          <Flex gap='s' alignItems='center'>
            <Text variant='title' size='l'>
              {messages.menuLabel}
            </Text>
            <Tooltip text={messages.menuLabelDescription} placement='bottom'>
              <IconInfo size='s' color='subdued' />
            </Tooltip>
          </Flex>
          <HarmonyTextField
            name='upc'
            label={messages.inputLabel}
            transformValueOnChange={(value) => value.replace(/\D/g, '')}
            maxLength={12}
          />
        </Flex>
      }
    />
  )
}
