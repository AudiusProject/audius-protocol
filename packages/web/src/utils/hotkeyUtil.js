import { size, throttle } from 'lodash'

/**
 * Checks whether the DOM is in a state where a global hotkey press is allowed.
 * For example, even if an anchor tag has focus, it should not prevent global hotkeys
 * from working.
 * @returns {boolean} whether or not a global hotkey press is allowed.
 */
function allowGlobalHotkeyPress() {
  return (
    document.activeElement === document.body ||
    document.activeElement.nodeName === 'A' /* <a> */ ||
    document.activeElement.nodeName === 'BUTTON' /* <button> */ ||
    document.activeElement.getAttribute('role') === 'button'
  ) /* Lottie button */
}

function isModifierPressed(modifier, e) {
  if (modifier === ModifierKeys.CMD) return e.metaKey
  if (modifier === ModifierKeys.CTRL) return e.ctrlKey
  if (modifier === ModifierKeys.SHIFT) return e.shiftKey
  if (modifier === ModifierKeys.ALT) return e.altKey
  return false
}

function fireHotkey(e, mapping, preventDefault) {
  if (allowGlobalHotkeyPress() && e.keyCode in mapping) {
    if (size(mapping[e.keyCode]) > 1) {
      const cb = mapping[e.keyCode].cb
      const or = mapping[e.keyCode].or
      const and = mapping[e.keyCode].and

      let satisfiedOr = true
      if (or) {
        satisfiedOr = false
        or.forEach(modifier => {
          if (isModifierPressed(modifier, e)) satisfiedOr = true
        })
      }

      let satisfiedAnd = true
      if (and) {
        and.forEach(modifier => {
          if (!isModifierPressed(modifier, e)) satisfiedAnd = false
        })
      }

      if (satisfiedOr && satisfiedAnd) {
        if (preventDefault) e.preventDefault()
        cb(e)
      }
    } else {
      // If no modifier keys are required, fire the callback.
      if (preventDefault) e.preventDefault()
      mapping[e.keyCode](e)
    }
  }
}

export const ModifierKeys = Object.freeze({
  CMD: 0,
  CTRL: 1,
  SHIFT: 2,
  ALT: 3
})

/**
 * Sets up hotkeys for a component. Should generally be called in componentDidMount.
 * @param {function|Object} mapping the hotkey mapping keycodes to callback.
 * @param {Number} throttleMs the number of milliseconds to throttle keydown events with.
 * For example:
 *  setupHotkeys({32: this.playMusic})  // fires playMusic() on 'space'
 *
 * The mapping values may be an object with three fields:
 *  cb: the callback to fire
 *  or: modifier keys that must be OR'd with the hotkey
 *  and: modifier keys that must be AND'd with the hotkey
 *
 * For example:
 *  setupHotkeys({32: {cb: this.playMusic, or: [CMD, CTRL]})
 *    // fires on 'cmd+space' or 'ctrl+space'
 *  setupHotkeys({32: {cb: this.playMusic, and: [CMD, CTRL]})
 *    // fires on 'cmd+ctrl+space'
 *  setupHotkeys({32: {cb: this.playMusic, or: [ALT, CTRL], and: [CMD, SHIFT]})
 *    // fires on 'cmd+shift+alt+space' or 'cmd+shift+ctrl+space'\
 * @returns {function} the event listener function
 */
export function setupHotkeys(mapping, throttleMs = 100, preventDefault = true) {
  const hotkeyHook = e => {
    fireHotkey(e, mapping, preventDefault)
  }
  const throttledHook = e =>
    throttle(hotkeyHook, throttleMs, { leading: true })(e)
  document.addEventListener('keydown', throttledHook, false)
  return throttledHook
}

/**
 * Removes a hotkey event listener.
 * @param {function} hook the function hook returned by setupHotkeys.
 */
export function removeHotkeys(hook) {
  document.removeEventListener('keydown', hook, false)
}
