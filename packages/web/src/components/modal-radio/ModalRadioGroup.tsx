import { ReactNode } from 'react'

type ModalRadioGroupProps = {
  items: ReactNode[]
}

export const ModalRadioGroup = ({ items }: ModalRadioGroupProps) => {
  return <div>{items.map((item) => item)}</div>
}
