import type {
  Span,
  SpanOptions,
  SpanContext,
  AttributeValue
} from '@opentelemetry/api'
import {
  trace,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  context,
  SpanStatusCode
} from '@opentelemetry/api'

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
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'

const SERVICE_NAME = 'content-node'

export const setupTracing = () => {
  // Not functionally required but gives some insight what happens behind the scenes
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ResourceAttributesSC.SERVICE_NAME]: SERVICE_NAME
    })
  })
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new RedisInstrumentation(),
      new PgInstrumentation(),
      new BunyanInstrumentation({
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
 * Higher-order function that adds opentelemetry tracing to a function
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
    return tracing
      .getTracer()
      .startActiveSpan(spanName, spanOptions, (span: Span) => {
        try {
          span.setAttribute(tracing.CODE_FUNCTION, fn.name)
          // TODO: add skip parameter to instrument testing function to NOT logo certain args
          // span.setAttribute('args', JSON.stringify(args))
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
 * Namespace to store tracing helper function
 */
export const tracing = {
  CODE_FILEPATH: SemanticAttributes.CODE_FILEPATH,
  CODE_FUNCTION: SemanticAttributes.CODE_FUNCTION,
  SpanStatusCode: SpanStatusCode,

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
