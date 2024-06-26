import { createRef, Fragment, useState, useRef, useEffect } from 'react'

import { ResizeObserver } from '@juggle/resize-observer'
import { useSpring, animated } from '@react-spring/web'
import cn from 'classnames'
import { mergeRefs } from 'react-merge-refs'
import useMeasure from 'react-use-measure'

import { Text } from 'components/text'

import styles from './SegmentedControl.module.css'
import { SegmentedControlProps } from './types'

/**
 * A hybrid somewhere between a button group, radio buttons, and tabs;
 * segmented controls are used to switch between different options or views.
 */
export const SegmentedControl = <T extends string>(
  props: SegmentedControlProps<T>
) => {
  const optionRefs = useRef(
    props.options.map((_) => createRef<HTMLLabelElement>())
  )
  const [selected, setSelected] = useState(props.options[0].key)
  const [maxOptionWidth, setMaxOptionWidth] = useState(0)

  const selectedOption = props.selected || selected

  const onSetSelected = (option: T) => {
    // Call props function if controlled
    if (props.onSelectOption) props.onSelectOption(option)
    setSelected(option)
  }

  const [tabProps, tabApi] = useSpring(() => ({
    to: { left: '0px', width: '0px' }
  }))

  useEffect(() => {
    setMaxOptionWidth(
      optionRefs.current.reduce((currentMax, ref) => {
        const rect = ref.current?.getBoundingClientRect()
        return Math.max(rect?.width ?? 0, currentMax)
      }, 0)
    )
  }, [])

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

    tabApi.start({
      to: { left: `${left}px`, width: `${width}px` }
    })
  }, [
    props.options,
    props.equalWidth,
    selectedOption,
    props.selected,
    tabApi,
    selected,
    optionRefs,
    bounds,
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
      <animated.div className={styles.tabBackground} style={tabProps} />
      {props.options.map((option, idx) => {
        const isOptionDisabled = props.disabled || option.disabled
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
                [styles.disabled]: !props.disabled && option.disabled,
                [styles.isMobile]: props.isMobile
              })}
              style={
                props.equalWidth && maxOptionWidth
                  ? { width: `${maxOptionWidth}px` }
                  : undefined
              }
            >
              {option.icon}
              <input
                type='radio'
                checked={option.key === selectedOption}
                onChange={() => {
                  onSetSelected(option.key)
                }}
                disabled={isOptionDisabled}
              />
              <Text
                variant='body'
                strength='strong'
                css={(theme) => ({ lineHeight: theme.typography.lineHeight.s })}
                color={
                  option.variant ?? (isOptionDisabled ? 'subdued' : 'default')
                }
              >
                {option.text}
              </Text>
            </label>
            {idx !== props.options.length - 1 ? (
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
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
