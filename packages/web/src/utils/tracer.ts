import type { Tracer } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { Resource } from '@opentelemetry/resources'
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  ConsoleSpanExporter
} from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { SemanticResourceAttributes as ResourceAttributesSC } from '@opentelemetry/semantic-conventions'

const SERVICE_NAME = 'web-client'

const TRACING_ENABLED = true
const OTEL_COLLECTOR_URL =
  'https://opentelemetry-collector.staging.audius.co/v1/traces'

/**
 * Initializes a tracer for content node as well as registers instrumentions
 * for packages that are frequently used
 * WARNING: this function should be run before any other imports
 * i.e.
 * ```
 * import { setupTracing } from './tracer'
 * setupTracing()
 * // all other imports
 * import { foo } from 'bar'
 * import { isEven } from 'pg'
 * ```
 */
export const setupTracing = () => {
  // If tracing isn't enabled, we don't set up the trace provider
  // or register any instrumentations. This won't cause any errors
  // as methods like `span.startActiveTrace()` or `tracing.recordException()`
  // will just silently do nothing.
  if (!TRACING_ENABLED) return

  const provider = new WebTracerProvider({
    resource: new Resource({
      [ResourceAttributesSC.SERVICE_NAME]: SERVICE_NAME
    })
  })
  const exporter = new OTLPTraceExporter({
    url: OTEL_COLLECTOR_URL
  })
  provider.addSpanProcessor(new BatchSpanProcessor(exporter))
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))

  provider.register({
    // Changing default contextManager to use ZoneContextManager - supports asynchronous operations - optional
    contextManager: new ZoneContextManager()
  })

  // Registering instrumentations
  registerInstrumentations({
    instrumentations: [
      new UserInteractionInstrumentation(),
      new XMLHttpRequestInstrumentation(),
      new FetchInstrumentation(),
      new DocumentLoadInstrumentation()
    ]
  })
}

export const tracing = {
  /**
   * A Tracer creates spans containing more information about what is happening
   * for a given operation, such as a request in a service.
   * Tracers are created from Tracer Providers.
   *
   * This function fetches the tracer from the application context
   * @returns {Tracer} the tracer for content node
   */
  getTracer: (): Tracer => {
    return trace.getTracer(SERVICE_NAME)
  }
}
