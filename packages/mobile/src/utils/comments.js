// TODO: do we need hours?
export var formatCommentTrackTimestamp = function (timestamp_s) {
    var hours = Math.floor(timestamp_s / (60 * 60));
    var minutes = Math.floor(timestamp_s / 60);
    var seconds = "".concat(timestamp_s % 60).padStart(2, '0');
    if (hours > 0) {
        return "".concat(hours, ":").concat(minutes, ":").concat(seconds);
    }
    else {
        return "".concat(minutes, ":").concat(seconds);
    }
};
