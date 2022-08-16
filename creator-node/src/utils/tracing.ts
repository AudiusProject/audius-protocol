import type { SpanOptions } from '@opentelemetry/api'
import { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { getTracer } from '../tracer'

type Fn<TArgs extends any[], TResult> = (...args: TArgs) => TResult;

export const instrumentTracing = <TArgs extends any[], TResult extends any>({ name, fn, options }: {
    name: string | undefined,
    fn: Fn<TArgs, TResult>,
    options: SpanOptions
}) => {
    return (...args: TArgs): TResult => {
        const spanName = name || fn.name
        return getTracer().startActiveSpan(spanName,
            options,
            span => {
                try {
                    span.setAttribute(SemanticAttributes.CODE_FUNCTION, fn.name);
                    span.setAttribute('args', JSON.stringify(args))
                    return fn(...args)
                } catch (e) {
                    span.recordException(e as Error)
                    span.setStatus({ code: SpanStatusCode.ERROR })
                    throw e
                } finally {
                    span.end()
                }
            }
        )
    }
}

module.exports = { instrumentTracing }
