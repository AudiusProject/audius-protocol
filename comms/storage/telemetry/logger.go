package telemetry

import (
	"context"
	"io"
	"os"
	"strings"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/exp/slog"
)

const TraceIDKey = "trace_id"

// Option is an application option.
type Option func(o *options)

type HandlerOptions struct {
	DisableSource bool
	FullSource    bool
	DisableTime   bool
}

// options is an application options.
type options struct {
	HandlerOptions

	Level   string // debug, info, warn, error
	Format  string // json, text
	Output  string // stdout, stderr, discard, or a file path
	Tracing bool   // enable tracing feature
}

type TracingHandler struct {
	handler slog.Handler
}

func InitDefault() {
	slog.SetDefault(slog.New(NewTracingHandler(NewHandler(&options{Level: "info", Output: "stdout"}))))
}

// New create a new *slog.Logger with tracing handler wrapper
func New(opts ...Option) *slog.Logger {
	options := &options{
		HandlerOptions: HandlerOptions{
			DisableSource: false,
			FullSource:    false,
			DisableTime:   false,
		},
		Level:  "info",
		Format: "json",
		Output: "stderr",
	}
	for _, o := range opts {
		o(options)
	}

	h := NewHandler(options)
	if options.Tracing {
		h = NewTracingHandler(h)
	}
	return slog.New(h)
}

func WithDisableSource() Option {
	return func(o *options) { o.DisableSource = true }
}

func WithFullSource() Option {
	return func(o *options) { o.FullSource = true }
}

func WithDisableTime() Option {
	return func(o *options) { o.DisableTime = true }
}

func WithLevel(level string) Option {
	return func(o *options) {
		if level == "" {
			level = "info"
		}
		o.Level = level
	}
}

func WithFormat(format string) Option {
	return func(o *options) {
		if format == "" {
			format = "json"
		}
		o.Format = format
	}
}

func WithOutput(output string) Option {
	return func(o *options) {
		if output == "" {
			output = "stderr"
		}
		o.Output = output
	}
}

func WithTracing() Option {
	return func(o *options) { o.Tracing = true }
}

func NewHandler(options *options) slog.Handler {
	var w io.Writer
	switch options.Output {
	case "stdout":
		w = os.Stdout
	case "stderr":
		w = os.Stderr
	case "discard":
		w = io.Discard
	default:
		var err error
		w, err = os.OpenFile(options.Output, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
		if err != nil {
			slog.Error("failed to open log file, fallback to stderr", err)
			w = os.Stderr
		}
	}

	var theLevel slog.Level
	switch options.Level {
	case "debug":
		theLevel = slog.LevelDebug
	case "info":
		theLevel = slog.LevelInfo
	case "warn":
		theLevel = slog.LevelWarn
	case "error":
		theLevel = slog.LevelError
	default:
		theLevel = slog.LevelInfo
	}

	lvl := &slog.LevelVar{}
	lvl.Set(theLevel)

	h := NewHandlerOptions(lvl, &options.HandlerOptions)
	var th slog.Handler
	switch options.Format {
	case "text":
		th = h.NewTextHandler(w)
	case "json":
		fallthrough
	default:
		th = h.NewJSONHandler(w)
	}
	return th
}

func NewHandlerOptions(level slog.Leveler, opt *HandlerOptions) slog.HandlerOptions {
	ho := slog.HandlerOptions{
		AddSource: !opt.DisableSource,
		Level:     level,
	}

	if !opt.DisableTime && (opt.FullSource || opt.DisableSource) {
		return ho
	}

	ho.ReplaceAttr = func(groups []string, a slog.Attr) slog.Attr {
		if opt.DisableTime {
			if a.Key == slog.TimeKey {
				// Remove time from the output.
				return slog.Attr{}
			}
		}

		// handle short source file location
		if !opt.DisableSource && !opt.FullSource {
			if a.Key == slog.SourceKey {

				file := a.Value.String()
				short := file

				// using short file like stdlog
				// for i := len(file) - 1; i > 0; i-- {
				// 	if file[i] == '/' {
				// 		short = file[i+1:]
				// 		break
				// 	}
				// }

				// zap like short file
				// https://github.com/uber-go/zap/blob/a55bdc32f526699c3b4cc51a2cc97e944d02fbbf/zapcore/entry.go#L102-L136
				idx := strings.LastIndexByte(file, '/')
				if idx > 0 {
					// Find the penultimate separator.
					idx = strings.LastIndexByte(file[:idx], '/')
					if idx > 0 {
						short = file[idx+1:]
					}
				}

				file = short
				return slog.Attr{
					Key:   slog.SourceKey,
					Value: slog.StringValue(file),
				}
			}
		}

		return a
	}
	return ho
}

func NewTracingHandler(h slog.Handler) *TracingHandler {
	// avoid chains of TracingHandlers.
	if lh, ok := h.(*TracingHandler); ok {
		h = lh.Handler()
	}
	return &TracingHandler{h}
}

// Enabled implements Handler.Enabled by reporting whether
// level is at least as large as h's level.
func (h *TracingHandler) Enabled(c context.Context, level slog.Level) bool {
	return h.handler.Enabled(c, level)
}

// Handle implements Handler.Handle.
func (h *TracingHandler) Handle(r slog.Record) error {
	span := trace.SpanFromContext(r.Context)
	if span.IsRecording() {
		if r.Level >= slog.LevelError {
			span.SetStatus(codes.Error, r.Message)
		}
		if spanCtx := span.SpanContext(); spanCtx.HasTraceID() {
			// With() lost attrs bug has been fixed
			// see https://github.com/golang/go/discussions/54763#discussioncomment-4504780
			// and https://go.dev/cl/459615
			r.AddAttrs(slog.String(TraceIDKey, spanCtx.TraceID().String()))
			// do NOT using h.handler = h.handler.WithAttrs, will get duplicated trace_id
			// h.handler = h.handler.WithAttrs([]slog.Attr{slog.String(TraceIDKey, traceID)})
		}
	}
	return h.handler.Handle(r)
}

// WithAttrs implements Handler.WithAttrs.
func (h *TracingHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return NewTracingHandler(h.handler.WithAttrs(attrs))
}

// WithGroup implements Handler.WithGroup.
func (h *TracingHandler) WithGroup(name string) slog.Handler {
	return NewTracingHandler(h.handler.WithGroup(name))
}

// Handler returns the Handler wrapped by h.
func (h *TracingHandler) Handler() slog.Handler {
	return h.handler
}
