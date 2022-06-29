export type SliderProps = {
  defaultValue?: number
  value: number
  max: number
  onChange: (val: number) => void
  showHandle?: boolean
}
