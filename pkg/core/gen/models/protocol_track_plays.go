// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"
	"strconv"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// ProtocolTrackPlays protocol track plays
//
// swagger:model protocolTrackPlays
type ProtocolTrackPlays struct {

	// plays
	Plays []*ProtocolTrackPlay `json:"plays"`
}

// Validate validates this protocol track plays
func (m *ProtocolTrackPlays) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validatePlays(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *ProtocolTrackPlays) validatePlays(formats strfmt.Registry) error {
	if swag.IsZero(m.Plays) { // not required
		return nil
	}

	for i := 0; i < len(m.Plays); i++ {
		if swag.IsZero(m.Plays[i]) { // not required
			continue
		}

		if m.Plays[i] != nil {
			if err := m.Plays[i].Validate(formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("plays" + "." + strconv.Itoa(i))
				} else if ce, ok := err.(*errors.CompositeError); ok {
					return ce.ValidateName("plays" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

// ContextValidate validate this protocol track plays based on the context it is used
func (m *ProtocolTrackPlays) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidatePlays(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *ProtocolTrackPlays) contextValidatePlays(ctx context.Context, formats strfmt.Registry) error {

	for i := 0; i < len(m.Plays); i++ {

		if m.Plays[i] != nil {

			if swag.IsZero(m.Plays[i]) { // not required
				return nil
			}

			if err := m.Plays[i].ContextValidate(ctx, formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("plays" + "." + strconv.Itoa(i))
				} else if ce, ok := err.(*errors.CompositeError); ok {
					return ce.ValidateName("plays" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

// MarshalBinary interface implementation
func (m *ProtocolTrackPlays) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *ProtocolTrackPlays) UnmarshalBinary(b []byte) error {
	var res ProtocolTrackPlays
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}