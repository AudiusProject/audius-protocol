var _a;
import { createSlice } from '@reduxjs/toolkit';
var initialState = {
    card: undefined
};
var slice = createSlice({
    name: 'purchaseVendor',
    initialState: initialState,
    reducers: {
        setPurchaseVendor: function (state, action) {
            state.card = action.payload;
        },
        reset: function () { return initialState; }
    }
});
export var setPurchaseVendor = (_a = slice.actions, _a.setPurchaseVendor), reset = _a.reset;
export default slice.reducer;
