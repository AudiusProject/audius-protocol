/** @deprecated - Use SegmentedControl from Stems instead. */
import { createRef, Fragment, useState, useEffect, useRef } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'

import styles from './TabSlider.module.css'

const TabSlider = (props) => {
  const optionRefs = useRef(props.options.map((_) => createRef()))
  const [selected, setSelected] = useState(props.options[0].key)

  const selectedOption = props.selected || selected

  const onSetSelected = (option) => {
    // Call props function if controlled
    if (props.onSelectOption) props.onSelectOption(option)
    setSelected(option)
  }

  const [animatedProps, setAnimatedProps] = useSpring(() => ({
    to: { left: '0px', width: '0px' }
  }))

  useEffect(() => {
    let selectedRefIdx = props.options.findIndex(
      (option) => option.key === selectedOption
    )
    if (selectedRefIdx === -1) {
      selectedRefIdx = 0
    }

    const optionRef = optionRefs.current[selectedRefIdx].current

    if (optionRef) {
      const { clientWidth: width, offsetLeft: left } = optionRef
      setAnimatedProps({ to: { left: `${left}px`, width: `${width}px` } })
    }
  }, [
    props.options,
    selectedOption,
    props.selected,
    setAnimatedProps,
    selected,
    optionRefs
  ])

  return (
    <div
      className={cn(styles.tabs, props.className, {
        [styles.containerFullWidth]: !!props.fullWidth,
        [styles.isMobile]: props.isMobile
      })}>
      <animated.div className={styles.tabBackground} style={animatedProps} />
      {props.options.map((option, idx) => {
        return (
          <Fragment key={option.key}>
            <div
              ref={optionRefs.current[idx]}
              className={cn(styles.tab, {
                [styles.tabFullWidth]: !!props.fullWidth
              })}
              onClick={() => onSetSelected(option.key)}>
              {option.text}
            </div>
            <div
              className={cn(styles.separator, {
                [styles.invisible]:
                  // Hide separator right of the selected option
                  selectedOption === option.key ||
                  // Hide separator right of the last option
                  idx === props.options.length - 1 ||
                  // Hide separator right of an option if the next one is selected
                  selectedOption === props.options[idx + 1].key
              })}
            />
          </Fragment>
        )
      })}
    </div>
  )
}

TabSlider.propTypes = {
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  selected: PropTypes.any,
  onSelectOption: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.any,
      text: PropTypes.string
    })
  ).isRequired,
  isMobile: PropTypes.bool
}

export default TabSlider
