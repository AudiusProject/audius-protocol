package rpcz

// this is a crappy version of POST broadcast
// that does fire and forget style to all peers...
//
// a better version will have a chan of messages to send and will send them with N workers
// and also do the "pull" consumer code in `sync_client.go`
// and also keep track of if server is up and healthy and only push if yes.
//
// if push fails, it's okay because the pull consumer has a cursor and will come along and get it on an interval.
func (proc *RPCProcessor) broadcast(payload []byte) {
	for _, pc := range proc.peerClients {
		pc.Send(payload)

	}
}
