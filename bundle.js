(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TSEGame = require('./lib/game.js')

game = new TSEGame()
game.start()

},{"./lib/game.js":5}],2:[function(require,module,exports){
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
},{"events":20,"extend":21}],3:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
var extend = require('extend')

module.exports = {
  ComponentClass: ComponentClass,
  ComponentInstance: ComponentInstance,
  ComponentManager: ComponentManager,
}


// ComponentClass

var _defaultSrc = [
  '// hello world',
  'this.update = function () {',
  '  // target.position',
  '}',
].join('\n')

function ComponentClass ( opts ) {

  opts = opts || {}

  this.uuid = opts.uuid || THREE.Math.generateUUID()
  this.name = opts.name || 'Unnamed Component'
  this.src = opts.src || _defaultSrc
  this.instances = []

}

ComponentClass.prototype = {

  getCode: function () {

    return this.src

  },

  setCode: function ( newCode ) {

    this.src = newCode
    this.updateInstances()

    return this

  },

  instantiate: function ( target ) {

    var newInstance = new ComponentInstance( {
      class: this,
      target: target,
    } )

    this.instances.push( newInstance )

    return newInstance

  },

  updateInstances: function() {

    this.instances.forEach( function ( instance ) {

      instance.updateClass()

    } )

  },

  toJSON: function () {

    var data = {}

    data.uuid = this.uuid
    data.name = this.name
    data.src = this.src

    data.instances = []
    this.instances.forEach( function (instance) {

      data.instances.push( instance.toJSON() )

    } )

    return data

  },

}

// ComponentInstance

function ComponentInstance ( opts ) {

  this.uuid = THREE.Math.generateUUID()
  this.class = opts.class
  this.target = opts.target

  this.updateClass()

}

ComponentInstance.prototype = {

  updateClass: function () {

    var Class = eval( '(function(target){\n\n' + this.class.src + '\n\n})' )
    var instance = new Class( this.target )
    if (!instance.updateDisabled) instance.updateDisabled = false
    this.instance = instance

  },

  run: function ( methodName ) {

    if ( methodName === 'update' && this.instance.updateDisabled ) return

    var fn = this.instance[ methodName ]

    if ( fn === undefined ) return

    // collect any additional args after methodName
    var args = [].slice.call( arguments, 1 )
    fn.apply( this.instance, args )

  },

  toJSON: function () {

    var data = {}

    data.uuid = this.uuid
    data.target = this.target.uuid
    data.class = this.class.uuid

    return data

  },

}

// ComponentManager

function ComponentManager () {

  this.componentClasses = {}
  this.componentClassesByName = {}
  this.componentsLookupByObject = {}

  // implement events
  extend(this, new EventEmitter())

}

ComponentManager.prototype = {

  registerComponentClass: function ( componentClass ) {

    this.componentClasses[ componentClass.uuid ] = componentClass
    this.componentClassesByName[ componentClass.name ] = componentClass
    this.emit('componentClassRegistryChanged', componentClass )

  },

  deleteComponentClass: function ( componentClass ) {

    var scope = this
    
    componentClass.instances.slice().forEach( function ( componentInstance ) {

      scope.deleteComponentInstance( componentInstance )

    } )

    delete this.componentClasses[ componentClass.uuid ]
    delete this.componentClassesByName[ componentClass.name ]

    this.emit('componentClassRegistryChanged')

  },

  deleteComponentInstance: function ( component ) {

    // remove component instance from object 
    var objectComponents = this.componentsLookupByObject[ component.target.uuid ]

    var index = objectComponents.indexOf( component )
    if (index > -1) {
        objectComponents.splice(index, 1)
    }

    // remove component instance from component class
    var classInstances = this.componentClasses[ component.class.uuid ].instances

    var index = classInstances.indexOf( component )
    if (index > -1) {
        classInstances.splice(index, 1)
    }

  },

  componentsForObject: function ( target ) {

    var components = this.componentsLookupByObject[ target.uuid ]

    if ( components === undefined ) {
      components = components || []      
    }

    return components

  },

  instantiateComponent: function ( componentClass, target ) {

    var components = this.componentsLookupByObject[ target.uuid ]

    if ( components === undefined ) {
      components = components || []  
      this.componentsLookupByObject[ target.uuid ] = components    
    }

    var newInstance = componentClass.instantiate( target )
    components.push( newInstance )

    this.emit('componentClassRegistryChanged')

    return newInstance

  },

  runComponentUpdate: function () {

    var componentClasses = this.componentClasses

    Object.keys( this.componentClasses ).forEach( function (uuid) {

      var componentClass = componentClasses[ uuid ]
      
      componentClass.instances.forEach( function (instance) {

        instance.run('update')

      })

    } )

  },

  serializeComponents: function () {

    var data = [];
    var componentClasses = this.componentClasses;

    Object.keys( this.componentClasses ).forEach( function (uuid) {

      var componentClass = componentClasses[ uuid ];
      
      data.push( componentClass.toJSON() );

    } );

    return data;

  },

  getComponentClassByName: function( className ) {

    return this.componentClassesByName[ className ]

  },

}
},{"events":20,"extend":21}],4:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
var extend = require('extend')
var ComponentManager = require('./components.js').ComponentManager

module.exports = Engine


var projector = new THREE.Projector()
var raycaster = new THREE.Raycaster()

function Engine() {

  this.primaryScene = new THREE.Scene()
  this.helpersScene = new THREE.Scene()
  this.currentCamera = null
  
  this.currentHover = null

  this.compManager = new ComponentManager()

  // implement events
  extend(this, new EventEmitter())

}

Engine.prototype.start = function() {

  // setup renderer
  this.renderer = new THREE.WebGLRenderer()
  this.renderer.autoClear = false
  this.renderer.autoUpdateScene = false
  this.renderer.setClearColor( 0xffffff )
  this.renderer.setSize( window.innerWidth, window.innerHeight )
  var rendererElement = this.renderer.domElement
  rendererElement.id = 'primary-renderer'
  document.body.appendChild( rendererElement )
  window.addEventListener( 'resize', this.refreshCamera.bind(this), false )

  // start loop
  this.mainLoop()

}

Engine.prototype.mainLoop = function() {

  requestAnimationFrame( this.mainLoop.bind(this) )

  this.updateMouseOver()
  this.compManager.runComponentUpdate()

  this.emit('mainLoop')

  // manually clear and update scene
  this.helpersScene.updateMatrixWorld()
  this.primaryScene.updateMatrixWorld()
  this.renderer.clear()

  this.renderer.render( this.primaryScene, this.currentCamera )
  this.renderer.render( this.helpersScene, this.currentCamera )

}

Engine.prototype.updateMouseOver = function() {

  // update currentHover

  var oldHover = this.currentHover
  var newHover = this.getHover()

  // update current values
  this.currentHover = newHover

  // if hover changed
  if ( oldHover != newHover ) {

    // exit oldHover
    if ( oldHover ) {
      this.compManager.componentsForObject(oldHover).map(function(comp) {
        comp.run('mouseExit')
      })
    }

    // enter newHover
    if (newHover) {
      this.compManager.componentsForObject(newHover).map(function(comp) {
        comp.run('mouseEnter')
      })

    }

    this.emit('hoverChanged', newHover)

  }

}

Engine.prototype.getHover = function( event ) {

  var intersects = this.getIntersects(event);
  if (intersects[0]) return intersects[0].object

}

// find intersections
Engine.prototype.getIntersects = function( event ) {

  var projectorScreenPos
  var element = this.renderer.domElement

  if (event) {
    var rect = element.getBoundingClientRect();
    projectorScreenPos = {
      x: (( event.clientX - rect.left ) / rect.width) * 2 - 1,
      y: (( event.clientY - rect.top ) / rect.height) * -2 + 1,
    }
  } else {
    projectorScreenPos = { x: 0, y: 0 }
  }

  var raycastOrigin = new THREE.Vector3()
  raycastOrigin.setFromMatrixPosition( this.currentCamera.matrixWorld )

  var mouseVector = new THREE.Vector3( projectorScreenPos.x, projectorScreenPos.y, 1 )
  projector.unprojectVector( mouseVector, this.currentCamera )
  mouseVector.sub( raycastOrigin ).normalize()

  raycaster.set( raycastOrigin, mouseVector )

  return raycaster.intersectObjects( this.primaryScene.children )

}

Engine.prototype.setScene = function( scene ) {

  this.primaryScene = scene

}

Engine.prototype.setCamera = function( camera ) {

  this.currentCamera = camera
  this.refreshCamera()

}

Engine.prototype.objectById = function ( id, scene ) {

  scene = scene || this.primaryScene
  var target = null;

  scene.traverse( function ( child ) {

    if ( child.id === id ) {

      target = child;

    }

  } );

  return target;

}

Engine.prototype.objectByUuid = function ( uuid, scene ) {

  scene = scene || this.primaryScene
  var target = null;

  scene.traverse( function ( child ) {

    if ( child.uuid === uuid ) {

      target = child;

    }

  } );

  return target;

}

Engine.prototype.refreshCamera = function() {

  this.currentCamera.aspect = window.innerWidth / window.innerHeight
  this.currentCamera.updateProjectionMatrix()

  if (this.renderer) this.renderer.setSize( window.innerWidth, window.innerHeight )

}
},{"./components.js":3,"events":20,"extend":21}],5:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
var extend = require('extend')
var LookingGlass = require('looking-glass')

var TseObject3D = require('./looking-glass/TseObject3D.js')
var TseEntity = require('./looking-glass/TseEntity.js')
var TseComponentClass = require('./looking-glass/TseComponentClass.js')

var Topbar = require('./ui/Topbar.js')
var Bottombar = require('./ui/Bottombar.js')
var Sidebar = require('./ui/Sidebar.js')
var CodeEditor = require('./ui/CodeEditor.js')
var Engine = require('./engine.js')
var Storage = require('./storage.js')
var PointerLockManager = require('./PointerLockManager.js')
var ComponentClass = require('./components.js').ComponentClass
var generateExampleWorld = require('./generateExampleWorld.js')
var orientUnderParent = require('./util/orientUnderParent.js')

module.exports = Game


function Game() {

  this.universe = null
  this.currentMode = null
  this.currentSelectedObject = null
  this.fpsControls = null
  this.transformControls = null
  this.transformControlsMode = null

  this.storage = new Storage()

  // implement events
  extend(this, new EventEmitter())

}

Game.prototype = {
  
  start: function() {

    this.engine = new Engine()

    this.setupUniverse()
    this.setupUi()

    this.loadGameState(this.initializeGame.bind(this))

  },

  setMode: function(mode) {

    this.currentMode = mode
    this.emit('modeChanged', mode)

  },

  setupUniverse: function() {

    // temporary fake connection until multiplayer is in place
    var fakeConnection = {
      on:  console.log.bind(console, '--> on'),
      emitReliable:  console.log.bind(console, '--> emitReliable'),
      emitUnreliable:  console.log.bind(console, '--> emitUnreliable'),
    }

    var universe = new LookingGlass( fakeConnection )
    // note - you must manually register the whole class hierarchy
    universe.registerClass( TseObject3D )
    universe.registerClass( TseEntity )
    universe.registerClass( TseComponentClass )

    this.universe = universe

  },

  initializeGame: function( loadSuccessful ) {

    // on first time, generate world
    if ( !loadSuccessful ) {

      generateExampleWorld( this )

    }

    this.setupCameras()

    this.engine.start()
    this.setupControls()
    this.setMode('paused')

    this.saveGameState()

  },

  setupUi: function() {

    // inject sidebar
    var sidebar = new Sidebar( this ).setId( 'sidebar' )
    document.body.appendChild( sidebar.dom )

    // inject topbar
    var topbar = new Topbar( this ).setId( 'topbar' )
    document.body.appendChild( topbar.dom )

    // inject bottombar
    var bottombar = new Bottombar( this ).setId( 'bottombar' )
    document.body.appendChild( bottombar.dom )

    // inject code editor
    var codeEditor = new CodeEditor( this ).setId( 'code-editor' )
    document.body.appendChild( codeEditor.dom )

  },

  setupControls: function() {

    var engine = this.engine
    var compManager = engine.compManager

    // transform controls

    this.transformControls = new THREE.TransformControls( this.rtsCamera, engine.renderer.domElement )
    engine.helpersScene.add( this.transformControls )

    this.transformControlsMode = 'transform'

    engine.on('mainLoop', function() {

      // update controls position
      this.transformControls.update()

    }.bind(this))

    game.on('transformModeChanged', function(mode) {
      this.transformControlsMode = mode
      this.transformControls.setMode( mode )
    })

    game.on('snapChanged', function( snap ) {
      this.transformControls.setSnap( snap )
    })

    game.on('spaceChanged', function( space ) {
      this.transformControls.setSpace( space )
    })

    this.on('selectedObjectChanged', setTransformControlTarget)
    this.on('modeChanged', setTransformControlTarget)

    function setTransformControlTarget() {
      
      var target = this.getSelectedObject()
      this.transformControls.detach()
      if ( this.currentMode === 'scene' && target ) {
        // attach gizmo
        this.transformControls.attach( target )
        // // orient gizmo
        // var lookTarget = this.fpsControls.getObject().position
        // directionVector = this.transformControls.position.clone().sub(lookTarget).setY(0).normalize()
        // var angle = 0.75 * Math.PI + Math.atan2(directionVector.x,directionVector.z)
        // this.transformControls.setRotationFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), angle )
      }

    }

    // camera controls
    this.rtsControls = new THREE.OrbitControls( this.rtsCamera, this.engine.renderer.domElement )

    this.fpsControls = new THREE.PointerLockControls( this.fpsCamera )
    this.engine.primaryScene.add( this.fpsControls.getObject() )

    this.gravityRay = new THREE.Raycaster()
    this.gravityRay.ray.direction.set( 0, -1, 0 )

    var pointerLockManager = new PointerLockManager()
    
    pointerLockManager.on('broken',function() {
      this.setMode('paused')
    }.bind(this))

    this.on('modeChanged', function(mode){

      // handle fps controls
      if (mode === 'play') {
        this.engine.setCamera( this.fpsCamera )
        pointerLockManager.requestPointerLock()
        this.fpsControls.enable()
      } else {
        this.fpsControls.disable()
        pointerLockManager.exitPointerLock()
      }

      // handle rts contols
      if (mode === 'scene') {
        this.rtsCamera.position = this.fpsControls.getObject().position.clone()
        this.rtsCamera.position.y += 50
        this.engine.setCamera( this.rtsCamera )
        this.rtsControls.enabled = true
      } else {
        this.rtsControls.enabled = false
      }

      if (mode === 'paused') {
        document.getElementById('blocker').classList.remove('hidden')
        document.getElementById('sidebar').classList.add('hidden')
      } else {
        document.getElementById('blocker').classList.add('hidden')
        document.getElementById('sidebar').classList.remove('hidden')
      }
    })

    engine.on('mainLoop',function(){
      
      if (this.currentMode === 'play') this.updatePlayerControls()

    }.bind(this))

    // reticle appearance (active/inactive)
    
    engine.on('hoverChanged',function(currentHover){
      
      var reticleElement = document.getElementById('reticle')
      reticleElement.classList.remove('activate')
      var activateFound = false

      if (!currentHover) return
      // check for activate method
      compManager.componentsForObject(currentHover).map(function(comp) {
        if (comp.instance.activate) activateFound = true
      })

      if (activateFound) reticleElement.classList.add('activate')

    }.bind(this))

    // update current selected object

    engine.on('hoverChanged',function(currentHover){

      if (this.currentMode === 'play') this.setSelectedObject( currentHover )

    }.bind(this))

    // clicks and keys
    window.addEventListener( 'click', onClick.bind(this), false )
    window.addEventListener( 'keydown', onKeypress.bind(this), false )

  },

  updatePlayerControls: function() {

    var gravityRay = this.gravityRay

    // check floor

    this.fpsControls.isOnObject( false )

    gravityRay.ray.origin.copy( this.fpsControls.getObject().position )
    gravityRay.ray.origin.y -= 10

    var solidComponent = this.engine.compManager.getComponentClassByName('solid')
    var solidObjects = solidComponent.instances.map( function(comp){ return comp.target } )

    var intersections = gravityRay.intersectObjects( solidObjects )

    if ( intersections.length > 0 ) {

      var distance = intersections[ 0 ].distance

      if ( distance > 0 && distance < 10 ) {

        this.fpsControls.isOnObject( true )

      }

    }

    this.fpsControls.update()
  },

  setupCameras: function() {

    this.fpsCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 )
    this.engine.setCamera( this.fpsCamera )

    this.rtsCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 )
    this.rtsCamera.position.y = 50

  },

  activateObject: function(target) {

    var compManager = this.engine.compManager
    compManager.componentsForObject(target).map(function(comp) {
      comp.run('activate')
    })

  },

  setSelectedObject: function(target) {

    this.currentSelectedObject = target
    this.emit('selectedObjectChanged', target)

  },

  getSelectedObject: function(target) {

    return this.currentSelectedObject

  },

  // save nothing! for now
  saveGameState: function () {
  },

  // force fail loadGameState for now
  loadGameState: function( callback ) {
    callback( false )
  },

  // this saveGameState predates the new multiplayer-inspired serialization work
  // saveGameState: function () {

  //   // export scene
  //   var exporter = new THREE.ObjectExporter();
  //   var data = exporter.parse( this.engine.primaryScene );

  //   // append components
  //   data.components = this.engine.compManager.serializeComponents();

  //   this.storage.set( data );

  // },

  // loadGameState: function( callback ) {

  //   var engine = this.engine
  //   var compManager = this.engine.compManager

  //   this.storage.init( function () {

  //     this.storage.get( function ( state ) {

  //       if ( state !== undefined ) {

  //         // load scene
          
  //         var loader = new THREE.ObjectLoader()
  //         var scene = loader.parse( state )

  //         engine.setScene( scene )

  //         // load components

  //         if ( state.components !== undefined ) {

  //           state.components.forEach( function ( classData ) {

  //             var componentClass = new ComponentClass( classData )
  //             compManager.registerComponentClass( componentClass )

  //             classData.instances.forEach( function ( instanceData ) {

  //               var target = engine.objectByUuid( instanceData.target )
  //               compManager.instantiateComponent( componentClass, target )

  //             } )

  //           } )

  //         }

  //         // loaded successfully
  //         callback( true )

  //       } else {

  //         // loaded unsuccessfully (nothing saved)
  //         callback( false )

  //       }

  //     }.bind(this) )

  //     //

  //     var timeout
  //     var saveState = function ( scene ) {

  //       // debounce
  //       clearTimeout( timeout )
  //       timeout = setTimeout( function () {

  //         this.saveGameState()

  //       }, 1000 )

  //     }

  //     // TODO
  //     this.on('objectAdded', saveState )
  //     this.on('objectChanged', saveState )
  //     this.on('objectRemoved', saveState )
  //     this.on('materialChanged', saveState )
  //     this.on('sceneGraphChanged', saveState )
  //     this.on('componentClassRegistryChanged', saveState )

  //   }.bind(this) )

  // },


}


function drawLine(start, end) {
    
    console.log('drawing line...', start.toArray(), end.toArray())

    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    })

    var geometry = new THREE.Geometry()
    geometry.vertices.push(start)
    geometry.vertices.push(end)

    var line = new THREE.Line(geometry, material)
    scene.add(line)

    return line
}

function onClick( event ) {

  var engine = this.engine

  switch (this.currentMode) {

    case 'play':
      // // activate current hover
      // var target = this.getSelectedObject()
      // if (target) this.activateObject( target )

      // drag object
      
      // stop carry
      if ( this.currentDraggedObject ) {

        var target = this.currentDraggedObject
        var scene = this.engine.primaryScene

        orientUnderParent( target, scene )
        this.currentDraggedObject = null

      // start carry
      } else {

        var target = this.getSelectedObject()

        if (target) {
          // var player = this.fpsControls.getObject()
          var player = this.fpsControls.getObject().children[0]
          this.currentDraggedObject = target
          orientUnderParent( target, player )
        }

      }

      break

    case 'scene':
      // update selectedObject
      var target = this.engine.getHover(event)
      if (target) this.setSelectedObject( target )
      break

    case 'paused':
      // unpause
      game.setMode('play')
      break

  }

}

function onKeypress( event ) {

  var keyCode = event.keyCode || event.which

  switch (this.currentMode) {

    case 'play':
      switch ( keyCode ) {
        // 'Q' key
        case 81:
          this.setMode('scene')
          break
      }
      break

    case 'scene':
      switch ( keyCode ) {
        // 'Q' key
        case 81:
          this.setMode('play')
          break
        // 'W' key
        case 87:
          this.emit('transformModeChanged', 'translate')
          break
        // 'E' key
        case 69:
          this.emit('transformModeChanged', 'rotate')
          break
        // 'R' key
        case 82:
          this.emit('transformModeChanged', 'scale')
          break
      }
      break

    case 'components':
      switch ( keyCode ) {
        // 'Q' key
        case 81:
          this.setMode('play')
          break
      }
      break

  }

}
},{"./PointerLockManager.js":2,"./components.js":3,"./engine.js":4,"./generateExampleWorld.js":6,"./looking-glass/TseComponentClass.js":7,"./looking-glass/TseEntity.js":8,"./looking-glass/TseObject3D.js":9,"./storage.js":10,"./ui/Bottombar.js":11,"./ui/CodeEditor.js":12,"./ui/Sidebar.js":15,"./ui/Topbar.js":17,"./util/orientUnderParent.js":19,"events":20,"extend":21,"looking-glass":22}],6:[function(require,module,exports){
module.exports = generateExampleWorld

function generateExampleWorld( game ) {

  defineComponents( game )
  buildWorld( game )

}

function defineComponents( game ) {

  var engine = game.engine
  var ComponentClass = game.universe.classes.TseComponentClass

  var spinnerComponent = new ComponentClass({
    name: 'spinner',
    source: [
      '// spinner',
      'this.speed = 0.1',
      'this.updateDisabled = true',
      'this.activate = function () {',
      '  this.updateDisabled = !this.updateDisabled',
      '}',
      'this.update = function () {',
      '  target.rotateY(this.speed)',
      '}',
      ].join('\n')
  })

  engine.compManager.registerComponentClass( spinnerComponent.core )

  var hoverComponent = new ComponentClass({
    name: 'hover',
    source: [
      '// hover',
      'var oldColor',
      'this.mouseEnter = function () {',
      '  oldColor = target.material.color.getHex()',
      '  target.material.color.setHex( 0xff0000 )',
      '}',
      'this.mouseExit = function () {',
      '  target.material.color.setHex( oldColor )',
      '}',
      ].join('\n')
  })

  engine.compManager.registerComponentClass( hoverComponent.core )

  var solidComponent = new ComponentClass({
    name: 'solid',
    source: [
      '// solid',
      '/*',
      '  this empty component is used as a flag',
      '  since we can query objects by component class,',
      '  we use this component to collect all objects that',
      '  the player can stand on',
      '*/',
      ].join('\n')
  })

  engine.compManager.registerComponentClass( solidComponent.core )

  var chaseComponent = new ComponentClass({
    name: 'chaser',
    source: [
      '// chase the player',
      'this.chaseTarget = game.playerControls.getObject();',
      'this.speed = 0.1;',

      'this.update = function () {',
        'var direction = target.position.clone().sub(this.chaseTarget.position);',
        'direction.normalize().multiplyScalar(this.speed);',
        'target.position.sub(direction);',
      '}',
      ].join('\n')
  })

  engine.compManager.registerComponentClass( chaseComponent.core )

}

function buildWorld( game ) {

  var engine = game.engine
  var geometry, material, mesh

  var boxSize = 5

  //

  var scene = engine.primaryScene
  scene.fog = new THREE.Fog( 0xffffff, 0, 750 )

  var light = new THREE.DirectionalLight( 0xffffff, 1.5 )
  light.position.set( 1, 1, 1 )
  scene.add( light )

  var light = new THREE.DirectionalLight( 0xffffff, 0.75 )
  light.position.set( -1, - 0.5, -1 )
  scene.add( light )

  // floor

  var floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 )
  // copy over to normal geometry so it serializes correctly
  // https://github.com/mrdoob/three.js/issues/4762
  var geometry = new THREE.Geometry()
  geometry.vertices = floorGeometry.vertices
  geometry.colors = floorGeometry.colors
  geometry.faces = floorGeometry.faces
  geometry.faceVertexUvs = floorGeometry.faceVertexUvs

  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) )

  for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

    var vertex = geometry.vertices[ i ]
    vertex.x += Math.random() * 20 - 10
    vertex.y += Math.random() * 2
    vertex.z += Math.random() * 20 - 10

  }

  for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

    var face = geometry.faces[ i ]
    face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
    face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
    face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )

  }

  material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } )

  mesh = new THREE.Mesh( geometry, material )
  scene.add( mesh )

  // objects

  var boxGeometry = new THREE.BoxGeometry( boxSize, boxSize, boxSize )
  // copy over to normal geometry so it serializes correctly
  // https://github.com/mrdoob/three.js/issues/4762
  var geometry = new THREE.Geometry()
  geometry.vertices = boxGeometry.vertices
  geometry.colors = boxGeometry.colors
  geometry.faces = boxGeometry.faces
  geometry.faceVertexUvs = boxGeometry.faceVertexUvs

  // randomly colorize faces
  for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

    var face = geometry.faces[ i ]
    face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
    face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
    face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )

  }

  // randomly create boxes
  for ( var i = 0; i < 500; i ++ ) {

    material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } )

    var mesh = new THREE.Mesh( geometry, material )
    mesh.position.x = Math.floor( Math.random() * 50 - boxSize/2 ) * boxSize
    mesh.position.y = Math.floor( Math.random() * 20 ) * boxSize + boxSize/2
    mesh.position.z = Math.floor( Math.random() * 50 - boxSize/2 ) * boxSize
    scene.add( mesh )

    material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )

    // add components
    var hoverComponent = engine.compManager.getComponentClassByName('hover')
    engine.compManager.instantiateComponent( hoverComponent, mesh )
    var spinnerComponent = engine.compManager.getComponentClassByName('spinner')
    engine.compManager.instantiateComponent( spinnerComponent, mesh )
    var solidComponent = engine.compManager.getComponentClassByName('solid')
    engine.compManager.instantiateComponent( solidComponent, mesh )

  }

}
},{}],7:[function(require,module,exports){
var ComponentClass = require('../components.js').ComponentClass

var _defaultSrc = [
  '// hello world',
  'this.update = function () {',
  '  // target.position',
  '}',
].join('\n')

module.exports = function( universe ) {

  var LookingGlassObject = universe.classes.LookingGlassObject
  var __instances__ = universe.instances

  TseComponentClass.prototype = Object.create( LookingGlassObject.prototype )
  TseComponentClass.prototype.constructor = TseComponentClass
  TseComponentClass.type = 'TseComponentClass'

  function TseComponentClass( args, skipInitialization, fromRemote ) {

    // call SuperClass, but skip initialization
    LookingGlassObject.call( this, args, true, fromRemote )

    // define properties
    this._defineProperties({
      name:   { type: 'string',     default: 'Unnamed Component', },
      source: { type: 'string',     default: _defaultSrc, },
    })

    this.on('name', function( name ) {
      var componentClass = this.core
      componentClass.name = name
    })

    this.on('source', function( code ) {
      var componentClass = this.core
      componentClass.setCode( code )
    })

    // initialize after we're done defining properties, allowing the subClass to define properties
    if (!skipInitialization) this._initialize(args, fromRemote)

  }

  //
  // Public
  //

  TseComponentClass.prototype.instantiate = function ( target ) {

    return this.core.instantiate( target )

  },

  //
  // Private
  //

  TseComponentClass.prototype._createCore = function() {
    
    return new ComponentClass()
    
  }


  return TseComponentClass

}
},{"../components.js":3}],8:[function(require,module,exports){


module.exports = function( universe ) {

  var TseObject3D = universe.classes.TseObject3D
  var __instances__ = universe.instances

  TseEntity.prototype = Object.create( TseObject3D.prototype )
  TseEntity.prototype.constructor = TseEntity
  TseEntity.type = 'TseEntity'

  function TseEntity( args, skipInitialization, fromRemote ) {

    // call SuperClass, but skip initialization
    TseObject3D.call( this, args, true, fromRemote )

    // define properties
    this._defineProperties({

    })

    // initialize after we're done defining properties, allowing the subClass to define properties
    if (!skipInitialization) this._initialize(args, fromRemote)

  }

  //
  // Public
  //



  //
  // Private
  //




  return TseEntity

}
},{}],9:[function(require,module,exports){


module.exports = function( universe ) {

  var LookingGlassObject = universe.classes.LookingGlassObject
  var __instances__ = universe.instances

  TseObject3D.prototype = Object.create( LookingGlassObject.prototype )
  TseObject3D.prototype.constructor = TseObject3D
  TseObject3D.type = 'TseObject3D'

  function TseObject3D( args, skipInitialization, fromRemote ) {

    // call SuperClass, but skip initialization
    LookingGlassObject.call( this, args, true, fromRemote )

    // define properties
    this._defineProperties({
      position:  { type: 'vector3',    default: [0,0,0],   reliable: false, },
      rotation:  { type: 'vector3',    default: [0,0,0],   reliable: false, },
      parent:    { type: 'string',     default: null,                       },
    })

    this.on('position', function( position ) {
      var vector = this.core.position
      vector.set.apply( vector, position )
    })

    this.on('rotation', function( rotation ) {
      this.core.setRotationFromEuler( new THREE.Euler( rotation[0], rotation[1], rotation[2] ) )
    })

    this.on('parent', function( parentId ) {
      
      // get parent reference
      var parentObj, parentCore
      parentObj = __instances__[ parentId ]
      if (parentObj) parentCore = parentObj.core
      
      // if parent found, set
      if (parentCore) {
      
        parentCore.add( this.core )
      
      // otherwise assume we meant to orphanize
      } else if ( this.core.parent !== undefined ) {

        this.core.parent.remove( this.core )

      }

    })

    // initialize after we're done defining properties, allowing the subClass to define properties
    if (!skipInitialization) this._initialize(args, fromRemote)

  }

  //
  // Public
  //

  TseObject3D.prototype.add = function( lgObject3D ) {

    lgObject3D.set( 'parent', this.id )

  }

  //
  // Private
  //

  TseObject3D.prototype._createCore = function() {
    
    return new THREE.Object3D()
    
  }


  return TseObject3D

}
},{}],10:[function(require,module,exports){
module.exports = Storage

function Storage() {

  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

  var name = 'threejs-editor';
  var version = 1;

  var database;

  return {

    init: function ( callback ) {

      var request = indexedDB.open( name, version );
      request.onupgradeneeded = function ( event ) {

        var db = event.target.result;

        if ( db.objectStoreNames.contains( 'states' ) === false ) {

          db.createObjectStore( 'states' );

        }

      };
      request.onsuccess = function ( event ) {

        database = event.target.result;

        callback();

      };
      request.onerror = function ( event ) {

        console.error( 'IndexedDB', event );

      };
      

    },

    get: function ( callback ) {

      var transaction = database.transaction( [ 'states' ], 'readwrite' );
      var objectStore = transaction.objectStore( 'states' );
      var request = objectStore.get( 0 );
      request.onsuccess = function ( event ) {

        callback( event.target.result );

      };

    },

    set: function ( data, callback ) {

      var start = performance.now();

      var transaction = database.transaction( [ 'states' ], 'readwrite' );
      var objectStore = transaction.objectStore( 'states' );
      var request = objectStore.put( data, 0 );
      request.onsuccess = function ( event ) {

        console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );

      };

    },

    clear: function ( callback ) {

      var transaction = database.transaction( [ 'states' ], 'readwrite' );
      var objectStore = transaction.objectStore( 'states' );
      var request = objectStore.clear();
      request.onsuccess = function ( event ) {

        callback();
      
      };

    }

  }

};
},{}],11:[function(require,module,exports){
var UI = require('./UI.js')

module.exports = Bottombar


function Bottombar( game ) {

  var container = new UI.Panel().onClick( function( event ) {

    event.stopPropagation()

  } )
  var translateButton, rotateButton, scaleButton
  var gridNumber, snapCheckbox, localCheckbox

  var buttons = new UI.Panel()
  container.add( buttons )

  // translate / rotate / scale

  translateButton = new UI.Button( 'translate' ).onClick( function (event) {

    game.emit('transformModeChanged', 'translate' )
    event.stopPropagation()

  } )
  buttons.add( translateButton )

  rotateButton = new UI.Button( 'rotate' ).onClick( function (event) {

    game.emit('transformModeChanged', 'rotate' )
    event.stopPropagation()

  } )
  buttons.add( rotateButton )

  scaleButton = new UI.Button( 'scale' ).onClick( function (event) {

    game.emit('transformModeChanged', 'scale' )
    event.stopPropagation()

  } )
  buttons.add( scaleButton )



  // grid

  gridNumber = new UI.Number( 25 ).onChange( update )
  gridNumber.dom.style.width = '42px'
  buttons.add( new UI.Text( 'Grid: ' ) )
  buttons.add( gridNumber )

  snapCheckbox = new UI.Checkbox( false ).onChange( update )
  buttons.add( snapCheckbox )
  buttons.add( new UI.Text( 'snap' ) )

  localCheckbox = new UI.Checkbox( false ).onChange( update )
  buttons.add( localCheckbox )
  buttons.add( new UI.Text( 'local' ) )

  update()
  setActiveButton( game.transformControlsMode || 'translate' )

  // events

  game.on('modeChanged', function ( mode ) {

    container.dom.classList.add( 'hidden' )

    switch (mode) {

      case 'scene':
        showMenubar()
        break

      case 'components':
        showMenubar()
        break

    }

  } )

  game.on('transformModeChanged', setActiveButton)

  //

  function update() {

    game.emit('snapChanged', snapCheckbox.getValue() === true ? gridNumber.getValue() : null )
    game.emit('spaceChanged', localCheckbox.getValue() === true ? "local" : "world" )

  }

  function showMenubar() {

    container.dom.classList.remove( 'hidden' )

  }

  function setActiveButton(mode) {

    translateButton.dom.classList.remove('active')
    rotateButton.dom.classList.remove('active')
    scaleButton.dom.classList.remove('active')

    var targetButton

    switch (mode) {

      case 'translate':
        targetButton = translateButton
        break

      case 'rotate':
        targetButton = rotateButton
        break

      case 'scale':
        targetButton = scaleButton
        break

    }

    targetButton.dom.classList.add('active')

  }


  return container

}

},{"./UI.js":18}],12:[function(require,module,exports){
var UI = require('./UI.js')

module.exports = CodeEditor


function CodeEditor( game ) {

  var container = new UI.Panel()
  
  var codeEditor

  var showEditor = function( editMode ) {

    codeEditor = new UI.CodeEditor()
    container.dom.classList.remove('code-editor-minimized')
    container.dom.classList.add('code-editor-expanded')
    container.add( codeEditor )

  }

  var hideEditor = function() {

    container.clear()
    container.dom.classList.remove('code-editor-expanded')
    container.dom.classList.add('code-editor-minimized')

  }

  // events
  var currentComponentClass

  game.on( 'currentComponentClassChanged', function ( componentClass ) {

    // if a class is already open, save the contents
    if ( currentComponentClass ) {
      currentComponentClass.setCode( codeEditor.getValue() )
    }

    codeEditor.setValue( componentClass.getCode() )

    currentComponentClass = componentClass

  } )

  game.on('modeChanged', function ( mode ) {

    switch (mode) {
      
      case 'components':
        showEditor()
        break

      default:
        hideEditor()
        break

    }

  } )

  return container

}

},{"./UI.js":18}],13:[function(require,module,exports){
var UI = require('./UI.js')
var ComponentClass = require('../components.js').ComponentClass

module.exports = ComponentClasses


function ComponentClasses( game ) {

  var container = new UI.Panel()
  container.setId('componentPanel')

  drawPanel()

  // events

  game.on('componentClassRegistryChanged', function (componentClass) {

    container.clear()
    drawPanel()

  } )

  return container

  //

  function drawPanel() {

    drawNewComponent()
    drawComponentPanels()

  }

  function drawNewComponent () {
    
    var newComponentPanel = new UI.Panel()
    var newComponentButton = new UI.Button( 'New Component' ).onClick( function () {

      var newComponentClass = new ComponentClass()
      game.engine.compManager.registerComponentClass( newComponentClass )
      game.emit('currentComponentClassChanged', newComponentClass )

    } )

    newComponentPanel.add( newComponentButton )
    container.add( newComponentPanel )

  }

  function drawComponentPanels () {

    var componentClasses = game.engine.compManager.componentClasses

    Object.keys(componentClasses).forEach( function( uuid ) {
    
      var componentClass = componentClasses[ uuid ]
      container.add( createComponentPanel( componentClass ) )

    } )

  }

  function createComponentPanel (componentClass) {
    
    var panel = new UI.CollapsiblePanel()
    panel.addStatic( new UI.Text( componentClass.name ) )
    panel.add( new UI.Break() )


    // name

    var componentNameRow = new UI.Panel()
    var componentName = new UI.Input().setValue( componentClass.name ).setWidth( '150px' ).setColor( '#444' ).setFontSize( '12px' ).onChange( function () {

      componentClass.name = componentName.getValue()
      
      // An error occurs if you do this immediately
      setTimeout( function () {

        game.emit('componentClassRegistryChanged', componentClass )

      } )

    } )

    componentNameRow.add( new UI.Text( 'Name' ).setWidth( '90px' ) )
    componentNameRow.add( componentName )

    panel.add( componentNameRow )

    // stats

    var componentStatsRow = new UI.Panel()
    var componentStats = new UI.Text( componentClass.instances.length ).setWidth( '150px' ).setColor( '#444' ).setFontSize( '12px' )

    componentStatsRow.add( new UI.Text( 'Instances' ).setWidth( '90px' ) )
    componentStatsRow.add( componentStats )

    panel.add( componentStatsRow )

    // CRUD

    var componentCrudRow = new UI.Panel()

    var componentDuplicateButton = new UI.Button( 'Duplicate' ).onClick( function () {

      var newName = incrementName( componentClass.name )

      var newComponentClass = new ComponentClass({
        name: newName,
        src: componentClass.getCode(),
      })

      game.engine.compManager.registerComponentClass( newComponentClass )
      game.emit('currentComponentClassChanged', newComponentClass )

    } )

    var componentDeleteButton = new UI.Button( 'Delete' ).onClick( function () {

      game.engine.compManager.deleteComponentClass( componentClass )

    } )

    componentCrudRow.add( componentDuplicateButton )
    componentCrudRow.add( componentDeleteButton )


    panel.add( componentCrudRow )

    // events

    panel.onClick( function () {

      game.emit('currentComponentClassChanged', componentClass )

    } )

    return panel

  }

  function incrementName( name ) {

    var digits = 0
    var endsInNumber = 0

    while (true) {
    
      var tryDigits = digits + 1
      var endOfName = name.slice( -tryDigits )
      var isNumber = !Number.isNaN( Number( endOfName ) )
      if (isNumber && tryDigits < name.length ) { 
        endsInNumber = Number( endOfName )
        digits++
      } else {
        break
      }

    }
    
    if ( digits > 0 ) {
      name = name.slice( 0, -digits )
    }

    if ( endsInNumber === 0) {
      endsInNumber = 2
    } else {
      endsInNumber++
    }

    name += endsInNumber

    return name
    
  }

}
},{"../components.js":3,"./UI.js":18}],14:[function(require,module,exports){
var UI = require('./UI.js')
var ComponentClass = require('../components.js').ComponentClass

module.exports = ComponentInstances


function ComponentInstances( game, editMode ) {

  var compManager = game.engine.compManager

  var container = new UI.Panel()

  drawPanel()

  // events

  game.on('selectedObjectChanged', function () {

    container.clear()
    drawPanel()

  } )

  game.on('componentClassRegistryChanged', function () {

    container.clear()
    drawPanel()

  } )

  return container

  //

  function drawPanel() {

    var selectedObject = game.currentSelectedObject

    if ( selectedObject ) {

      drawComponentPanels( selectedObject )
      if (editMode) drawNewComponent( selectedObject )

    }

  }

  function drawComponentPanels ( selectedObject ) {

    var components = compManager.componentsForObject( selectedObject )

    components.forEach( function( component ) {
    
      container.add( createComponentPanel( component ) )

    } )

  }

  function drawNewComponent ( selectedObject ) {

    var newComponentPanel = new UI.Panel()

    var options = {
      null: '...'
    }

    Object.keys(compManager.componentClasses).forEach( function (uuid) {

      var componentClass = compManager.componentClasses[ uuid ]
      options[ componentClass.uuid ] = componentClass.name

    } )

    options.new = '( New Component )'

    var newComponentLabel = new UI.Text( 'Add' ).setWidth( '50px' ).setColor( '#888' ).setFontSize( '14px' )
    var newComponentSelect = new UI.Select().setWidth( '200px' ).setOptions( options ).onChange( function () {

      var uuid = newComponentSelect.getValue()
      
      if ( uuid === 'new' ) {

        var newComponentClass = new ComponentClass()
        compManager.registerComponentClass( newComponentClass )
        uuid = newComponentClass.uuid
        
        compManager.setSidebarMode('components')
        game.emit('currentComponentClassChanged', newComponentClass )

      }

      var componentClass = compManager.componentClasses[ uuid ]
      compManager.instantiateComponent( componentClass, selectedObject )

      game.emit('componentClassRegistryChanged')

    } )

    newComponentPanel.add( newComponentLabel )
    newComponentPanel.add( newComponentSelect )
    container.add( newComponentPanel )

  }

  function createComponentPanel ( component ) {
    
    var panel = new UI.CollapsiblePanel()
    panel.addStatic( new UI.Text( component.class.name ) )
    panel.add( new UI.Break() )

    if (editMode) {

      // Edit + Delete

      var componentCrudRow = new UI.Panel().setFloat( 'right' )

      var componentEditButton = new UI.Button( 'Edit' ).onClick( function () {
        
        game.setMode('components')
        game.emit('currentComponentClassChanged', component.class )

      } )

      var componentDeleteButton = new UI.Button( 'Delete' ).onClick( function () {
        
        compManager.deleteComponentInstance( component )
        game.emit('componentClassRegistryChanged')

      } )

      componentCrudRow.add( componentEditButton )
      componentCrudRow.add( componentDeleteButton )
      panel.addStatic( componentCrudRow )

    }

    // Properties

    var componentProperties = new UI.Panel()

    Object.keys( component.instance ).forEach( function ( key ) {

      var value = component.instance[ key ]

      switch ( typeof value ) {

        case 'number':

          var propertyPanel = createNumberPropertyPanel( component.instance, key, value )
          panel.add( propertyPanel )
          break

        case 'boolean':

          var propertyPanel = createBooleanPropertyPanel( component.instance, key, value )
          panel.add( propertyPanel )
          break

        default:
          
          var propertyPanel = new UI.Panel()
          propertyPanel.add( new UI.Text( key ).setWidth( '100px' ) )
          propertyPanel.add( new UI.Text( '(' + typeof value + ')' ).setWidth( '60px' ) )
          panel.add( propertyPanel )
          break

      }

    } )

    panel.add( componentProperties )


    return panel

  }

  function createNumberPropertyPanel( instance, key, value ) {

    var propertyPanel = new UI.Panel()

    var numberSetter = new UI.Number().setWidth( '60px' ).setValue( value )
    numberSetter.onChange( function () {

      instance[ key ] = numberSetter.getValue()

    } )

    propertyPanel.add( new UI.Text( key ).setWidth( '100px' ) )
    propertyPanel.add( numberSetter )
    
    return propertyPanel

  }

  function createBooleanPropertyPanel( instance, key, value ) {

    var propertyPanel = new UI.Panel()

    var numberSetter = new UI.Checkbox().setWidth( '60px' ).setValue( value )
    numberSetter.onChange( function (event) {

      instance[ key ] = numberSetter.getValue()

    } )

    propertyPanel.add( new UI.Text( key ).setWidth( '100px' ) )
    propertyPanel.add( numberSetter )
    
    return propertyPanel

  }

}
},{"../components.js":3,"./UI.js":18}],15:[function(require,module,exports){
var UI = require('./UI.js')
var ComponentInstances = require('./ComponentInstances.js')
var ComponentClasses = require('./ComponentClasses.js')
var SidebarModes = require('./SidebarModes.js')

module.exports = Sidebar


function Sidebar( game ) {

  var container = new UI.Panel().onClick( function( event ) {

    event.stopPropagation()

  } )

  var showInspector = function( editMode ) {

    if (editMode) container.add( new SidebarModes( game ) )
    container.add( new ComponentInstances( game, editMode ) )

  }

  var showComponents = function() {

    container.add( new SidebarModes( game ) )
    container.add( new ComponentClasses( game ) )

  }

  // events

  game.on('modeChanged', function ( mode ) {

    container.clear()

    switch (mode) {
      
      case 'play':
        showInspector( false )
        break

      case 'scene':
        showInspector( true )
        break

      case 'components':
        showComponents()
        break

    }

  } )

  return container

}

},{"./ComponentClasses.js":13,"./ComponentInstances.js":14,"./SidebarModes.js":16,"./UI.js":18}],16:[function(require,module,exports){
var UI = require('./UI.js')

module.exports = SidebarModes


function SidebarModes( game ) {

  var container = new UI.Panel()
  container.setId( 'sidebar-modes' )

  // inspector

  var inspectorButton = new UI.Button( 'Inspector' ).onClick( function() {

    game.setMode( 'scene' )

  } )
  container.add( inspectorButton )

  // components

  var componentsButton = new UI.Button( 'Components' ).setFloat('right').onClick( function() {

    game.setMode( 'components' )

  } )
  container.add( componentsButton )

  // set active

  if ( game.currentMode == 'scene' ) {

    inspectorButton.dom.classList.add('active')

  } else if ( game.currentMode == 'components' ) {

    componentsButton.dom.classList.add('active')

  }

  return container

}

},{"./UI.js":18}],17:[function(require,module,exports){
var UI = require('./UI.js')

module.exports = Topbar


function Topbar( game ) {

  var container = new UI.Panel().onClick( function( event ) {

    event.stopPropagation()

  } )

  function drawMenubar() {

    container.dom.classList.remove( 'hidden' )
    container.add( new UI.Text( 'This is the Topbar' ) )

  }

  // events

  game.on('modeChanged', function ( mode ) {

    container.clear()
    container.dom.classList.add( 'hidden' )

    switch (mode) {

      case 'scene':
        drawMenubar()
        break

      case 'components':
        drawMenubar()
        break

    }

  } )

  return container

}

},{"./UI.js":18}],18:[function(require,module,exports){
var UI = {};

module.exports = UI;


UI.Element = function () {};

UI.Element.prototype = {

  setId: function ( id ) {

    this.dom.id = id;
    
    return this;

  },

  setClass: function ( name ) {

    this.dom.className = name;

    return this;

  },

  setStyle: function ( style, array ) {

    for ( var i = 0; i < array.length; i ++ ) {

      this.dom.style[ style ] = array[ i ];

    }

  },

  setDisabled: function ( value ) {

    this.dom.disabled = value;

    return this;

  },

  setTextContent: function ( value ) {

    this.dom.textContent = value;

    return this;

  }

}

// properties

var properties = [ 'position', 'float', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textTransform', 'cursor' ];

properties.forEach( function ( property ) {

  var method = 'set' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

  UI.Element.prototype[ method ] = function () {

    this.setStyle( property, arguments );
    return this;

  };

} );

// events

var events = [ 'KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'Change' ];

events.forEach( function ( event ) {

  var method = 'on' + event;

  UI.Element.prototype[ method ] = function ( callback ) {

    this.dom.addEventListener( event.toLowerCase(), callback.bind( this ), false );

    return this;

  };

} );


// Panel

UI.Panel = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Panel';

  this.dom = dom;

  return this;
};

UI.Panel.prototype = Object.create( UI.Element.prototype );

UI.Panel.prototype.add = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.dom.appendChild( arguments[ i ].dom );

  }

  return this;

};


UI.Panel.prototype.remove = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.dom.removeChild( arguments[ i ].dom );

  }

  return this;

};

UI.Panel.prototype.clear = function () {

  while ( this.dom.children.length ) {

    this.dom.removeChild( this.dom.lastChild );

  }

};


// Collapsible Panel

UI.CollapsiblePanel = function () {

  UI.Panel.call( this );

  this.dom.className = 'Panel CollapsiblePanel';

  this.button = document.createElement( 'div' );
  this.button.className = 'CollapsiblePanelButton';
  this.dom.appendChild( this.button );

  var scope = this;
  this.button.addEventListener( 'click', function ( event ) {

    scope.toggle();

  }, false );

  this.content = document.createElement( 'div' );
  this.content.className = 'CollapsibleContent';
  this.dom.appendChild( this.content );

  this.isCollapsed = false;

  return this;

};

UI.CollapsiblePanel.prototype = Object.create( UI.Panel.prototype );

UI.CollapsiblePanel.prototype.addStatic = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.dom.insertBefore( arguments[ i ].dom, this.content );

  }

  return this;

};

UI.CollapsiblePanel.prototype.removeStatic = UI.Panel.prototype.remove;

UI.CollapsiblePanel.prototype.clearStatic = function () {

  this.dom.childNodes.forEach( function ( child ) {

    if ( child !== this.content ) {

      this.dom.removeChild( child );

    }

  });

};

UI.CollapsiblePanel.prototype.add = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.content.appendChild( arguments[ i ].dom );

  }

  return this;

};

UI.CollapsiblePanel.prototype.remove = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.content.removeChild( arguments[ i ].dom );

  }

  return this;

};

UI.CollapsiblePanel.prototype.clear = function () {

  while ( this.content.children.length ) {

    this.content.removeChild( this.content.lastChild );

  }

};

UI.CollapsiblePanel.prototype.toggle = function() {

  this.setCollapsed( !this.isCollapsed );

};

UI.CollapsiblePanel.prototype.collapse = function() {

  this.setCollapsed( true );

};

UI.CollapsiblePanel.prototype.expand = function() {

  this.setCollapsed( false );

};

UI.CollapsiblePanel.prototype.setCollapsed = function( setCollapsed ) {

  if ( setCollapsed ) {

    this.dom.classList.add('collapsed');

  } else {

    this.dom.classList.remove('collapsed');

  }

  this.isCollapsed = setCollapsed;

};

// Text

UI.Text = function ( text ) {

  UI.Element.call( this );

  var dom = document.createElement( 'span' );
  dom.className = 'Text';
  dom.style.cursor = 'default';
  dom.style.display = 'inline-block';
  dom.style.verticalAlign = 'middle';

  this.dom = dom;
  this.setValue( text );

  return this;

};

UI.Text.prototype = Object.create( UI.Element.prototype );

UI.Text.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.textContent = value;

  }

  return this;

};


// Input

UI.Input = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Input';
  dom.style.padding = '2px';
  dom.style.border = '1px solid #ccc';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;

  return this;

};

UI.Input.prototype = Object.create( UI.Element.prototype );

UI.Input.prototype.getValue = function () {

  return this.dom.value;

};

UI.Input.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};


// TextArea

UI.TextArea = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'textarea' );
  dom.className = 'TextArea';
  dom.style.padding = '2px';
  dom.style.border = '1px solid #ccc';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;

  return this;

};

UI.TextArea.prototype = Object.create( UI.Element.prototype );

UI.TextArea.prototype.getValue = function () {

  return this.dom.value;

};

UI.TextArea.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};

// CodeEditor

UI.CodeEditor = function () {

  UI.Element.call( this );

  var scope = this;

  var dom;

  var setDom = function(element) {
    dom = element;
  }

  var codeMirrorOptions = {
    mode: 'javascript',
    theme: 'monokai',
    lineNumbers: true
  }

  var codeMirror = CodeMirror(setDom, codeMirrorOptions);

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;
  this.codeMirror = codeMirror;

  return this;

};

UI.CodeEditor.prototype = Object.create( UI.Element.prototype );

UI.CodeEditor.prototype.getValue = function () {

  return this.codeMirror.getValue();

};

UI.CodeEditor.prototype.setValue = function ( value ) {

  this.codeMirror.setValue( value );

  return this;

};

// Select

UI.Select = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'select' );
  dom.className = 'Select';
  dom.style.width = '64px';
  dom.style.height = '16px';
  dom.style.border = '0px';
  dom.style.padding = '0px';

  this.dom = dom;

  return this;

};

UI.Select.prototype = Object.create( UI.Element.prototype );

UI.Select.prototype.setMultiple = function ( boolean ) {

  this.dom.multiple = boolean;

  return this;

};

UI.Select.prototype.setOptions = function ( options ) {

  var selected = this.dom.value;

  while ( this.dom.children.length > 0 ) {

    this.dom.removeChild( this.dom.firstChild );

  }

  for ( var key in options ) {

    var option = document.createElement( 'option' );
    option.value = key;
    option.innerHTML = options[ key ];
    this.dom.appendChild( option );

  }

  this.dom.value = selected;

  return this;

};

UI.Select.prototype.getValue = function () {

  return this.dom.value;

};

UI.Select.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};

// FancySelect

UI.FancySelect = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'div' );
  dom.className = 'FancySelect';
  dom.tabIndex = 0; // keyup event is ignored without setting tabIndex

  // Broadcast for object selection after arrow navigation
  var changeEvent = document.createEvent('HTMLEvents');
  changeEvent.initEvent( 'change', true, true );

  // Prevent native scroll behavior
  dom.addEventListener( 'keydown', function (event) {

    switch ( event.keyCode ) {
      case 38: // up
      case 40: // down
        event.preventDefault();
        event.stopPropagation();
        break;
    }

  }, false);

  // Keybindings to support arrow navigation
  dom.addEventListener( 'keyup', function (event) {

    switch ( event.keyCode ) {
      case 38: // up
      case 40: // down
        scope.selectedIndex += ( event.keyCode == 38 ) ? -1 : 1;

        if ( scope.selectedIndex >= 0 && scope.selectedIndex < scope.options.length ) {

          // Highlight selected dom elem and scroll parent if needed
          scope.setValue( scope.options[ scope.selectedIndex ].value );

          scope.dom.dispatchEvent( changeEvent );

        }

        break;
    }

  }, false);

  this.dom = dom;

  this.options = [];
  this.selectedIndex = -1;
  this.selectedValue = null;

  return this;

};

UI.FancySelect.prototype = Object.create( UI.Element.prototype );

UI.FancySelect.prototype.setOptions = function ( options ) {

  var scope = this;

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  while ( scope.dom.children.length > 0 ) {

    scope.dom.removeChild( scope.dom.firstChild );

  }

  scope.options = [];

  for ( var i = 0; i < options.length; i ++ ) {

    var option = options[ i ];

    var div = document.createElement( 'div' );
    div.className = 'option';
    div.innerHTML = option.html;
    div.value = option.value;
    scope.dom.appendChild( div );

    scope.options.push( div );

    div.addEventListener( 'click', function ( event ) {

      scope.setValue( this.value );
      scope.dom.dispatchEvent( changeEvent );

    }, false );

  }

  return scope;

};

UI.FancySelect.prototype.getValue = function () {

  return this.selectedValue;

};

UI.FancySelect.prototype.setValue = function ( value ) {

  for ( var i = 0; i < this.options.length; i ++ ) {

    var element = this.options[ i ];

    if ( element.value === value ) {

      element.classList.add( 'active' );

      // scroll into view

      var y = element.offsetTop - this.dom.offsetTop;
      var bottomY = y + element.offsetHeight;
      var minScroll = bottomY - this.dom.offsetHeight;

      if ( this.dom.scrollTop > y ) {

        this.dom.scrollTop = y

      } else if ( this.dom.scrollTop < minScroll ) {

        this.dom.scrollTop = minScroll;

      }

      this.selectedIndex = i;

    } else {

      element.classList.remove( 'active' );

    }

  }

  this.selectedValue = value;

  return this;

};


// Checkbox

UI.Checkbox = function ( boolean ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Checkbox';
  dom.type = 'checkbox';

  this.dom = dom;
  this.setValue( boolean );

  return this;

};

UI.Checkbox.prototype = Object.create( UI.Element.prototype );

UI.Checkbox.prototype.getValue = function () {

  return this.dom.checked;

};

UI.Checkbox.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.checked = value;

  }

  return this;

};


// Color

UI.Color = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Color';
  dom.style.width = '64px';
  dom.style.height = '16px';
  dom.style.border = '0px';
  dom.style.padding = '0px';
  dom.style.backgroundColor = 'transparent';

  try {

    dom.type = 'color';
    dom.value = '#ffffff';

  } catch ( exception ) {}

  this.dom = dom;

  return this;

};

UI.Color.prototype = Object.create( UI.Element.prototype );

UI.Color.prototype.getValue = function () {

  return this.dom.value;

};

UI.Color.prototype.getHexValue = function () {

  return parseInt( this.dom.value.substr( 1 ), 16 );

};

UI.Color.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};

UI.Color.prototype.setHexValue = function ( hex ) {

  this.dom.value = "#" + ( '000000' + hex.toString( 16 ) ).slice( -6 );

  return this;

};


// Number

UI.Number = function ( number ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Number';
  dom.value = '0.00';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

    if ( event.keyCode === 13 ) dom.blur();

  }, false );

  this.min = - Infinity;
  this.max = Infinity;

  this.precision = 2;
  this.step = 1;

  this.dom = dom;
  this.setValue( number );

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  var distance = 0;
  var onMouseDownValue = 0;

  var pointer = new THREE.Vector2();
  var prevPointer = new THREE.Vector2();

  var onMouseDown = function ( event ) {

    event.preventDefault();

    distance = 0;

    onMouseDownValue = parseFloat( dom.value );

    prevPointer.set( event.clientX, event.clientY );

    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );

  };

  var onMouseMove = function ( event ) {

    var currentValue = dom.value;

    pointer.set( event.clientX, event.clientY );

    distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

    var number = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;

    dom.value = Math.min( scope.max, Math.max( scope.min, number ) ).toFixed( scope.precision );

    if ( currentValue !== dom.value ) dom.dispatchEvent( changeEvent );

    prevPointer.set( event.clientX, event.clientY );

  };

  var onMouseUp = function ( event ) {

    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'mouseup', onMouseUp, false );

    if ( Math.abs( distance ) < 2 ) {

      dom.focus();
      dom.select();

    }

  };

  var onChange = function ( event ) {

    var number = parseFloat( dom.value );

    dom.value = isNaN( number ) === false ? number : 0;

  };

  var onFocus = function ( event ) {

    dom.style.backgroundColor = '';
    dom.style.borderColor = '#ccc';
    dom.style.cursor = '';

  };

  var onBlur = function ( event ) {

    dom.style.backgroundColor = 'transparent';
    dom.style.borderColor = 'transparent';
    dom.style.cursor = 'col-resize';

  };

  dom.addEventListener( 'mousedown', onMouseDown, false );
  dom.addEventListener( 'change', onChange, false );
  dom.addEventListener( 'focus', onFocus, false );
  dom.addEventListener( 'blur', onBlur, false );

  return this;

};

UI.Number.prototype = Object.create( UI.Element.prototype );

UI.Number.prototype.getValue = function () {

  return parseFloat( this.dom.value );

};

UI.Number.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.value = value.toFixed( this.precision );

  }

  return this;

};

UI.Number.prototype.setRange = function ( min, max ) {

  this.min = min;
  this.max = max;

  return this;

};

UI.Number.prototype.setPrecision = function ( precision ) {

  this.precision = precision;

  return this;

};


// Integer

UI.Integer = function ( number ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Number';
  dom.value = '0.00';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.min = - Infinity;
  this.max = Infinity;

  this.step = 1;

  this.dom = dom;
  this.setValue( number );

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  var distance = 0;
  var onMouseDownValue = 0;

  var pointer = new THREE.Vector2();
  var prevPointer = new THREE.Vector2();

  var onMouseDown = function ( event ) {

    event.preventDefault();

    distance = 0;

    onMouseDownValue = parseFloat( dom.value );

    prevPointer.set( event.clientX, event.clientY );

    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );

  };

  var onMouseMove = function ( event ) {

    var currentValue = dom.value;

    pointer.set( event.clientX, event.clientY );

    distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

    var number = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;

    dom.value = Math.min( scope.max, Math.max( scope.min, number ) ) | 0;

    if ( currentValue !== dom.value ) dom.dispatchEvent( changeEvent );

    prevPointer.set( event.clientX, event.clientY );

  };

  var onMouseUp = function ( event ) {

    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'mouseup', onMouseUp, false );

    if ( Math.abs( distance ) < 2 ) {

      dom.focus();
      dom.select();

    }

  };

  var onChange = function ( event ) {

    var number = parseInt( dom.value );

    if ( isNaN( number ) === false ) {

      dom.value = number;

    }

  };

  var onFocus = function ( event ) {

    dom.style.backgroundColor = '';
    dom.style.borderColor = '#ccc';
    dom.style.cursor = '';

  };

  var onBlur = function ( event ) {

    dom.style.backgroundColor = 'transparent';
    dom.style.borderColor = 'transparent';
    dom.style.cursor = 'col-resize';

  };

  dom.addEventListener( 'mousedown', onMouseDown, false );
  dom.addEventListener( 'change', onChange, false );
  dom.addEventListener( 'focus', onFocus, false );
  dom.addEventListener( 'blur', onBlur, false );

  return this;

};

UI.Integer.prototype = Object.create( UI.Element.prototype );

UI.Integer.prototype.getValue = function () {

  return parseInt( this.dom.value );

};

UI.Integer.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.value = value | 0;

  }

  return this;

};

UI.Integer.prototype.setRange = function ( min, max ) {

  this.min = min;
  this.max = max;

  return this;

};


// Break

UI.Break = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'br' );
  dom.className = 'Break';

  this.dom = dom;

  return this;

};

UI.Break.prototype = Object.create( UI.Element.prototype );


// HorizontalRule

UI.HorizontalRule = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'hr' );
  dom.className = 'HorizontalRule';

  this.dom = dom;

  return this;

};

UI.HorizontalRule.prototype = Object.create( UI.Element.prototype );


// Button

UI.Button = function ( value ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'button' );
  dom.className = 'Button';

  this.dom = dom;
  this.dom.textContent = value;

  return this;

};

UI.Button.prototype = Object.create( UI.Element.prototype );

UI.Button.prototype.setLabel = function ( value ) {

  this.dom.textContent = value;

  return this;

};
},{}],19:[function(require,module,exports){
module.exports = orientUnderParent

// Utility - changes the parent but preserves global position + rotation
function orientUnderParent( target, parent ) {
  
  // calculate new pos
  var newPos = new THREE.Vector3()
  newPos.setFromMatrixPosition( target.matrixWorld )
  parent.worldToLocal( newPos )
  target.position = newPos
  
  // calculate new rot
  var newRot = new THREE.Quaternion()
  newRot.setFromRotationMatrix( target.matrixWorld )
  var parentRot = new THREE.Quaternion()
  parentRot.setFromRotationMatrix( parent.matrixWorld )
  newRot.multiply( parentRot.inverse() )
  target.quaternion.copy( newRot )

  // attach to parent
  parent.add( target )

}

},{}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],21:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],22:[function(require,module,exports){
var LookingGlassObject = require('./LookingGlassObject.js')

module.exports = LookingGlass


function LookingGlass( connection ) {
  
  this.connection = connection
  this.classes = {}
  this.instances = {}

  this.registerClass( LookingGlassObject )

}

LookingGlass.prototype.registerClass = function( ClassDefinition ) {
 
  var Class = ClassDefinition( this )
  this.classes[ Class.type ] = Class

  this.connection.on( Class.type, function(id, args) {
    args.id = id
    // instantiate with the args, dont skip intialization, is from remote
    new Class( args, false, true )
  })

}
},{"./LookingGlassObject.js":23}],23:[function(require,module,exports){
var extend = require('extend')
var EventEmitter = require('events').EventEmitter
var generateId = require('hat')
var LGProperty = require('./LookingGlassProperty.js')

module.exports = function( universe ) {

  var __connection__ = universe.connection
  var __instances__ = universe.instances

  LookingGlassObject.type = 'LookingGlassObject'

  function LookingGlassObject( args, skipInitialization, fromRemote ) {

    args = args || {}

    // set id
    if ( args.id ) {
      this.id = args.id
      delete args.id      
    } else {
      this.id = generateId()
    }
    __instances__[ this.id ] = this

    // create the core object (if any)
    if (this._createCore) this.core = this._createCore( args )

    // make this an event emitter
    extend( this, new EventEmitter() )

    // define properties
    this._defineProperties({})

    // initialize after we're done defining properties, allowing the subClass to define properties
    if (!skipInitialization) this._initialize(args, fromRemote)

  }

  //
  // Public
  //

  LookingGlassObject.prototype.get = function( key ) {
   
    var prop = this._state[ key ]
    if (!prop) throw new Error( 'No such property "'+key+'" on '+this.constructor.type )
    return prop.get()

  }

  LookingGlassObject.prototype.set = function( key, value ) {
   
    var prop = this._state[ key ]
    if (!prop) throw new Error( 'No such property "'+key+'" on '+this.constructor.type )
    
    // set locally
    this._set( key, value )

    // set remotely
    if ( prop.reliable ) {
      __connection__.emitReliable( this.id, key, prop.serialize() )
    } else {
      __connection__.emitUnreliable( this.id, key, prop.serialize() )
    }

  }

  //
  // Private
  //

  LookingGlassObject.prototype._initialize = function ( args, fromRemote ) {
    // set initial args
    Object.keys(args).map(function(key){
      this.set(key, args[key])
    }.bind(this))

    // listen for remote changes
    __connection__.on( this.id, this._set.bind(this) )

    // announce instantiation
    if (!fromRemote) __connection__.emitReliable( this.constructor.type, this.id, args )
  }

  LookingGlassObject.prototype._defineProperties = function( properties ) {

    // create the state
    if (!this._state) {
      Object.defineProperty( this, '_state', { value: {} } )
    }

    // define each property
    Object.keys(properties).map(function(key){

      this._state[ key ] = new LGProperty( properties[ key ] )

    }.bind(this))    

  }

  LookingGlassObject.prototype._set = function( key, value ) {
    
    var prop = this._state[ key ]

    // deserialize (and set) value if string
    if (typeof value === 'string') {
      prop.deserialize( value )
    // otherwise just set it
    } else {
      prop.set( value )
    }

    // report that this value was updated
    this.emit( key, prop.get() )

  }


  return LookingGlassObject

}

},{"./LookingGlassProperty.js":24,"events":20,"extend":21,"hat":25}],24:[function(require,module,exports){
module.exports = LGProperty

function LGProperty( args ) {

  this.type = args.type
  this.value = args.default 
  this.reliable = (undefined === args.reliable) ? true : args.reliable

}

LGProperty.prototype.set = function( value ) {

  this.value = value

}

LGProperty.prototype.get = function() {

  return this.value

}

LGProperty.prototype.serialize = function() {

  switch( this.type ) {
    
    case 'string':
      return String( this.value )

    case 'int':
      return Number( this.value )

    default:
      return JSON.stringify( this.value )

  }
  
}

LGProperty.prototype.deserialize = function( data ) {

  switch( this.type ) {
    
    case 'string':
      this.value = String( data )
      break

    case 'int':
      this.value = Number( data )
      break

    default:
      this.value = JSON.parse( data )

  }
  
}
},{}],25:[function(require,module,exports){
var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) bits += expandBy;
                else throw new Error('too many ID collisions, use more bits')
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};

},{}]},{},[1])