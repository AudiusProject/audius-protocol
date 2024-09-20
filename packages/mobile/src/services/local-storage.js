import { LocalStorage } from '@audius/common/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
export var localStorage = new LocalStorage({
    localStorage: AsyncStorage
});
