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

module.exports = Game


function Game() {

  this.universe = null
  this.currentMode = null
  this.currentSelectedObject = null
  this.playerControls = null
  this.transformControls = null
  this.transformControlsMode = null

  this.storage = new Storage()

  // implement events
  extend(this, new EventEmitter())

}


var gravityRay

var projector, raycaster


Game.prototype = {
  
  start: function() {

    this.engine = new Engine()

    this.setupUniverse()
    this.setupUi()

    this.loadGameState(function initializeGame( loadSuccessful ) {

      // on first time, generate world
      if ( !loadSuccessful ) {

        generateExampleWorld( this )

      }

      this.setupCamera()

      this.setupControls()

      this.engine.start()
      this.setMode('paused')

      this.saveGameState()

    }.bind(this))

  },

  setMode: function(mode) {

    this.currentMode = mode
    this.emit('modeChanged', mode)

  },

  setupUniverse: function() {

    var fakeConnection = {
      on:  console.log.bind(console, 'on'),
      emitReliable:  console.log.bind(console, 'emitReliable'),
      emitUnreliable:  console.log.bind(console, 'emitUnreliable'),
    }

    var universe = new LookingGlass( fakeConnection )
    // note - you must manually register the whole class hierarchy
    universe.registerClass( TseObject3D )
    universe.registerClass( TseEntity )
    universe.registerClass( TseComponentClass )

    this.universe = universe

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

    this.transformControls = new THREE.TransformControls( engine.currentCamera, document.body )
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
      
      var target = this.currentSelectedObject
      this.transformControls.detach()
      if ( this.currentMode === 'scene' && target ) {
        // attach gizmo
        this.transformControls.attach( target )
        // // orient gizmo
        // var lookTarget = this.playerControls.getObject().position
        // directionVector = this.transformControls.position.clone().sub(lookTarget).setY(0).normalize()
        // var angle = 0.75 * Math.PI + Math.atan2(directionVector.x,directionVector.z)
        // this.transformControls.setRotationFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), angle )
      }

    }

    // camera controls

    this.playerControls = new THREE.PointerLockControls( this.engine.currentCamera )
    this.engine.primaryScene.add( this.playerControls.getObject() )

    gravityRay = new THREE.Raycaster()
    gravityRay.ray.direction.set( 0, -1, 0 )

    var pointerLockManager = new PointerLockManager()
    
    pointerLockManager.on('broken',function() {
      this.setMode('paused')
    }.bind(this))

    this.on('modeChanged', function(mode){

      // handle pointerLock
      if (mode === 'play') {
        pointerLockManager.requestPointerLock()
        this.playerControls.enable()
      } else {
        this.playerControls.disable()
        pointerLockManager.exitPointerLock()
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


  updatePlayerControls: function() {

    // check floor

    this.playerControls.isOnObject( false )

    gravityRay.ray.origin.copy( this.playerControls.getObject().position )
    gravityRay.ray.origin.y -= 10

    var solidComponent = this.engine.compManager.getComponentClassByName('solid')
    var solidObjects = solidComponent.instances.map( function(comp){ return comp.target } )

    var intersections = gravityRay.intersectObjects( solidObjects )

    if ( intersections.length > 0 ) {

      var distance = intersections[ 0 ].distance

      if ( distance > 0 && distance < 10 ) {

        this.playerControls.isOnObject( true )

      }

    }

    this.playerControls.update()
  },

  setupCamera: function() {

    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 )
    this.engine.currentCamera = camera

  },

  // save nothing! for now
  saveGameState: function () {
  },

  // force fail loadGameState for now
  loadGameState: function( callback ) {
    callback( false )
  },

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
      // activate current hover
      var target = this.currentSelectedObject
      if (target) this.activateObject( target )
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

