export const findAncestor = (el: Element, selector: string) => {
  if (el.closest) {
    return el.closest(selector)
  }
  // Fall back to just looping back through parents
  while (
    el.parentElement &&
    // @ts-ignore
    !(el.parentElement.matches || el.parentElement.matchesSelector).call(
      el.parentElement,
      selector
    )
  ) {
    el = el.parentElement
  }
  return el
}
