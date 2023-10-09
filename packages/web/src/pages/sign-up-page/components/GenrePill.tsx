import { InputHTMLAttributes } from 'react'

type GenrePillProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export const GenrePill = (props: GenrePillProps) => {
  const { label, ...other } = props
  return (
    <div>
      <label>
        <input {...other} type='checkbox' />
        {label}
      </label>
    </div>
  )
}
