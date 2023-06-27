export const getScrollParent = (node) => {
  const regex = /(auto|scroll)/
  const parents = (_node, ps) => {
    if (_node.parentNode === null) {
      return ps
    }
    return parents(_node.parentNode, ps.concat([_node]))
  }

  const style = (_node, prop) =>
    getComputedStyle(_node, null).getPropertyValue(prop)
  const overflow = (_node) =>
    style(_node, 'overflow') +
    style(_node, 'overflow-y') +
    style(_node, 'overflow-x')
  const scroll = (_node) => regex.test(overflow(_node))

  /* eslint-disable consistent-return */
  const scrollParent = (_node) => {
    if (!(_node instanceof HTMLElement || _node instanceof SVGElement)) {
      return
    }

    const ps = parents(_node.parentNode, [])

    for (let i = 0; i < ps.length; i += 1) {
      if (scroll(ps[i])) {
        return ps[i]
      }
    }

    return document.scrollingElement || document.documentElement
  }

  return scrollParent(node)
  /* eslint-enable consistent-return */
}
