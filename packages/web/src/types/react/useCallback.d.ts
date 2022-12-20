declare namespace React {
  /**
   * `useCallback` will return a memoized version of the callback that only changes if one of the `inputs`
   * has changed.
   *
   * @version 16.8.0
   * @see https://reactjs.org/docs/hooks-reference.html#usecallback
   */
  // A specific function type would not trigger implicit any.
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/52873#issuecomment-845806435 for a comparison between `Function` and more specific types.
  // tslint:disable-next-line ban-types
  function useCallback<T extends Function>(callback: T, deps: DependencyList): T
}
