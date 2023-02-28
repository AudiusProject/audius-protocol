package telemetry

import (
	"context"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/exp/slog"
)

const TraceIDKey = "trace_id"

type TracingHandler struct {
	handler slog.Handler
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


