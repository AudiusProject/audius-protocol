
package utils

func GetRegisteredDiscoveryNodes() map[string]bool {
	// read nodes from static file into set
	nodes := map[string]bool{"0x123": true}
	return nodes
}

func IsValidDiscoveryNode(node string) bool {
	nodes := GetRegisteredDiscoveryNodes()
	_, ok := nodes[node]
	return ok
}
