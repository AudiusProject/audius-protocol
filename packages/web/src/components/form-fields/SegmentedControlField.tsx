import { SegmentedControl, SegmentedControlProps } from '@audius/harmony'
import { useField } from 'formik'
import { SetRequired } from 'type-fest'

type SegmentedControlFieldProps = SetRequired<
  Partial<SegmentedControlProps<any>>,
  'options'
> & {
  name: string
}

export const SegmentedControlField = (props: SegmentedControlFieldProps) => {
  const { name, ...other } = props
  const [{ value, ...field }, , { setValue }] = useField(name)

  return (
    <SegmentedControl
      onSelectOption={(value) => {
        setValue(value)
      }}
      selected={value}
      {...field}
      {...other}
    />
  )
}
