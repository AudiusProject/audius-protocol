package logger

import (
	"context"
	"log/slog"
	"os"
)

var ()

// Log handler specifically for CLI usage.
type CliHandler struct {
	handler slog.Handler
}

func NewCliHandler(h slog.Handler) *CliHandler {
	// Optimization: avoid chains of CliHandlers.
	if clih, ok := h.(*CliHandler); ok {
		h = clih.Handler()
	}
	return &CliHandler{
		handler: h,
	}
}

func (h *CliHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.handler.Enabled(ctx, level)
}

func (h *CliHandler) Handle(ctx context.Context, r slog.Record) error {
	if r.Level == slog.LevelError {
		// don't double-write error messages, cobra already handles that
		return nil
	}
	if _, err := os.Stderr.WriteString(r.Message + "\n"); err != nil {
		return err
	}
	return nil
}

func (h *CliHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return NewCliHandler(h.handler.WithAttrs(attrs))
}

func (h *CliHandler) WithGroup(name string) slog.Handler {
	return NewCliHandler(h.handler.WithGroup(name))
}

func (h *CliHandler) Handler() slog.Handler {
	return h.handler
}
