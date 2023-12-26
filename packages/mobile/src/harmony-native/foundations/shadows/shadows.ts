export const shadows = {
  near: {
    // IOS
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#000',
    // Android
    elevation: 1
  },
  mid: {
    // IOS
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowColor: '#000',
    // Android
    elevation: 2
  },
  midInverted: {
    // IOS
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowColor: '#000',
    // Android
    elevation: 2
  },
  far: {
    // IOS
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.08,
    shadowColor: '#000',
    // Android
    elevation: 3
  },
  emphasis: {
    // IOS
    shadowOffset: { width: 0, height: 1.34018 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    shadowColor: '#000',
    // Android
    elevation: 6
  },
  special: {
    // IOS
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 17,
    shadowOpacity: 0.2,
    shadowColor: '#565776',
    // Android
    elevation: 6
  },
  flat: {
    elevation: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 }
  }
}
