import { select, take } from 'typed-redux-saga'

export function* monitorSelector(
  selector: any,
  previousValue: any,
  takePattern = '*'
) {
  while (true) {
    const nextValue = yield* select(selector)
    if (nextValue !== previousValue) {
      return nextValue
    }
    yield* take(takePattern)
  }
}
