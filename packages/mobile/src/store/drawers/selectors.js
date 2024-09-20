export var getData = function (state, drawer) { return state.drawers.data[drawer]; };
export var getVisibility = function (drawer) { return function (state) {
    return state.drawers[drawer];
}; };
export var getIsOpen = function (state) {
    return Object.values(state.drawers).some(function (isOpen) { return isOpen === true; });
};
