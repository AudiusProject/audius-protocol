package registry_bridge

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/accounts"
)

// checks mainnet eth for itself, if registered and not
// already in the comet state will register itself on comet
func (r *Registry) RegisterSelf() error {
	web3 := r.contracts
	comet := r.rpc
	queries := r.queries

	delegatePrivateKey := r.config.DelegatePrivateKey
	pubKey, err := accounts.PrivKeyToPubKey(delegatePrivateKey)
	if err != nil {
		return fmt.Errorf("invalid privkey hex: %v", err)
	}

	return nil
}
