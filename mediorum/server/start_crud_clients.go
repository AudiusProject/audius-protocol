package server

func (ss *MediorumServer) startCrudClients(streamEndpoint, bulkEndpoint string) {
	for _, peer := range ss.Config.Peers {
		if peer.Host == ss.Config.Self.Host {
			continue
		}
		go ss.crud.NewClient(peer.Host, streamEndpoint, bulkEndpoint)
	}
}
