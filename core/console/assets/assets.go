package assets

import (
	"embed"
	"encoding/base64"
	"log"
)

//go:embed Glyph_Black.svg
var glyphBlackFs embed.FS

var AudiusLogoBlackGlyph string

func init() {
	svgContent, err := glyphBlackFs.ReadFile("Glyph_Black.svg")
	if err != nil {
		log.Fatalf("SVG not found: %v", err)
	}
	encodedSVG := base64.StdEncoding.EncodeToString(svgContent)
	AudiusLogoBlackGlyph = "data:image/svg+xml;base64," + encodedSVG
}
