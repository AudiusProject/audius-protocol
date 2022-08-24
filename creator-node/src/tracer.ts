import type {
  Span,
  SpanContext,
  SpanOptions,
  AttributeValue
} from '@opentelemetry/api'
import { trace, context, SpanStatusCode } from '@opentelemetry/api'

import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import {
  SemanticAttributes,
  SemanticResourceAttributes as ResourceAttributesSC
} from '@opentelemetry/semantic-conventions'
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { BunyanInstrumentation } from '@opentelemetry/instrumentation-bunyan'

const SERVICE_NAME = 'content-node'

/**
 * Initializes a tracer for content node as well as registers import instrumentions
 * for packages that are frequently used
 */
export const setupTracing = () => {
  /**
   * A Tracer Provider is a factory for Tracers.
   * A Tracer Provider is initialized once and its lifecycle matches the application’s lifecycle.
   * Tracer Provider initialization also includes Resource and Exporter initialization.
   * It is typically the first step in tracing with OpenTelemetry.
   */
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ResourceAttributesSC.SERVICE_NAME]: SERVICE_NAME
    })
  })
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      // This reads and writes the appropriate opentelemetry headers to requests
      new HttpInstrumentation(),

      // Adds spans to express routes
      new ExpressInstrumentation(),

      // Adds spans to redis operations
      new RedisInstrumentation(),

      // Injects traceid, spanid, and SpanContext into bunyan logs
      new BunyanInstrumentation({
        // Adds a hook to logs that injects more span info
        // and the service name into logs
        logHook: (span, record) => {
          record['resource.span'] = span
          record['resource.service.name'] =
            provider.resource.attributes['service.name']
        }
      })
    ]
  })

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register()
}

/**
 * Higher-order function that adds opentelemetry tracing to a function.
 * Usage of this would look like
 * ```
 * const someFunction = instrumentTracing({ fn: _someFunction })
 * ```
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
    const wrapper = tracing
      .getTracer()
      .startActiveSpan(spanName, spanOptions, (span: Span) => {
        try {
          tracing.setSpanAttribute(tracing.CODE_FUNCTION, fn.name)

          // TODO: add skip parameter to instrument testing function to NOT logo certain args
          // tracing.setSpanAttribute('args', JSON.stringify(args))
          const result = fn.apply(this, args)
          if (result && result.then) {
            return result.then((val: any) => {
              span.end()
              return val
            })
          }

          span.end()
          return result
        } catch (e: any) {
          tracing.recordException(e)
          span.end()
          throw e
        }
      })

    // copy function name
    Object.defineProperty(wrapper, 'name', { value: fn.name })
    return wrapper
  }
}

/**
 * Namespace to store tracing helper function
 */
export const tracing = {
  CODE_FILEPATH: SemanticAttributes.CODE_FILEPATH,
  CODE_FUNCTION: SemanticAttributes.CODE_FUNCTION,
  SpanStatusCode: SpanStatusCode,

  /**
   * A Tracer creates spans containing more information about what is happening
   * for a given operation, such as a request in a service.
   * Tracers are created from Tracer Providers.
   *
   * This function fetches the tracer from the application context
   * @returns {Tracer} the tracer for content node
   */
  getTracer: () => {
    return trace.getTracer(SERVICE_NAME)
  },

  /**
   * Helper function that gets the current active span or return `undefined` if there is no active span
   */
  getActiveSpan: (): Span | undefined => {
    return trace.getSpan(context.active())
  },

  setSpanAttribute: (name: string, value: AttributeValue) => {
    const span = tracing.getActiveSpan()
    span?.setAttribute(name, value)
  },

  info: (msg: string) => {
    const span = tracing.getActiveSpan()
    span?.addEvent(msg, {
      'log.severity': 'info'
    })
  },

  warn: (msg: string) => {
    const span = tracing.getActiveSpan()
    span?.addEvent(msg, {
      'log.severity': 'warn'
    })
  },

  error: (msg: string) => {
    const span = tracing.getActiveSpan()
    span?.setStatus({ code: SpanStatusCode.ERROR, message: msg })
    span?.addEvent(msg, {
      'log.severity': 'error'
    })
  },

  recordException: (error: Error) => {
    const span = tracing.getActiveSpan()
    span?.recordException(error)
    span?.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
  },

  /**
   * Fetches the current span context if in an active span
   * @returns {SpanContext | undefined} the current span context if in a span
   */
  currentSpanContext: (): SpanContext | undefined => {
    const span = tracing.getActiveSpan()
    return span?.spanContext()
  }
}

module.exports = {
  setupTracing,
  instrumentTracing,
  tracing
}
