// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// ProtocolTransactionResponse protocol transaction response
//
// swagger:model protocolTransactionResponse
type ProtocolTransactionResponse struct {

	// transaction
	Transaction *ProtocolSignedTransaction `json:"transaction,omitempty"`

	// txhash
	Txhash string `json:"txhash,omitempty"`
}

// Validate validates this protocol transaction response
func (m *ProtocolTransactionResponse) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateTransaction(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *ProtocolTransactionResponse) validateTransaction(formats strfmt.Registry) error {
	if swag.IsZero(m.Transaction) { // not required
		return nil
	}

	if m.Transaction != nil {
		if err := m.Transaction.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("transaction")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("transaction")
			}
			return err
		}
	}

	return nil
}

// ContextValidate validate this protocol transaction response based on the context it is used
func (m *ProtocolTransactionResponse) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateTransaction(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *ProtocolTransactionResponse) contextValidateTransaction(ctx context.Context, formats strfmt.Registry) error {

	if m.Transaction != nil {

		if swag.IsZero(m.Transaction) { // not required
			return nil
		}

		if err := m.Transaction.ContextValidate(ctx, formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("transaction")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("transaction")
			}
			return err
		}
	}

	return nil
}

// MarshalBinary interface implementation
func (m *ProtocolTransactionResponse) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *ProtocolTransactionResponse) UnmarshalBinary(b []byte) error {
	var res ProtocolTransactionResponse
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}