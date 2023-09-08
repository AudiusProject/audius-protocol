package server

import (
	"net/http"
	"net/url"
)

// radixSetHostHasCID sends a POST request to the local radix container to call SetHostHasCID()
func (ss *MediorumServer) radixSetHostHasCID(host, cid string) {
	radixURL, _ := url.Parse("http://radix:" + ss.Config.RadixListenPort)
	radixURL.Path = "/radix/internal/setHostHasCID"
	data := url.Values{}
	data.Set("host", host)
	data.Set("cid", cid)
	http.PostForm(radixURL.String(), data)
}

// radixSetHostNotHasCID sends a POST request to the local radix container to call SetHostNotHasCID()
func (ss *MediorumServer) radixSetHostNotHasCID(host, cid string) {
	radixURL, _ := url.Parse("http://radix:" + ss.Config.RadixListenPort)
	radixURL.Path = "/radix/internal/setHostNotHasCID"
	data := url.Values{}
	data.Set("host", host)
	data.Set("cid", cid)
	http.PostForm(radixURL.String(), data)
}
