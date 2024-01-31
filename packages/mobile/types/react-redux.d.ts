declare module 'react-redux' {
  declare type EqualityFn<T> = (a: T, b: T) => boolean
  export declare const useSelector: <
    TState = import('../src/store').AppState,
    Selected = unknown
  >(
    selector: (state: TState) => Selected,
    equalityFn?: EqualityFn<Selected> | undefined
  ) => Selected

  declare type Action = import('redux').Action
  declare type BasicAction = import('redux').Action
  declare type AnyAction = import('redux').AnyAction
  declare type Dispatch = import('redux').Dispatch
  declare type Store = import('redux').Store

  export declare const useDispatch: <
    AppDispatch extends Dispatch<AnyAction> = Dispatch<AnyAction>
  >() => AppDispatch

  declare type ProviderProps =
    import('../node_modules/react-redux').ProviderProps

  export declare function Provider<A extends Action = AnyAction, S = unknown>({
    store,
    context,
    children,
    serverState
  }: ProviderProps<A, S>): JSX.Element

  export interface TypedUseSelectorHook<TState> {
    <TSelected>(
      selector: (state: TState) => TSelected,
      equalityFn?: (left: TSelected, right: TSelected) => boolean
    ): TSelected
  }

  export declare type Selector<S, TProps, TOwnProps = null> = TOwnProps extends
    | null
    | undefined
    ? (state: S) => TProps
    : (state: S, ownProps: TOwnProps) => TProps

  export declare const useStore: <
    State = unknown,
    Action extends BasicAction<any> = AnyAction
  >() => Store<State, Action>

  export declare function shallowEqual(objA: any, objB: any): boolean
}
