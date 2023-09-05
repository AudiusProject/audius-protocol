// import { sdk } from '@audius/sdk'
// import { Track } from '@audius/sdk/src/api/Track'
// import * as theGoods from '@audius/sdk'
// import { sdk, TracksApi } from '@audius/sdk'
// import { AudiusLibs } from '@audius/sdk/dist/legacy'
// import * as LEGACY from '@audius/sdk/dist/legacy'
// import * as native from '@audius/sdk/dist/native-libs'
import * as common from '@audius/common'
import { Span, SpanOptions } from '@opentelemetry/api'
import {
  InstrumentationBase,
  InstrumentationConfig
} from '@opentelemetry/instrumentation'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'

const VERSION = '1.0.0'

export class AudiusWebInstrumentation extends InstrumentationBase {
  constructor(config: InstrumentationConfig = {}) {
    super('AudiusWebInstrumentation', VERSION, config)
  }

  private _patchAudiusBackend() {
    return (original: any): any => {
      const plugin = this
      return function patchAudiusBackend(this: any, ...args: any[]): void {
        const returnValue = original(...args)
        return {
          ...returnValue,
          uploadTrack: plugin.instrumentTracing({
            fn: returnValue.uploadTrack,
            context: this
          }),
          uploadTrackToCreatorNode: plugin.instrumentTracing({
            fn: returnValue.uploadTrackToCreatorNode,
            context: this
          }),
          fetchCID: plugin.instrumentTracing({
            fn: returnValue.fetchCID,
            context: this
          })
        }
      }
    }
  }

  //   private _patchUploadTrack() {
  //     return (original: any): any => {
  //       const plugin = this
  //       return function patchUploadTrack(this: any, ...args: any[]): void {
  //         const wrappedFunction = plugin.instrumentTracing({
  //           fn: original,
  //           context: this
  //         })
  //         return wrappedFunction(this, args)
  //       }
  //     }
  //   }

  /**
   * Higher-order function that adds opentelemetry tracing to a function.
   * This wrapper works for both sync and async functions
   *
   * @param {string?} param.name optional name to give to the span, defaults to the function name
   * @param {Object?} param.context optional object context to get wrapped, useful when wrapping non-static methods to classes
   * @param {TFunction} param.fn the generic function to instrument
   * @param {SpanOptions?} param.options objects to pass into the span
   * @returns the instrumented function
   * @throws rethrows any errors from the original fn
   *
   * Usage of this would look like
   * ```
   * const someFunction = instrumentTracing({ fn: _someFunction })
   * const result = someFunction(args))
   * // or
   * const result = await someFunction(args)
   * ```
   */
  private instrumentTracing = <TFunction extends (...args: any[]) => any>({
    name,
    context,
    fn,
    options
  }: {
    name?: string
    context?: Object
    fn: TFunction
    options?: SpanOptions
  }) => {
    const that = this
    const objectContext = context || this
    console.log('tracing')

    // build a wrapper around `fn` that accepts the same parameters and returns the same return type
    const wrapper = function (
      ...args: Parameters<TFunction>
    ): ReturnType<TFunction> {
      const spanName = name || fn.name
      const spanOptions = options || {}
      console.log('RUNNING')
      return that.tracer.startActiveSpan(
        spanName,
        spanOptions,
        (span: Span) => {
          try {
            span.setAttribute(SemanticAttributes.CODE_FUNCTION, fn.name)

            // TODO add skip parameter to instrument testing function to NOT log certain args
            // tracing.setSpanAttribute('args', JSON.stringify(args))
            const result = fn.apply(objectContext, args)

            // if `fn` is async, await the result
            if (result && result.then) {
              /**
               * by handling promise like this, the caller to this wrapper
               * can still use normal async/await syntax to `await` the result
               * of this wrapper
               * i.e. `const output = await instrumentTracing({ fn: _someFunction })(args)`
               *
               * based on this package: https://github.com/klny/function-wrapper/blob/master/src/wrapper.js#L25
               */
              return result.then((val: any) => {
                span.end()
                return val
              })
            }

            span.end()

            // re-return result from synchronous function
            return result
          } catch (e: any) {
            span.recordException(e)
            span.end()

            // rethrow any errors
            throw e
          }
        }
      )
    }
    // copy function name
    Object.defineProperty(wrapper, 'name', { value: fn.name })
    return wrapper
  }

  public async enable() {
    console.log('ENABLING INSTRUMENTATION')

    console.log('common', common)
    console.log('before', common.audiusBackend)
    const patchedFunction = this._patchAudiusBackend()
    console.log('patched', patchedFunction)
    // this._wrap(common, 'audiusBackend', this._patchAudiusBackend())
    Object.defineProperty(common, 'audiusBackend', patchedFunction)
    console.log('after', common.audiusBackend)
  }

  public disable() {
    // this._unwrap(Track!.prototype, 'uploadTrack')
  }
}
