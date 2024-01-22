import { ChangeEvent, useCallback } from 'react'

import { Text } from '@audius/harmony'

type EditableLabelProps = {
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
  value: string
  setValue: (value: string) => void
  onSave?: () => void
}

export const EditableLabel = ({
  isEditing,
  setIsEditing,
  value,
  setValue,
  onSave
}: EditableLabelProps) => {
  const handleBlur = useCallback(() => {
    setIsEditing(false)
    onSave?.()
  }, [setIsEditing, onSave])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue]
  )

  if (isEditing) {
    return (
      <input
        defaultValue={value}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{ flex: '1 1 0', border: 'none', background: 'none' }}
        autoFocus
      />
    )
  }
  return (
    <Text size='s' css={{ flex: '1 1 0' }}>
      {value}
    </Text>
  )
}
