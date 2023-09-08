import { useState, useRef, ReactNode, useMemo } from 'react'

import {
  IconTwitterBird,
  IconInstagram,
  IconDonate,
  IconLink,
  IconTikTok
} from '@audius/stems'
import cn from 'classnames'

import Input from 'components/data-entry/Input'

import { Type, handleTypes } from './SocialLink'
import styles from './SocialLinkInput.module.css'

const sanitizeHandle = (handle: string) => {
  if (handle.startsWith('http')) {
    if (handle.includes('twitter')) {
      const split = handle.split('twitter.com/')[1]
      if (split) {
        return split.split('/')[0]
      }
    }
    if (handle.includes('instagram')) {
      const split = handle.split('instagram.com/')[1]
      if (split) {
        return split.split('/')[0]
      }
    }
    if (handle.includes('tiktok')) {
      const split = handle.split('tiktok.com/')[1]
      if (split) {
        return split.split('/')[0]
      }
    }
  }
  return handle
}

type SocialLinkInputProps = {
  type: Type
  className: string
  defaultValue: string
  onChange: (value: string) => void
  isDisabled?: boolean
  textLimitMinusLinks?: number
}

const SocialLinkInput = ({
  type,
  className,
  defaultValue,
  onChange,
  isDisabled = false,
  textLimitMinusLinks
}: SocialLinkInputProps) => {
  const [value, setValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const timeoutRef = useRef<any>()

  const inputRef = useRef()

  const isHandle = useMemo(() => handleTypes.includes(type), [type])

  const handleOnChange = (text: string) => {
    if (textLimitMinusLinks) {
      const textWithoutLinks = text.replace(/(?:https?):\/\/[\n\S]+/g, '')
      if (textWithoutLinks.length > textLimitMinusLinks) return
    }

    let sanitized: string
    if (isHandle) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (text.startsWith('@')) {
          setValue((value) => value.slice(1))
          onChange(value.slice(1))
        }
      }, 600)
      setValue(text)
      sanitized = sanitizeHandle(text)
      if (sanitized !== text) {
        setTimeout(() => {
          setValue(sanitized)
          onChange(sanitized)
        }, 300)
      }
    } else {
      sanitized = text
      setValue(sanitized)
    }
    onChange(sanitized)
  }

  const onFocus = () => {
    setFocused(true)
  }

  const onBlur = () => {
    setFocused(false)
  }

  let icon: ReactNode
  switch (type) {
    case Type.TWITTER:
      icon = <IconTwitterBird className={styles.icon} />
      break
    case Type.INSTAGRAM:
      icon = <IconInstagram className={styles.icon} />
      break
    case Type.TIKTOK:
      icon = <IconTikTok className={styles.icon} />
      break
    case Type.WEBSITE:
      icon = <IconLink className={styles.icon} />
      break
    case Type.DONATION:
      icon = <IconDonate className={styles.icon} />
      break
  }

  let placeholder = ''
  switch (type) {
    case Type.TWITTER:
      placeholder = 'Twitter Handle'
      break
    case Type.INSTAGRAM:
      placeholder = 'Instagram Handle'
      break
    case Type.TIKTOK:
      placeholder = 'TikTok Handle'
      break
    case Type.WEBSITE:
      placeholder = 'Website'
      break
    case Type.DONATION:
      placeholder = 'Donate'
      break
  }

  return (
    <div
      className={cn(styles.socialLinkInput, {
        [styles.focused]: focused,
        [styles.hasValue]: value
      })}
    >
      <div className={styles.icon}>{icon}</div>
      {isHandle && <span className={styles.at}>{'@'}</span>}
      <Input
        className={cn(styles.input, className, {
          [styles.handle]: isHandle,
          [styles.disabled]: isDisabled
        })}
        characterLimit={200}
        size='small'
        disabled={isDisabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={handleOnChange}
        onFocus={onFocus}
        onBlur={onBlur}
        inputRef={inputRef}
        value={value}
      />
    </div>
  )
}

export default SocialLinkInput
