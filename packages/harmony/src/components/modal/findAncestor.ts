/**
 * Legacy browser support for `Element.closest`
 * @param el
 * @param selector query selector
 */
export const findAncestor = (el: Element | null, selector: string) => {
  if (el !== null && el.closest) {
    return el.closest(selector)
  }
  // Fall back to just looping back through parents
  while (
    (el = el?.parentElement ?? null) &&
    // @ts-ignore
    !(el.matches || el.matchesSelector).call(el, selector)
  );
  return el
}
