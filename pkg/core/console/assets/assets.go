package assets

import (
	"embed"
	"encoding/base64"
	"log"
)

var (
	//go:embed images/Glyph_Black.svg
	glyphBlackFs embed.FS
	//go:embed js/main.js
	mainJS []byte
)

var (
	AudiusLogoBlackGlyph string
	MainJS               string
)

func init() {
	svgContent, err := glyphBlackFs.ReadFile("images/Glyph_Black.svg")
	if err != nil {
		log.Fatalf("SVG not found: %v", err)
	}
	encodedSVG := base64.StdEncoding.EncodeToString(svgContent)
	AudiusLogoBlackGlyph = "data:image/svg+xml;base64," + encodedSVG

	MainJS = string(mainJS)
}
