import { useEffect } from 'react'

import { size, throttle } from 'lodash'

export enum ModifierKeys {
  CMD = 0,
  CTRL = 1,
  SHIFT = 2,
  ALT = 3
}

type ModifierHandler = {
  cb: (e?: KeyboardEvent) => void
  or?: ModifierKeys[]
  and?: ModifierKeys[]
}

type Handler = (e?: KeyboardEvent) => void
export type Mapping = {
  [key: number]: Handler | ModifierHandler
}

/**
 * Checks whether the DOM is in a state where a global hotkey press is allowed.
 * For example, even if an anchor tag has focus, it should not prevent global hotkeys
 * from working.
 * @returns {boolean} whether or not a global hotkey press is allowed.
 */
function allowGlobalHotkeyPress() {
  return (
    document.activeElement &&
    (document.activeElement === document.body ||
      document.activeElement.nodeName === 'A' /* <a> */ ||
      document.activeElement.nodeName === 'BUTTON' /* <button> */ ||
      document.activeElement.getAttribute('role') === 'button')
  ) /* Lottie button */
}

function isModifierPressed(modifier: ModifierKeys, e: KeyboardEvent) {
  if (modifier === ModifierKeys.CMD) return e.metaKey
  if (modifier === ModifierKeys.CTRL) return e.ctrlKey
  if (modifier === ModifierKeys.SHIFT) return e.shiftKey
  if (modifier === ModifierKeys.ALT) return e.altKey
  return false
}

function fireHotkey(
  e: KeyboardEvent,
  mapping: Mapping,
  preventDefault: boolean
) {
  if (allowGlobalHotkeyPress() && e.keyCode in mapping) {
    if (size(mapping[e.keyCode]) > 1) {
      const cb = (mapping[e.keyCode] as ModifierHandler).cb
      const or = (mapping[e.keyCode] as ModifierHandler).or
      const and = (mapping[e.keyCode] as ModifierHandler).and

      let satisfiedOr = true
      if (or) {
        satisfiedOr = false
        or.forEach((modifier) => {
          if (isModifierPressed(modifier as ModifierKeys, e)) satisfiedOr = true
        })
      }

      let satisfiedAnd = true
      if (and) {
        and.forEach((modifier) => {
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
      ;(mapping[e.keyCode] as Handler)(e)
    }
  }
}

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
export function setupHotkeys(
  mapping: Mapping,
  throttleMs = 100,
  preventDefault = true
) {
  const hotkeyHook = (e: KeyboardEvent) => {
    fireHotkey(e, mapping, preventDefault)
  }
  const throttledHook = (e: KeyboardEvent) =>
    throttle(hotkeyHook, throttleMs, { leading: true })(e)
  document.addEventListener('keydown', throttledHook, false)
  return throttledHook
}

/**
 * Removes a hotkey event listener.
 * @param {function} hook the function hook returned by setupHotkeys.
 */
export function removeHotkeys(hook: (e: KeyboardEvent) => void) {
  document.removeEventListener('keydown', hook, false)
}

export const useHotkeys = (mapping: Mapping) => {
  useEffect(() => {
    const hook = setupHotkeys(mapping)
    return () => {
      removeHotkeys(hook)
    }
  }, [mapping])
}
