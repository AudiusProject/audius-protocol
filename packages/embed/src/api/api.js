/* eslint-disable */

(function() {
  var _, a, callbacks, events, proto;

  proto = null;

  _ = function(iframe) {
    this.iframe = iframe;
    this.state = {
      duration: 0,
      position: 0
    };
  };

  callbacks = {};

  events = {
    PAUSE: 'pause',
    PLAY: 'play',
    READY: 'ready',
    FINISH: 'finish',
    ERROR: 'error',
    PLAY_PROGRESS: 'progress'
  };

  _.prototype = {
    constructor: _,
    _communicate: function(message) {
      var ref;
      if (typeof message !== 'object') {
        return;
      }
      if (((ref = this.iframe) != null ? ref.contentWindow : void 0) == null) {
        return;
      }
      message.from = 'audiusapi';
      this.iframe.contentWindow.postMessage(JSON.stringify(message), '*');
    },
    bind: function(event, callback) {
      if (typeof callback !== 'function') {
        throw new Error('event callback must be a function');
      }
      callbacks[event] = callback;
    },
    getDuration: function() {
      return this.state.duration;
    },
    getPosition: function() {
      return this.state.position;
    },
    setDuration: function(duration) {
      this.state.duration = duration;
    },
    setPosition: function(position) {
      this.state.position = position;
    },
    togglePlay: function() {
      this._communicate({
        method: 'togglePlay'
      });
    },
    seekTo: function(position) {
      this._communicate({
        method: 'seekTo',
        value: position
      });
    },
    setVolume: function(volume) {
      this._communicate({
        method: 'setVolume',
        value: volume
      });
    },
    stop: function() {
      this._communicate({
        method: 'stop'
      });
    }
  };

  a = function(e) {
    if (!((e.nodeName != null) && e.nodeName === 'IFRAME')) {
      throw new Error('embed api must be initialized with an iframe');
    }
    window.addEventListener('message', function(e) {
      var data, err, event, from;
      if (e.data == null) {
        return;
      }
      try {
        ({from, data, event} = JSON.parse(e.data));
        if ((from != null) && from === 'audiusembed') {
          if (['ready', 'progress'].includes(event)) {
            proto.setDuration(data.duration);
            proto.setPosition(data.position);
          }
          if (callbacks[event] == null) {
            return;
          }
          return callbacks[event]();
        }
      } catch (error) {
        err = error;
      }
    }, false);
    proto = new _(e);
    return proto;
  };

  (function() {
    window.Audius = {};
    window.Audius.Embed = a;
    window.Audius.Events = events;
  })();

}).call(this);
