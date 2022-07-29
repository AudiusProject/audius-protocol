import { useState, useRef, useEffect } from 'react'

import cn from 'classnames'
import { debounce } from 'lodash'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getIsDragging } from 'store/dragndrop/selectors'

import styles from './Droppable.module.css'

const Droppable = (props) => {
  const droppableRef = useRef()
  const [hovered, setHovered] = useState(false)

  /**
   * Whether or not the currently dragged kind is accepted by this droppable.
   * Conditions include:
   * 1.) Must be accepted kind track/album/plylist
   * 2.) Must not be disabled
   * 3.) Either accept owner or the dragging entity if not owned by user
   */
  const canDrop =
    props.acceptedKinds.includes(props.dragging.kind) &&
    !props.disabled &&
    (props.acceptOwner || !props.dragging.isOwner)

  const dragEnter = (e) => {
    const dt = e.dataTransfer
    dt.dropEffect = 'copy'
    setHovered(true)
  }

  const dragLeave = (e) => {
    setHovered(false)
  }

  const drop = (e) => {
    if (props.stopPropogationOnDrop) {
      e.stopPropagation()
    }
    const id = props.dragging.id
    const kind = props.dragging.kind
    if (id) {
      props.onDrop(id, kind)
    }
    setHovered(false)
  }

  const debounceDrop = debounce(drop, 150, { leading: true })

  // When a new drag takes place, check if this droppable is appropriate and reattach
  // event listeners.
  useEffect(() => {
    const dragOver = (e) => {
      if (!hovered) setHovered(true)
      e.preventDefault()
    }

    // Need to grab currentRef because it can change
    // between initial run and cleanup
    const currentRef = droppableRef.current

    if (canDrop) {
      currentRef.addEventListener('dragenter', dragEnter, false)
      currentRef.addEventListener('dragleave', dragLeave, false)
      currentRef.addEventListener('dragover', dragOver, false)
      currentRef.addEventListener('drop', debounceDrop, false)
    }

    return () => {
      currentRef.removeEventListener('dragenter', dragEnter, false)
      currentRef.removeEventListener('dragleave', dragLeave, false)
      currentRef.removeEventListener('dragover', dragOver, false)
      currentRef.removeEventListener('drop', debounceDrop, false)
    }
  }, [props.dragging, canDrop, debounceDrop, hovered])

  return (
    <div
      ref={droppableRef}
      className={cn(styles.droppable, props.className, {
        [props.hoverClassName]: hovered && canDrop
      })}
    >
      {props.children}
    </div>
  )
}

Droppable.propTypes = {
  className: PropTypes.string,
  hoverClassName: PropTypes.string,
  onDrop: PropTypes.func,
  acceptedKinds: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  acceptOwner: PropTypes.bool,
  children: PropTypes.any,
  stopPropogationOnDrop: PropTypes.bool
}

Droppable.defaultProps = {
  onDrop: (id, kind) => {},
  acceptedKinds: ['track', 'album', 'playlist', 'library-playlist'],
  disabled: false,
  stopPropogationOnDrop: false,
  acceptOwner: true
}

const mapStateToProps = (state, props) => ({
  dragging: getIsDragging(state)
})
const mapDispatchToProps = (dispatch) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(Droppable)
