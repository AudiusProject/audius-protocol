// taken from: https://github.com/seaweedfs/seaweedfs/blob/26dbc6c905189ec471801447e382473ed5b15073/weed/images/resizing.go

package transcode

import (
	"bytes"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"log"

	"github.com/disintegration/imaging"
)

const AUTO = -1

func Resized(ext string, read io.ReadSeeker, width, height int, mode string) (resized io.ReadSeeker, w int, h int) {
	if width == 0 && height == 0 {
		return read, 0, 0
	}
	srcImage, _, err := image.Decode(read)
	if err == nil {
		bounds := srcImage.Bounds()
		var dstImage *image.NRGBA

		// Maintain aspect ratio when auto-resizing height based on target width
		if height == AUTO {
			srcW := bounds.Dx()
			srcH := bounds.Dy()
			autoHeight := float64(srcH) * (float64(width) / float64(srcW))
			height = int(autoHeight)
		}

		switch mode {
		case "fit":
			dstImage = imaging.Fit(srcImage, width, height, imaging.Lanczos)
		case "fill":
			dstImage = imaging.Fill(srcImage, width, height, imaging.Center, imaging.Lanczos)
		default:
			if width == height && bounds.Dx() != bounds.Dy() {
				dstImage = imaging.Thumbnail(srcImage, width, height, imaging.Lanczos)
				w, h = width, height
			} else {
				dstImage = imaging.Resize(srcImage, width, height, imaging.Lanczos)
			}
		}

		var buf bytes.Buffer
		switch ext {
		case ".png":
			png.Encode(&buf, dstImage)
		case ".jpg", ".jpeg":
			jpeg.Encode(&buf, dstImage, nil)
		case ".gif":
			gif.Encode(&buf, dstImage, nil)
		}
		return bytes.NewReader(buf.Bytes()), dstImage.Bounds().Dx(), dstImage.Bounds().Dy()
	} else {
		log.Println(err)
	}
	return read, 0, 0
}
