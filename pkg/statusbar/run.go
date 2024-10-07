//go:build osx
// +build osx

package statusbar

import (
	"sort"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/caseymrm/menuet"
)

const (
	AudiusLogo = "https://dl.dropboxusercontent.com/s/b6wothpryr0887o/Glyph_White%402x.png"
)

func RunStatusBar() error {
	menuet.App().SetMenuState(&menuet.MenuState{
		Image: AudiusLogo,
	})
	menuet.App().Label = "audius"

	err := updateMenuItems()
	if err != nil {
		return err
	}

	menuet.App().RunApplication()

	return nil
}

func updateMenuItems() error {
	ctxs, err := conf.GetContexts()
	if err != nil {
		return err
	}
	selectedCtx, err := conf.GetCurrentContextName()
	if err != nil {
		return err
	}
	currentContextCfg, err := conf.ReadOrCreateContextConfig()
	if err != nil {
		return err
	}

	hostnames := make([]string, 0, len(currentContextCfg.Nodes))
	contextNodes := []menuet.MenuItem{}
	for hostname := range currentContextCfg.Nodes {
		hostnames = append(hostnames, hostname)
	}
	sort.Sort(conf.NaturalSort(hostnames))
	for _, hostname := range hostnames {
		contextNodes = append(contextNodes, menuet.MenuItem{Text: hostname})
	}

	menuet.App().Children = func() []menuet.MenuItem {
		baseItems := []menuet.MenuItem{
			{
				Text: "Switch context",
				Children: func() []menuet.MenuItem {
					var items []menuet.MenuItem
					for _, ctxName := range ctxs {
						ctxName := ctxName
						item := menuet.MenuItem{
							Text: ctxName,
							Clicked: func(ctxName string) func() {
								return func() {
									conf.UseContext(ctxName)
									updateMenuItems()
								}
							}(ctxName),
						}
						if ctxName == selectedCtx {
							item.Text += " ✓"
						}
						items = append(items, item)
					}
					return items
				},
			},
		}
		baseItems = append(baseItems, contextNodes...)
		return baseItems
	}

	return nil
}
