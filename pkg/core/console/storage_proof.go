package console

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/labstack/echo/v4"
)

func (cs *Console) storageProofFragment(c echo.Context) error {
	return cs.views.RenderStorageProofView(c, &pages.StorageProofPageView{})
}
