import { createRef, Fragment, useState, useRef, useEffect } from 'react'

import cn from 'classnames'
import { mergeRefs } from 'react-merge-refs'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'
import useMeasure, { RectReadOnly } from 'react-use-measure'

import styles from './SegmentedControl.module.css'
import { SegmentedControlProps } from './types'

/**
 * @deprecated use @audius/harmony SegmentedControl instead
 */
export const SegmentedControl = <T extends string>(
  props: SegmentedControlProps<T>
) => {
  const optionRefs = useRef(
    props.options.map((_) => createRef<HTMLLabelElement>())
  )
  const [selected, setSelected] = useState(props.options[0].key)

  const lastBounds = useRef<RectReadOnly>()
  const selectedOption = props.selected || selected

  const onSetSelected = (option: T) => {
    // Call props function if controlled
    if (props.onSelectOption) props.onSelectOption(option)
    setSelected(option)
  }

  const [animatedProps, setAnimatedProps] = useSpring(() => ({
    to: { left: '0px', width: '0px' }
  }))

  // Watch for resizes and repositions so that we move and resize the slider appropriately
  const [selectedRef, bounds] = useMeasure({
    offsetSize: true,
    polyfill: ResizeObserver
  })

  const [forceRefresh, setForceRefresh] = useState(false)
  useEffect(() => {
    setTimeout(() => {
      setForceRefresh(!forceRefresh)
    }, props.forceRefreshAfterMs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let selectedRefIdx = props.options.findIndex(
      (option) => option.key === selectedOption
    )
    if (selectedRefIdx === -1) selectedRefIdx = 0

    const { clientWidth: width, offsetLeft: left } = optionRefs.current[
      selectedRefIdx
    ]?.current ?? { clientWidth: 0, offsetLeft: 0 }

    setAnimatedProps({
      to: { left: `${left}px`, width: `${width}px` },
      immediate: bounds !== lastBounds.current // Don't animate on moves/resizes
    })
    lastBounds.current = bounds
  }, [
    props.options,
    selectedOption,
    props.selected,
    setAnimatedProps,
    selected,
    optionRefs,
    bounds,
    // Additional deps
    forceRefresh
  ])

  return (
    <div
      className={cn(styles.tabs, props.className, {
        [styles.containerFullWidth]: !!props.fullWidth,
        [styles.isMobile]: props.isMobile,
        [styles.disabled]: props.disabled
      })}
      role='radiogroup'
      aria-label={props.label}
      aria-labelledby={props['aria-labelledby']}
    >
      <animated.div className={styles.tabBackground} style={animatedProps} />
      {props.options.map((option, idx) => {
        return (
          <Fragment key={option.key}>
            <label
              ref={
                option.key === selectedOption
                  ? mergeRefs([optionRefs.current[idx], selectedRef])
                  : optionRefs.current[idx]
              }
              className={cn(styles.tab, {
                [styles.tabFullWidth]: !!props.fullWidth,
                [styles.isMobile]: props.isMobile
              })}
            >
              {option.icon}
              <input
                type='radio'
                checked={option.key === selectedOption}
                onChange={() => {
                  onSetSelected(option.key)
                }}
                disabled={props.disabled}
              />
              {option.text}
            </label>
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
