package hashes

import (
	"errors"
	"strconv"

	"github.com/speps/go-hashids/v2"
)

var (
	hasher *hashids.HashID
)

func init() {
	hd := hashids.NewData()
	hd.Salt = "azowernasdfoia"
	hd.MinLength = 5
	hasher, _ = hashids.NewWithData(hd)
}

func Encode(id int) (string, error) {
	return hasher.Encode([]int{id})
}

func Decode(hid string) (int, error) {
	ids, err := hasher.DecodeWithError(hid)
	if err != nil {
		return 0, err
	}
	if len(ids) < 1 {
		return 0, errors.New("invalid hash")
	}
	return ids[0], nil
}

func MaybeDecode(hid string) (int, error) {
	id, err := Decode(hid)
	if err != nil {
		id, err = strconv.Atoi(hid)
	}
	return id, err
}
