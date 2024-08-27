// queries related to the registry bridge service
package registry_bridge

import (
	"errors"
	"fmt"
	"math/big"

	"github.com/AudiusProject/audius-protocol/core/common"
)

// gets the current registered nodes from the state
func (r *Registry) GetRegisteredNodes() (*DiscoveryNodes, *ContentNodes, error) {
	if len(r.state.discoveryNodes) == 0 {
		return nil, nil, errors.New("no discovery nodes registered")
	}

	if len(r.state.contentNodes) == 0 {
		return nil, nil, errors.New("no content nodes registered")
	}

	return &r.state.discoveryNodes, &r.state.contentNodes, nil
}

// queries ethereum for all the registered nodes and
// stores them into the state struct
func (r *Registry) updateRegisteredNodes() error {
	logger := r.logger

	stm, err := r.contracts.GetServiceTypeManagerContract()
	if err != nil {
		return fmt.Errorf("could not get service type manager contract: %v", err)
	}

	serviceTypes, err := stm.GetValidServiceTypes(nil)
	if err != nil {
		return fmt.Errorf("could not get valid service types: %v", err)
	}

	spf, err := r.contracts.GetServiceProviderFactoryContract()
	if err != nil {
		return fmt.Errorf("could not get service provider factory contract: %v", err)
	}

	for _, serviceType := range serviceTypes {
		nodeType := common.HexToUtf8(serviceType)
		logger.Infof("getting registered %s's ", nodeType)

		total, err := spf.GetTotalServiceTypeProviders(nil, serviceType)
		if err != nil {
			logger.Errorf("could not get registered %s's: %v", nodeType, err)
		}

		if total.Int64() == 0 {
			continue
		}

		logger.Infof("%d registered %s's", total.Int64(), nodeType)

		totalNodes := int(total.Int64())
		for i := 1; i <= totalNodes; i++ {
			endpointInfo, err := spf.GetServiceEndpointInfo(nil, serviceType, big.NewInt(int64(i)))
			if err != nil {
				logger.Errorf("could not get sp for id %d: %v", i, err)
				continue
			}

			logger.Infof("got registered %s: endpoint: %s delegatewallet: %s", nodeType, endpointInfo.Endpoint, endpointInfo.DelegateOwnerWallet.String())
		}
	}

	return nil
}
