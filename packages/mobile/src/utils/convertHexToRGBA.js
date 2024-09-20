export var convertHexToRGBA = function (hexCode, opacity) {
    if (opacity === void 0) { opacity = 1; }
    var hex = hexCode.replace('#', '');
    if (hex.length === 3) {
        hex = "".concat(hex[0]).concat(hex[0]).concat(hex[1]).concat(hex[1]).concat(hex[2]).concat(hex[2]);
    }
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    /* Backward compatibility for whole number based opacity values. */
    if (opacity > 1 && opacity <= 100) {
        opacity = opacity / 100;
    }
    return "rgba(".concat(r, ",").concat(g, ",").concat(b, ",").concat(opacity, ")");
};
