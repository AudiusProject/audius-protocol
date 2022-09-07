import type { Span, SpanOptions } from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";
import { SemanticAttributes } from "@opentelemetry/semantic-conventions";
import {
  InstrumentationBase,
  InstrumentationConfig,
  InstrumentationNodeModuleDefinition,
} from "@opentelemetry/instrumentation";

import type * as AudiusSdk from "@audius/sdk";
import type { Track } from "@audius/sdk/dist/api/Track";

const VERSION = "0.0.1";

export class InstrumentationAudius extends InstrumentationBase {
  constructor(config: InstrumentationConfig = {}) {
    super("InstrumentationAudius", VERSION, config);
  }

  /**
   * Init method will be called when the plugin is constructed.
   * It returns an `InstrumentationNodeModuleDefinition` which describes
   *   the node module to be instrumented and patched.
   * It may also return a list of `InstrumentationNodeModuleDefinition`s if
   *   the plugin should patch multiple modules or versions.
   */
  protected init() {
    const module = new InstrumentationNodeModuleDefinition<typeof AudiusSdk>(
      "@audius/sdk",
      ["^1.*"],
      this._onPatchAudiusSdk,
      this._onUnPatchAudiusSdk
    );

    return module;
  }

  private _onPatchAudiusSdk(moduleExports: typeof AudiusSdk) {
    // Patch UploadTrack
    if (moduleExports.libs.Track) {
      this._wrap(
        moduleExports.libs.Track,
        "uploadTrack",
        this._patchUploadTrack()
      );
    }
    return moduleExports;
  }

  private _onUnPatchAudiusSdk(moduleExports: typeof AudiusSdk) {
    // Unpatch Upload Track
    if (moduleExports.libs.Track) {
      this._unwrap(moduleExports.libs.Track, "uploadTrack");
    }
  }

  private _patchUploadTrack(): (original: Track['uploadTrack']) => any {
    const instrumentation = this;
    return function uploadTrack(original) {
      return function patchUploadTrack(
        this: any
      ): ReturnType<Track["uploadTrack"]> {
        return instrumentation._instrumentedFunction({
          name: "uploadTrack",
          fn: original,
          objectContext: this,
          args: arguments,
        });
      };
    };
  }

  private _instrumentedFunction<TFunction extends (...args: any[]) => any>({
    fn,
    name,
    options,
    objectContext,
    args,
  }: {
    fn: TFunction;
    objectContext: Object;
    args: IArguments;
    name?: string;
    options?: SpanOptions;
  }): ReturnType<TFunction> {
    const spanName = name || fn.name;
    const spanOptions = options || {};
    return this.tracer.startActiveSpan(spanName, spanOptions, (span: Span) => {
      try {
        span.setAttribute(SemanticAttributes.CODE_FUNCTION, fn.name);

        // TODO add skip parameter to instrument testing function to NOT log certain args
        // tracing.setSpanAttribute('args', JSON.stringify(args))
        const result = fn.apply(objectContext, args);

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
            span.end();
            return val;
          });
        }

        span.end();

        // re-return result from synchronous function
        return result;
      } catch (e: any) {
        span.recordException(e);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: e.message,
        });
        span.end();

        // rethrow any errors
        throw e;
      }
    });
  }
}
