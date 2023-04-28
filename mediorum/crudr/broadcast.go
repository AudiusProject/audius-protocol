package crudr

// pushes serialized crudr Op to peer via POST request
// if the peerClient queue is full, it will drop the message
// it is ok if message is dropped or POST fails
// because the sweeper will consume op.
func (c *Crudr) broadcast(payload []byte) {
	for _, p := range c.peerClients {
		p.Send(payload)
	}
}
