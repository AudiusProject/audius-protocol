import { Easing } from 'react-native-reanimated'

const easingInOut = Easing.bezier(0.42, 0, 0.58, 1)

export const motion = {
  quick: {
    duration: 70,
    easing: easingInOut
  },
  expressive: {
    duration: 180,
    easing: easingInOut
  },
  hover: {
    duration: 120,
    easing: Easing.bezier(0.44, 0, 0.56, 1)
  },
  press: {
    duration: 120,
    easing: Easing.bezier(0.44, 0, 0.56, 1)
  },
  calm: {
    duration: 500,
    easing: easingInOut
  }
}
