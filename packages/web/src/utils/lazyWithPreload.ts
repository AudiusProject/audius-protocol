import React, { ComponentType, LazyExoticComponent } from 'react'

type PreloadFactory<T extends ComponentType<any>> = () => Promise<{
  default: T
}>

type PreloadableLazyComponent<
  T extends ComponentType<any>
> = LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>
}

/**
 * Wraps a component with a lazy import and attaches a method `preload` which will
 * trigger preloading.
 * Example:
 * ```
 *  // Loads on command
 *  const MyComponent = lazyWithPreload(
 *    () => import("./MyComponent")
 *  )
 *  MyComponent.preload()
 *  return <MyComponent>
 *
 *  // Waits to load
 *  const MyComponent = lazyWithPreload(
 *    () => import("./MyComponent"),
 *    100
 *  )
 *  // 100ms later the component's js is loaded regardless of when it's rendered
 *  return <MyComponent>
 * ```
 */
export default function lazyWithPreload<T extends ComponentType<any>>(
  factory: PreloadFactory<T>,
  delay?: number
) {
  const LazyComponent = React.lazy(factory)
  const Component = LazyComponent as PreloadableLazyComponent<T>
  Component.preload = factory
  if (delay !== undefined) {
    setTimeout(() => Component.preload(), delay)
  }
  return Component
}
