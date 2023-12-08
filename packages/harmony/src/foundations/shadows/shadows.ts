export type ShadowOptions =
  | 'near'
  | 'mid'
  | 'midInverted'
  | 'far'
  | 'emphasis'
  | 'special'
  | 'drop'
  | 'flat'

export const shadows = {
  near: '0px 2px 4px 0px rgba(0, 0, 0, 0.08), 0px 0px 6px 0px rgba(0, 0, 0, 0.02)',
  mid: '0px 4px 8px 0px rgba(0, 0, 0, 0.06), 0px 0px 4px 0px rgba(0, 0, 0, 0.04)',
  midInverted:
    '0px -4px 8px 0px rgba(0, 0, 0, 0.06), 0px 0px 4px 0px rgba(0, 0, 0, 0.04)',
  far: '0px 8px 16px 0px rgba(0, 0, 0, 0.08), 0px 0px 4px 0px rgba(0, 0, 0, 0.04)',
  emphasis:
    '0px 1.34018px 8px 0px rgba(0, 0, 0, 0.2), 0px 6px 15px 0px rgba(0, 0, 0, 0.1)',
  special: '0px 1px 20px -3px #565776',
  flat: undefined,
  drop: 'drop-shadow(0px 1.34018px 8px rgba(0, 0, 0, 0.2)) drop-shadow(0px 6px 15px rgba(0, 0, 0, 0.1))'
}

export type Shadows = typeof shadows
