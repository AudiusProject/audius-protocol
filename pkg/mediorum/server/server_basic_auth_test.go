package server

import (
	"fmt"
	"net/http"

	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestRequireUserSignatureWithIncorrectID(t *testing.T) {
	ss := testNetwork[0]

	id := "RNB53QS3EMQCJDWG6PKA66OB3UT7XKXI"
	signature := "%7B%22data%22%3A%20%22%7B%5C%22upload_id%5C%22%3A%20%5C%22INCORRECTUPLOADID%5C%22%2C%20%5C%22timestamp%5C%22%3A%201596159123000%2C%20%5C%22shouldCache%5C%22%3A%201%7D%22%2C%20%22signature%22%3A%20%220x5ad47b4605f08c14bca58631d3311b8f722a7037a3700666a509895ad011dffb6ae00a3144c03a9f077d746739ab63c205dab23ec7bd67288d337e5d27fdba8c1b%22%7D"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/uploads/%s?signature=%s", id, signature), nil)

	rec := httptest.NewRecorder()
	c := ss.echo.NewContext(req, rec)
	c.SetPath("/uploads/:id")
	c.SetParamNames("id")
	c.SetParamValues(id)

	// Handle the request
	h := ss.requireUserSignature(func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	})
	h(c)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	body := rec.Body.String()
	assert.Contains(t, body, "signature contains incorrect ID")
}

func TestRequireUserSignatureWithOldTimestamp(t *testing.T) {
	ss := testNetwork[0]

	id := "RNB53QS3EMQCJDWG6PKA66OB3UT7XKXI"
	signature := "%7B%22data%22%3A%20%22%7B%5C%22upload_id%5C%22%3A%20%5C%22RNB53QS3EMQCJDWG6PKA66OB3UT7XKXI%5C%22%2C%20%5C%22timestamp%5C%22%3A%201596159123000%2C%20%5C%22shouldCache%5C%22%3A%201%7D%22%2C%20%22signature%22%3A%20%220xc5dbec14490cee5c8d10cc8247291b2f4f906e5d4d27e276b0c2bb94ed576ec745fc5abd932871274a13d31eafe86493eac7ca44d12c2b4b3aa60ccb0e7c4bdf1b%22%7D"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/uploads/%s?signature=%s", id, signature), nil)

	rec := httptest.NewRecorder()
	c := ss.echo.NewContext(req, rec)
	c.SetPath("/uploads/:id")
	c.SetParamNames("id")
	c.SetParamValues(id)

	// Handle the request
	h := ss.requireUserSignature(func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	})
	h(c)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	body := rec.Body.String()
	assert.Contains(t, body, "signature too old")
}
