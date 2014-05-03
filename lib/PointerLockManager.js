var EventEmitter = require('events').EventEmitter
var extend = require('extend')

module.exports = PointerLockManager

/*

  Events:
    'lockChanged' - the lock state changed
    'locked' - the lock state changed to locked
    'unlocked' - the lock state changed to unlocked
    'broken' - the user exited the lock state (exitPointerLock was not called)

*/


function PointerLockManager(){

  this.isLocked = false
  this._didCallExit = false

  this.isFirefox = /Firefox/i.test( navigator.userAgent )

  // implement events
  extend(this, new EventEmitter())

  // Hook pointer lock state change events
  // document.addEventListener('pointerlockchange', this._pointerLockChangeCallback.bind(this), false);
  document.addEventListener('mozpointerlockchange', this._pointerLockChangeCallback.bind(this), false);
  document.addEventListener('webkitpointerlockchange', this._pointerLockChangeCallback.bind(this), false);

  if (this.isFirefox) {
    // document.addEventListener('fullscreenchange', this._fullScreenChangeCallback.bind(this), false);
    document.addEventListener('mozfullscreenchange', this._fullScreenChangeCallback.bind(this), false);
    document.addEventListener('webkitfullscreenchange', this._fullScreenChangeCallback.bind(this), false);
  }

}

PointerLockManager.prototype = {

  requestFullscreen: function(element) {

    element = element || document.body

    requestFullscreen = element.requestFullscreen
      || element.mozRequestFullscreen
      || element.mozRequestFullScreen // Older API upper case 'S'.
      || element.webkitRequestFullscreen;
    
    requestFullscreen.call(element);

  },

  // Ask the browser to lock the pointer
  requestPointerLock: function(element) {

    element = element || document.body

    var fullscreenElement = document.webkitFullscreenElement
      || document.mozFullscreenElement
      || document.mozFullScreenElement // Older API upper case 'S'.

    // firefox requires fullScreen first
    if ( this.isFirefox && fullscreenElement !== element) {
      return this.requestFullscreen(element);
    }

    // request pointerlock
    requestPointerLock = element.requestPointerLock
    || element.mozRequestPointerLock
    || element.webkitRequestPointerLock
    
    this.requestedElement = element
    requestPointerLock.call(element);

  },

  // Ask the browser to release the pointer
  exitPointerLock: function() {

    if (!this.isLocked) return

    this._didCallExit = true

    document.exitPointerLock = document.exitPointerLock
      || document.mozExitPointerLock
      || document.webkitExitPointerLock;
    document.exitPointerLock();

  },

  _pointerLockChangeCallback: function() {

    var lockElement = document.pointerLockElement
      || document.mozPointerLockElement
      || document.webkitPointerLockElement


    if (lockElement === this.requestedElement) {
      this._setAsLocked( true )
    } else {
      this._setAsLocked( false )
      // check for user exit
      if (this._didCallExit) {
        this._didCallExit = false
      } else {
        this.emit('broken')
      }
    }

  },

  _fullScreenChangeCallback: function(element) {

    element = element || document.body

    var fullscreenElement = document.webkitFullscreenElement
      || document.mozFullscreenElement
      || document.mozFullScreenElement // Older API upper case 'S'.

    if (fullscreenElement === element) { 
      // Element is fullscreen, now we can request pointer lock
      this.requestPointerLock(element);
    }

  },

  _setAsLocked: function(newLockedState) {

    if (this.isLocked !== newLockedState) {
      this.isLocked = newLockedState
      // general lock change event
      this.emit('lockChanged', newLockedState)
      // specific lock change events
      if (newLockedState) {
        this.emit('locked')
      } else {
        this.emit('unlocked')
      }
    }

  }


}