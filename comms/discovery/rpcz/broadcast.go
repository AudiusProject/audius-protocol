package rpcz

func (proc *RPCProcessor) broadcast(payload []byte) {
	for _, pc := range proc.peerClients {
		pc.Send(payload)

	}
}
