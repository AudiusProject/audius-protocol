import { useRef } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import { useTransition, animated, config } from 'react-spring'

import styles from './SignOnModal.module.css'

export const SignOnModal = (props) => {
  const contentRef = useRef()

  const transitions = useTransition(props.backgroundImage, (item) => item, {
    from: { opacity: props.animateImageIn ? 0 : 1 },
    enter: () => {
      if (contentRef.current) {
        contentRef.current.style.overflow = 'hidden'
      }
      return { opacity: 1 }
    },
    leave: { opacity: 0 },
    onRest: () => {
      if (contentRef.current) {
        contentRef.current.style.overflow = 'visible'
      }
    },
    config: config.molasses
  })

  return (
    <div className={cn(styles.modalContainer, props.containerStyles)}>
      <div
        ref={contentRef}
        className={cn(styles.contentContainer, props.contentStyles)}>
        {props.children}
      </div>
      <div className={cn(styles.imageContainer, props.imageContainerStyle)}>
        {props.callToActionImage && (
          <div className={styles.callToActionContainer}>
            <div
              style={{ backgroundImage: `url(${props.callToActionImage})` }}
              className={cn(styles.callToActionImage, props.callToActionStyles)}
            />
          </div>
        )}
        {transitions.map(({ item, props: animProps, key }) => {
          const interpolatedBackgroundImage = props.backgroundOverlayGradient
            ? `${props.backgroundOverlayGradient},url(${item})`
            : `url(${item})`

          return (
            <animated.div
              key={key}
              className={cn(styles.imageBackground, props.imageStyles, {
                [styles.hide]: !item
              })}
              style={{
                ...animProps,
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundImage: interpolatedBackgroundImage
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

SignOnModal.defaultProps = {
  backgroundImage: PropTypes.string,
  containerStyles: PropTypes.string,
  contentStyles: PropTypes.string,
  callToActionStyles: PropTypes.string,
  imageStyles: PropTypes.string,
  imageContainerStyle: PropTypes.string,
  transitionConfig: PropTypes.object,
  animateImageIn: PropTypes.bool
}

SignOnModal.defaultProps = {
  containerStyles: '',
  contentStyles: '',
  imageStyles: '',
  imageContainerStyle: '',
  animateImageIn: true
}

export default SignOnModal
