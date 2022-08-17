import type { Span, SpanOptions, SpanContext } from '@opentelemetry/api'
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
 * Helper function that gets the current active span or return `undefined` if there is no active span
 */
export const getActiveSpan = (): Span | undefined => {
  return trace.getSpan(context.active())
}

export const info = (msg: string) => {
  const span = getActiveSpan()
  span?.addEvent(msg, {
    'log.severity': 'info'
  })
}

export const warn = (msg: string) => {
  const span = getActiveSpan()
  span?.addEvent(msg, {
    'log.severity': 'warn'
  })
}

export const error = (msg: string) => {
  const span = getActiveSpan()
  span?.setStatus({ code: SpanStatusCode.ERROR, message: msg })
  span?.addEvent(msg, {
    'log.severity': 'error'
  })
}

export const recordException = (error: Error) => {
  const span = getActiveSpan()
  span?.recordException(error)
  span?.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
}

export const currentSpanContext = (): SpanContext | undefined => {
  const span = getActiveSpan()
  return span?.spanContext()
}

module.exports = {
  instrumentTracing,
  getActiveSpan,
  recordException,
  currentSpanContext,
  info,
  warn,
  error
}
