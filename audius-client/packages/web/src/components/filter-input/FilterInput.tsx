import React from 'react'

import Input from 'antd/lib/input'

import { ReactComponent as IconFilter } from 'assets/img/iconFilter.svg'

import styles from './FilterInput.module.css'

type FilterInputProps = {
  placeholder: string
  onChange: (e: any) => void
  value: string
}

// Input component used for filtering content,
// e.g. filtering tracks on the favorites page.
const FilterInput = ({ placeholder, onChange, value }: FilterInputProps) => {
  return (
    <div className={styles.filterContainer}>
      <Input
        placeholder={placeholder}
        prefix={<IconFilter />}
        onChange={onChange}
        value={value}
      />
    </div>
  )
}

export default FilterInput
