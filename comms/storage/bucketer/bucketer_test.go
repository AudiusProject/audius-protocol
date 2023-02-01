// Package bucketer handles the logic for deciding which content falls into which buckets.
// Implemented for cuid2, which consists of only numbers and lowercase letters (base36).
package bucketer

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMakeBuckets(t *testing.T) {
	testCases := map[string]struct {
		suffixLength int
		expected     []string
	}{
		"Suffix length 1 (a, b, ..., 8, 9)": {
			suffixLength: 1,
			expected:     base36Chars[:],
		},
		"Suffix length 2 (ab, bc, ..., 98, 99)": {
			suffixLength: 2,
			// Expected output generated using Python one-liner: print(list(map(lambda x: "".join(x), itertools.product("abcdefghijklmnopqrstuvwxyz0123456789", repeat=2))))
			expected: []string{"aa", "ab", "ac", "ad", "ae", "af", "ag", "ah", "ai", "aj", "ak", "al", "am", "an", "ao", "ap", "aq", "ar", "as", "at", "au", "av", "aw", "ax", "ay", "az", "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "ba", "bb", "bc", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bk", "bl", "bm", "bn", "bo", "bp", "bq", "br", "bs", "bt", "bu", "bv", "bw", "bx", "by", "bz", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ca", "cb", "cc", "cd", "ce", "cf", "cg", "ch", "ci", "cj", "ck", "cl", "cm", "cn", "co", "cp", "cq", "cr", "cs", "ct", "cu", "cv", "cw", "cx", "cy", "cz", "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "da", "db", "dc", "dd", "de", "df", "dg", "dh", "di", "dj", "dk", "dl", "dm", "dn", "do", "dp", "dq", "dr", "ds", "dt", "du", "dv", "dw", "dx", "dy", "dz", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "ea", "eb", "ec", "ed", "ee", "ef", "eg", "eh", "ei", "ej", "ek", "el", "em", "en", "eo", "ep", "eq", "er", "es", "et", "eu", "ev", "ew", "ex", "ey", "ez", "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "fa", "fb", "fc", "fd", "fe", "ff", "fg", "fh", "fi", "fj", "fk", "fl", "fm", "fn", "fo", "fp", "fq", "fr", "fs", "ft", "fu", "fv", "fw", "fx", "fy", "fz", "f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "ga", "gb", "gc", "gd", "ge", "gf", "gg", "gh", "gi", "gj", "gk", "gl", "gm", "gn", "go", "gp", "gq", "gr", "gs", "gt", "gu", "gv", "gw", "gx", "gy", "gz", "g0", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "ha", "hb", "hc", "hd", "he", "hf", "hg", "hh", "hi", "hj", "hk", "hl", "hm", "hn", "ho", "hp", "hq", "hr", "hs", "ht", "hu", "hv", "hw", "hx", "hy", "hz", "h0", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9", "ia", "ib", "ic", "id", "ie", "if", "ig", "ih", "ii", "ij", "ik", "il", "im", "in", "io", "ip", "iq", "ir", "is", "it", "iu", "iv", "iw", "ix", "iy", "iz", "i0", "i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8", "i9", "ja", "jb", "jc", "jd", "je", "jf", "jg", "jh", "ji", "jj", "jk", "jl", "jm", "jn", "jo", "jp", "jq", "jr", "js", "jt", "ju", "jv", "jw", "jx", "jy", "jz", "j0", "j1", "j2", "j3", "j4", "j5", "j6", "j7", "j8", "j9", "ka", "kb", "kc", "kd", "ke", "kf", "kg", "kh", "ki", "kj", "kk", "kl", "km", "kn", "ko", "kp", "kq", "kr", "ks", "kt", "ku", "kv", "kw", "kx", "ky", "kz", "k0", "k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9", "la", "lb", "lc", "ld", "le", "lf", "lg", "lh", "li", "lj", "lk", "ll", "lm", "ln", "lo", "lp", "lq", "lr", "ls", "lt", "lu", "lv", "lw", "lx", "ly", "lz", "l0", "l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "ma", "mb", "mc", "md", "me", "mf", "mg", "mh", "mi", "mj", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "na", "nb", "nc", "nd", "ne", "nf", "ng", "nh", "ni", "nj", "nk", "nl", "nm", "nn", "no", "np", "nq", "nr", "ns", "nt", "nu", "nv", "nw", "nx", "ny", "nz", "n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "oa", "ob", "oc", "od", "oe", "of", "og", "oh", "oi", "oj", "ok", "ol", "om", "on", "oo", "op", "oq", "or", "os", "ot", "ou", "ov", "ow", "ox", "oy", "oz", "o0", "o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8", "o9", "pa", "pb", "pc", "pd", "pe", "pf", "pg", "ph", "pi", "pj", "pk", "pl", "pm", "pn", "po", "pp", "pq", "pr", "ps", "pt", "pu", "pv", "pw", "px", "py", "pz", "p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "qa", "qb", "qc", "qd", "qe", "qf", "qg", "qh", "qi", "qj", "qk", "ql", "qm", "qn", "qo", "qp", "qq", "qr", "qs", "qt", "qu", "qv", "qw", "qx", "qy", "qz", "q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "ra", "rb", "rc", "rd", "re", "rf", "rg", "rh", "ri", "rj", "rk", "rl", "rm", "rn", "ro", "rp", "rq", "rr", "rs", "rt", "ru", "rv", "rw", "rx", "ry", "rz", "r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "sa", "sb", "sc", "sd", "se", "sf", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sp", "sq", "sr", "ss", "st", "su", "sv", "sw", "sx", "sy", "sz", "s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "ta", "tb", "tc", "td", "te", "tf", "tg", "th", "ti", "tj", "tk", "tl", "tm", "tn", "to", "tp", "tq", "tr", "ts", "tt", "tu", "tv", "tw", "tx", "ty", "tz", "t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "ua", "ub", "uc", "ud", "ue", "uf", "ug", "uh", "ui", "uj", "uk", "ul", "um", "un", "uo", "up", "uq", "ur", "us", "ut", "uu", "uv", "uw", "ux", "uy", "uz", "u0", "u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "va", "vb", "vc", "vd", "ve", "vf", "vg", "vh", "vi", "vj", "vk", "vl", "vm", "vn", "vo", "vp", "vq", "vr", "vs", "vt", "vu", "vv", "vw", "vx", "vy", "vz", "v0", "v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "wa", "wb", "wc", "wd", "we", "wf", "wg", "wh", "wi", "wj", "wk", "wl", "wm", "wn", "wo", "wp", "wq", "wr", "ws", "wt", "wu", "wv", "ww", "wx", "wy", "wz", "w0", "w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "xa", "xb", "xc", "xd", "xe", "xf", "xg", "xh", "xi", "xj", "xk", "xl", "xm", "xn", "xo", "xp", "xq", "xr", "xs", "xt", "xu", "xv", "xw", "xx", "xy", "xz", "x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "ya", "yb", "yc", "yd", "ye", "yf", "yg", "yh", "yi", "yj", "yk", "yl", "ym", "yn", "yo", "yp", "yq", "yr", "ys", "yt", "yu", "yv", "yw", "yx", "yy", "yz", "y0", "y1", "y2", "y3", "y4", "y5", "y6", "y7", "y8", "y9", "za", "zb", "zc", "zd", "ze", "zf", "zg", "zh", "zi", "zj", "zk", "zl", "zm", "zn", "zo", "zp", "zq", "zr", "zs", "zt", "zu", "zv", "zw", "zx", "zy", "zz", "z0", "z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8", "z9", "0a", "0b", "0c", "0d", "0e", "0f", "0g", "0h", "0i", "0j", "0k", "0l", "0m", "0n", "0o", "0p", "0q", "0r", "0s", "0t", "0u", "0v", "0w", "0x", "0y", "0z", "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "1a", "1b", "1c", "1d", "1e", "1f", "1g", "1h", "1i", "1j", "1k", "1l", "1m", "1n", "1o", "1p", "1q", "1r", "1s", "1t", "1u", "1v", "1w", "1x", "1y", "1z", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "2a", "2b", "2c", "2d", "2e", "2f", "2g", "2h", "2i", "2j", "2k", "2l", "2m", "2n", "2o", "2p", "2q", "2r", "2s", "2t", "2u", "2v", "2w", "2x", "2y", "2z", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "3a", "3b", "3c", "3d", "3e", "3f", "3g", "3h", "3i", "3j", "3k", "3l", "3m", "3n", "3o", "3p", "3q", "3r", "3s", "3t", "3u", "3v", "3w", "3x", "3y", "3z", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "4a", "4b", "4c", "4d", "4e", "4f", "4g", "4h", "4i", "4j", "4k", "4l", "4m", "4n", "4o", "4p", "4q", "4r", "4s", "4t", "4u", "4v", "4w", "4x", "4y", "4z", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "5a", "5b", "5c", "5d", "5e", "5f", "5g", "5h", "5i", "5j", "5k", "5l", "5m", "5n", "5o", "5p", "5q", "5r", "5s", "5t", "5u", "5v", "5w", "5x", "5y", "5z", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "6a", "6b", "6c", "6d", "6e", "6f", "6g", "6h", "6i", "6j", "6k", "6l", "6m", "6n", "6o", "6p", "6q", "6r", "6s", "6t", "6u", "6v", "6w", "6x", "6y", "6z", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "7a", "7b", "7c", "7d", "7e", "7f", "7g", "7h", "7i", "7j", "7k", "7l", "7m", "7n", "7o", "7p", "7q", "7r", "7s", "7t", "7u", "7v", "7w", "7x", "7y", "7z", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "8a", "8b", "8c", "8d", "8e", "8f", "8g", "8h", "8i", "8j", "8k", "8l", "8m", "8n", "8o", "8p", "8q", "8r", "8s", "8t", "8u", "8v", "8w", "8x", "8y", "8z", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "9a", "9b", "9c", "9d", "9e", "9f", "9g", "9h", "9i", "9j", "9k", "9l", "9m", "9n", "9o", "9p", "9q", "9r", "9s", "9t", "9u", "9v", "9w", "9x", "9y", "9z", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99"},
		},
	}

	for testName, testCase := range testCases {
		t.Logf("Running test case %q", testName)
		result := New(testCase.suffixLength).Buckets
		assert.ElementsMatchf(t, testCase.expected, result, "Expected %s\n got %s", testCase.expected, result)
	}
}

func TestGetBucketForId(t *testing.T) {
	suffixLength1 := New(1)
	suffixLength2 := New(2)

	testCases := map[string]struct {
		bucketer               *Bucketer
		bucket                 string
		idsExpectedInBucket    []string
		idsExpectedNotInBucket []string
	}{
		"'a' bucket": {
			bucketer:               suffixLength1,
			bucket:                 "a",
			idsExpectedInBucket:    []string{"clbcdefga", "clbcdefaa"},
			idsExpectedNotInBucket: []string{"aabcdefg", "4abcdefgb", "xrbcdefg", "9sbcdefg"},
		},
		"'4' bucket": {
			bucketer:               suffixLength1,
			bucket:                 "4",
			idsExpectedInBucket:    []string{"aabcdefg4", "444444444"},
			idsExpectedNotInBucket: []string{"4abcdefg", "babcdefg", "xrbcdefg", "9sbcdefg"},
		},
		"'xr' bucket": {
			bucketer:               suffixLength2,
			bucket:                 "xr",
			idsExpectedInBucket:    []string{"aabcdefgxr"},
			idsExpectedNotInBucket: []string{"xrbcdefg", "xabcdefg", "rabcdefg", "9sbcdefg"},
		},
		"'9s' bucket": {
			bucketer:               suffixLength2,
			bucket:                 "9s",
			idsExpectedInBucket:    []string{"bcdefg99s"},
			idsExpectedNotInBucket: []string{"9sbcdefg9sa", "babcdef9ss", "4abcdefg", "xrbcdefg"},
		},
	}

	for testName, testCase := range testCases {
		t.Logf("Running test case %q", testName)
		for _, id := range testCase.idsExpectedInBucket {
			assert.True(t, testCase.bucketer.GetBucketForId(id) == testCase.bucket, "Expected %s to be in bucket %s", id, testCase.bucket)
		}
		for _, id := range testCase.idsExpectedNotInBucket {
			assert.False(t, testCase.bucketer.GetBucketForId(id) == testCase.bucket, "Expected %s to not be in bucket %s", id, testCase.bucket)
		}
	}
}
