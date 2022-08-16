import type { Span, SpanOptions } from '@opentelemetry/api'
import { trace, context, SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { getTracer } from '../tracer'

/**
 * Higher-order function that adds opentelemtry tracing to a function
 */
export const instrumentTracing = <TFunction extends (...args: any[]) => any>({
  name,
  fn,
  options
}: {
  name?: string
  fn: TFunction
  options?: SpanOptions
}) => {
  return (...args: Parameters<TFunction>): ReturnType<TFunction> => {
    const spanName = name || fn.name
    const spanOptions = options || {}
    return getTracer().startActiveSpan(spanName, spanOptions, (span: Span) => {
      try {
        span.setAttribute(SemanticAttributes.CODE_FUNCTION, fn.name)
        span.setAttribute('args', JSON.stringify(args))
        return fn(...args)
      } catch (e) {
        span.recordException(e as Error)
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw e
      } finally {
        span.end()
      }
    })
  }
}

/**
 * Helper function that adds tracing to an entire file's exports
 */
export const instrumentTracingAll = (
  obj: Record<string, CallableFunction>
): Record<string, CallableFunction> => {
  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      obj[key] = instrumentTracing({ fn: obj[key] } as any)
    }
  }

  return obj
}

/**
 * Helper function that gets the current active span or return `undefined` if there is no active span
 */
export const getActiveSpan = (): Span | undefined => {
  return trace.getSpan(context.active())
}

module.exports = {
  instrumentTracing,
  instrumentTracingAll,
  getActiveSpan
}
