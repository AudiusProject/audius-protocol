package result

import (
	"fmt"
	"log"

	"github.com/pkg/errors"
)

type Result[T any] struct {
	Value T
	Err error
}

// Create Result with Ok value
func Ok[T any](v T) Result[T] {
	return Result[T] {
		Value: v,
		Err: nil,
	}
}

// Create Result with Err value
func Err[T any](message string) Result[T] {
	var value T
	return Result[T] {
		Value: value,
		Err: errors.New(message),
	}
}

// Check if a result is Ok
func (r Result[T]) IsOk() bool {
	return r.Err == nil
}

// Check if a result is errored
func (r Result[T]) IsErr() bool {
	return r.Err != nil
}

// Return the `Value` or a default
func (r Result[T]) ValueOr(v T) T {
	if !r.IsOk() {
		return v
	}

	return r.Value
}

// Return the `Value` or fail
func (r Result[T]) ValueOrFail() T {
	if !r.IsOk() {
		log.Fatalf("failed with: (%+v)", r.Err)
	}

	return r.Value
}

// Return the `Value` or panic
func (r Result[T]) ValueOrPanic() T {
	if !r.IsOk() {
		panic(r.Err)
	}

	return r.Value
}

// Returns the contained Ok value, consuming the self value.
// Because this function may fail, its use is generally discouraged. 
// Instead, prefer to use pattern matching and handle the Err case explicitly.
func (r Result[T]) Expect(message string) T {
	if !r.IsOk() {
		panic(fmt.Sprintf("expectation failed: (%s) caused by (%+v)", message, r.Err))
	}

	return r.Value
}

func (r Result[T]) Unwrap() T {
	return r.ValueOrPanic()
}

// Monadic operations

// Map and then are actually the same function, different languages use different names for the same thing.
// Since this is an experimental implemenation, I will provide both names so we can decide which one to use
// There is some limitation to Golang's Generics at this moment, so we cannot havea a fully fledged Map functon
// like Haskell.
// This function has the following type signature in Haskell: (>>=) :: Maybe a -> (a -> Maybe b) -> Maybe b
// But in Golang, we currently do not support having another idependent type variable in method signature, so we are
// limited to use T here, but in reality we should have used func(T) Result[U] for type of f.
func (r Result[T]) Map(f func(T) Result[T]) Result[T] {
	if r.IsOk() {
		return f(r.Value)
	}
	return r
}

func (r Result[T]) Then(f func(T) Result[T]) Result[T] {
	return r.Map(f)
}

// Wraps the error with a custom message
func (r Result[T]) WrapErr(message string) Result[T] {
	if !r.IsOk() {
		r.Err = errors.Wrap(r.Err, message)
	}

	return r
}
