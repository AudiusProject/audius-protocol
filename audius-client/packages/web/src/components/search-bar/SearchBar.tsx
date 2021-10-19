import React from 'react'

import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ReactComponent as IconSearch } from 'assets/img/iconSearch.svg'
import Status from 'common/models/Status'
import Tooltip from 'components/tooltip/Tooltip'
import { OpenSearchMessage } from 'services/native-mobile-interface/search'

import styles from './SearchBar.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

interface SearchBarProps {
  className?: string
  iconClassname?: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  value: string
  onSearch: (text: string) => void
  placeholder: string
  tooltipText?: string
  headerText?: string
  showHeader?: boolean
  beginSearch?: () => void
  closeOnBlur?: boolean
  status?: Status
  shouldAutoFocus?: boolean
}

const DetailIcon = ({
  isLoading,
  tooltipText
}: {
  isLoading: boolean
  tooltipText?: string
}) => {
  return isLoading ? (
    <div className={styles.spinnerContainer}>
      <Lottie
        options={{ loop: true, autoplay: true, animationData: loadingSpinner }}
      />
    </div>
  ) : (
    <Tooltip text={tooltipText || ''}>
      <IconSearch className={cn(styles.iconSearch)} />
    </Tooltip>
  )
}

const SearchBar = ({
  className,
  iconClassname,
  open,
  value,
  onOpen,
  onClose,
  onSearch,
  placeholder,
  tooltipText,
  headerText,
  showHeader = true,
  closeOnBlur = false,
  beginSearch = () => ({}),
  status = Status.SUCCESS,
  shouldAutoFocus = true
}: SearchBarProps) => {
  const onBlur = () => {
    if (closeOnBlur || value === '') {
      onClose()
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  const onClick = () => {
    if (NATIVE_MOBILE) {
      new OpenSearchMessage({ reset: true }).send()
    } else {
      if (open) {
        if (value.trimLeft() !== '') {
          beginSearch()
        } else {
          onSearch('')
          onClose()
        }
      } else {
        onOpen()
      }
    }
  }

  const handleKeyPress = ({ key }: React.KeyboardEvent<HTMLDivElement>) => {
    if (key === 'Enter' && value.trimLeft() !== '') beginSearch()
  }

  return (
    <div
      className={cn(styles.searchBar, className, {
        [styles.open]: open
      })}
    >
      {showHeader && <div className={styles.header}>{headerText || ''}</div>}
      <input
        autoFocus={open && shouldAutoFocus}
        className={styles.searchInput}
        placeholder={open ? placeholder : ''}
        value={open ? value : ''}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        onBlur={onBlur}
        {...(open ? {} : { disabled: true })}
      />
      <div
        className={cn(styles.searchWrapper, iconClassname, {
          [styles.native]: !!NATIVE_MOBILE
        })}
        onMouseDown={onClick}
      >
        <DetailIcon
          tooltipText={tooltipText}
          isLoading={status === Status.LOADING && open}
        />
      </div>
    </div>
  )
}

export default SearchBar
