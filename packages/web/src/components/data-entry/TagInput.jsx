import { createRef, Component } from 'react'

import { trimToAlphaNumeric } from '@audius/common'
import { IconClose as IconRemove, IconSave } from '@audius/harmony'
import Tag from 'antd/lib/tag'
import cn from 'classnames'

import styles from './TagInput.module.css'

const isAlphaNumeric = (string) => {
  return /^[a-zA-Z0-9]+$/.test(string)
}

const isAlphaNumericKeyCode = (e) => {
  const char = String.fromCharCode(e.keyCode)
  if (e.shiftKey) {
    // Allow hashtags because we clean them up later.
    if (char === '3') {
      return true
    }
    return /[A-Z]/.test(char)
  }
  return /[A-Z0-9]/.test(char)
}

class TagInput extends Component {
  state = {
    tags: new Set(this.props.defaultTags),
    typingMode: false,
    flashExistingTag: null
  }

  newTagInputRef = createRef()

  componentDidUpdate = (prevProps, prevState) => {
    if (this.state.typingMode && this.newTagInputRef.current) {
      this.newTagInputRef.current.focus()
    }
    if (
      prevState.tags === this.state.tags &&
      prevProps.tags !== this.props.tags
    ) {
      this.setState({ tags: this.props.tags })
    }
  }

  setTypingMode = () => {
    this.setState({
      typingMode: true
    })
  }

  isValidTag = (tag) => {
    return (
      tag.length <= this.props.maxCharacters &&
      tag.length > this.props.minCharacters &&
      isAlphaNumeric(tag)
    )
  }

  formatTag = (tag) => {
    // Remove non-alpha numeric and hash tags.
    return trimToAlphaNumeric(tag)
  }

  addTag = (input) => {
    let tag = this.formatTag(input)
    if (tag.length > this.props.maxCharacters) {
      tag = tag.slice(0, this.props.maxCharacters)
    }
    if (this.isValidTag(tag)) {
      let flashExistingTag = null
      const newSet = new Set(this.state.tags)
      if (newSet.size < this.props.maxTags) {
        if (this.state.tags.has(tag)) {
          flashExistingTag = tag
          setTimeout(() => {
            this.setState({
              flashExistingTag: null
            })
          }, 200)
        }
        newSet.add(tag)
      }
      this.setState({
        tags: newSet,
        typingMode: newSet.size !== this.props.maxTags,
        flashExistingTag
      })
      this.props.onChangeTags(newSet)
      this.newTagInputRef.current.value = ''
    }
  }

  deleteTag = (tag, e) => {
    if (e) e.stopPropagation()
    const newTags = new Set(this.state.tags)
    newTags.delete(tag)
    this.setState({
      tags: newTags
    })
    this.props.onChangeTags(newTags)
  }

  onNewTagInputKeyPress = (e) => {
    const newTag = this.newTagInputRef.current.value.toLowerCase()
    if (
      e.keyCode === 13 /* enter */ ||
      e.keyCode === 9 /* tab */ ||
      e.keyCode === 188 /* comma */
    ) {
      e.preventDefault()
      this.addTag(newTag)
    } else if (e.keyCode === 8 /* backspace */ && newTag.length === 0) {
      const lastTag = [...this.state.tags.keys()].pop()
      this.deleteTag(lastTag)
    }

    if (
      // Don't allow typing past max characters.
      (newTag.length > this.props.maxCharacters - 1 && e.keyCode !== 8) ||
      // Allow only backspace and alpha-numeric
      (e.keyCode !== 8 /* backspace */ && !isAlphaNumericKeyCode(e))
    ) {
      e.preventDefault()
      return false
    }
  }

  onNewTagInputBlur = () => {
    const newTag = this.newTagInputRef.current.value.toLowerCase()
    this.addTag(newTag)
    this.setState({
      typingMode: false
    })
  }

  render() {
    const {
      placeholder,
      maxTags,
      label,
      labelStyle,
      size,
      layout,
      tags = this.state.tags,
      typingMode = this.state.typingMode,
      flashExistingTag = this.state.flashExistingTag,
      'aria-label': ariaLabel
    } = this.props

    const style = {
      [styles.horizontal]: layout === 'horizontal',
      [styles.vertical]: layout === 'vertical',
      [styles.normal]: size === 'normal',
      [styles.small]: size === 'small',
      [styles.focused]: typingMode
    }

    const tagNodes = [...tags].map((tag, i) => (
      <Tag
        className={cn(styles.tag, {
          [styles.flash]: flashExistingTag === tag,
          [styles.last]: i === tags.size - 1 && tags.size === maxTags
        })}
        key={tag}
        onClick={(e) => e.stopPropagation()}
      >
        {trimToAlphaNumeric(tag)}
        <div className={styles.tagIconWrapper}>
          <IconRemove
            onClick={(e) => this.deleteTag(tag, e)}
            className={styles.iconRemove}
          />
        </div>
      </Tag>
    ))

    const newTag = (
      <>
        {typingMode ? null : (
          <Tag
            className={cn(styles.tag, styles.newTag, styles.last)}
            onClick={this.setTypingMode}
          >
            {placeholder}
            <div className={styles.tagIconWrapper}>
              <IconSave className={styles.iconSave} />
            </div>
          </Tag>
        )}
        <input
          aria-label={ariaLabel}
          ref={this.newTagInputRef}
          className={cn(styles.newTagInput, {
            [styles.activeInput]: typingMode
          })}
          onKeyDown={this.onNewTagInputKeyPress}
          onBlur={this.onNewTagInputBlur}
        />
      </>
    )

    return (
      <div className={cn(styles.wrapper, style)}>
        {label ? (
          <div className={cn(styles.label, labelStyle)}>{label}</div>
        ) : null}
        <div className={styles.tagInput} onClick={this.setTypingMode}>
          {tagNodes}
          {tags.size < maxTags ? newTag : null}
          <div
            className={cn(styles.tagCount, {
              [styles.nearLimit]: tags.size > (7.0 / 8.0) * maxTags
            })}
          >
            {tags.size}/{maxTags}
          </div>
        </div>
      </div>
    )
  }
}

TagInput.defaultProps = {
  placeholder: 'new tag',
  defaultTags: [],
  maxTags: 10,
  maxCharacters: 25,
  minCharacters: 0,
  label: '',
  size: 'normal',
  layout: 'vertical',
  onChangeTags: (tag) => {}
}

export default TagInput
