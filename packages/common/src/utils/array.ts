/**
 *
 * Interleave array elements
 *
 * interleave ([0, 2, 4, 6], [1, 3, 5]) // [ 0 1 2 3 4 5 6 ]
 * interleave ([0, 2, 4], [1, 3, 5, 7]) // [ 0 1 2 3 4 5 7 ]
 * interleave ([0, 2, 4], [])           // [ 0 2 4 ]
 * interleave ([], [1, 3, 5, 7])        // [ 1 3 5 7 ]
 * interleave ([], [])                  // [ ]
 */
export const interleave = <A, B>([x, ...xs]: A[], ys: B[] = []): (A | B)[] =>
  x === undefined
    ? ys // base: no x
    : [x, ...interleave(ys, xs)]
