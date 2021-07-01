import React, { useEffect, useRef } from 'react'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { drag, drop } from 'store/dragndrop/actions'

import styles from './Draggable.module.css'

const isFirefox = () => navigator.userAgent.includes('Firefox')

const Draggable = props => {
  const {
    elementType,
    isDisabled,
    text,
    kind,
    link,
    id,
    isOwner,
    drag,
    drop,
    onDrag,
    onDrop,
    children,
    forwardRef,
    ...otherProps // passed to child
  } = props
  const draggableRef = useRef()

  useEffect(() => {
    const dragStart = e => {
      drag(kind, id, isOwner)

      const dt = e.dataTransfer
      dt.effectAllowed = 'copy'

      // If we set the URL on firefox,
      // it forces a site refresh
      // on drop
      if (!isFirefox()) {
        dt.setData('text/uri-list', link)
        dt.setData('text/plain', link)
      }

      if (dt.setDragImage) {
        const wrapper = document.createElement('div')
        wrapper.setAttribute('id', 'ghost')

        const content = document.createElement('div')
        content.innerHTML = text

        wrapper.append(content)
        document.body.append(wrapper)

        dt.setDragImage(wrapper, 0, 0)
      }
      if (onDrag) onDrag()
    }

    const dragEnd = e => {
      document.getElementById('ghost').outerHTML = ''
      drop()
      if (onDrop) onDrop()
    }

    if (draggableRef.current) {
      draggableRef.current.addEventListener('dragstart', dragStart, false)
      draggableRef.current.addEventListener('dragend', dragEnd, false)
    }
  }, [drag, drop, id, kind, link, text, isOwner, onDrag, onDrop])

  const refFunc = ref => {
    draggableRef.current = ref
    if (forwardRef) {
      forwardRef(ref)
    }
  }

  return elementType === 'tr' ? (
    <tr
      draggable={!isDisabled}
      ref={refFunc}
      className={styles.draggable}
      {...otherProps}
    >
      {children}
    </tr>
  ) : (
    <div
      draggable={!isDisabled}
      ref={refFunc}
      className={styles.draggable}
      {...otherProps}
    >
      {children}
    </div>
  )
}

Draggable.propTypes = {
  elementType: PropTypes.oneOf(['div', 'tr']),
  isDisabled: PropTypes.bool,
  isOwner: PropTypes.bool,
  text: PropTypes.string,
  link: PropTypes.string,
  kind: PropTypes.oneOf(['track', 'album', 'playlist', 'library-playlist']),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // One of trackId, collectionId, userId
  children: PropTypes.element,
  onDrag: PropTypes.func,
  onDrop: PropTypes.func
}

Draggable.defaultProps = {
  elementType: 'div',
  text: 'Untitled',
  link: 'https://audius.co'
}

const mapStateToProps = (state, props) => ({})
const mapDispatchToProps = dispatch => ({
  drag: (kind, id, isOwner) => dispatch(drag(kind, id, isOwner)),
  drop: () => dispatch(drop())
})

export default connect(mapStateToProps, mapDispatchToProps)(Draggable)
