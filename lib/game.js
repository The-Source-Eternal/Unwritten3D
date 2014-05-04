var EventEmitter = require('events').EventEmitter
var extend = require('extend')
var Sidebar = require('./ui/Sidebar.js')
var Engine = require('./engine.js')
var PointerLockManager = require('./PointerLockManager.js')
var ComponentClass = require('./components.js').ComponentClass

module.exports = Game


function Game() {

  this.currentMode = null
  this.currentSelectObject = null
  this.playerControls = null
  this.transformControls = null

  // implement events
  extend(this, new EventEmitter())

}

var boxSize = 5
var allObjects = []
var gravityRay

var projector, raycaster


Game.prototype = {
  
  start: function() {

    this.engine = new Engine()

    this.setupUi()

    this.defineComponents()
    this.buildLevel()

    this.setupControls()

    this.engine.start()
    this.setMode('paused')

  },

  setMode: function(mode) {

    this.currentMode = mode
    this.emit('modeChanged', mode)

  },

  setupUi: function() {

    // click pause screen to play
    var element = document.getElementById('blocker')
    element.addEventListener( 'click', function(){
      game.setMode('play')
    }, false)

    // inject sidebar
    var sidebar = new Sidebar( this ).setId( 'sidebar' );
    document.body.appendChild( sidebar.dom );

  },

  setupControls: function() {

    var engine = this.engine
    var compManager = engine.compManager

    // transform controls

    this.transformControls = new THREE.TransformControls( engine.currentCamera, document.body )
    engine.helpersScene.add( this.transformControls )

    engine.on('mainLoop', function() {

      // update controls position
      this.transformControls.update();

    }.bind(this))

    this.on('selectedObjectChanged', setTransformControlTarget)
    this.on('modeChanged', setTransformControlTarget)

    function setTransformControlTarget() {
      
      var target = this.currentSelectObject
      this.transformControls.detach();
      if ( this.currentMode === 'scene' && target ) {
        // attach gizmo
        this.transformControls.attach( target );
        // // orient gizmo
        // var lookTarget = this.playerControls.getObject().position;
        // directionVector = this.transformControls.position.clone().sub(lookTarget).setY(0).normalize()
        // var angle = 0.75 * Math.PI + Math.atan2(directionVector.x,directionVector.z)
        // this.transformControls.setRotationFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), angle )
      }

    }

    // camera controls

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

    this.currentSelectObject = target
    this.emit('selectedObjectChanged', target)

  },


  updatePlayerControls: function() {

    // check floor

    this.playerControls.isOnObject( false )

    gravityRay.ray.origin.copy( this.playerControls.getObject().position )
    gravityRay.ray.origin.y -= 10

    var intersections = gravityRay.intersectObjects( allObjects )

    if ( intersections.length > 0 ) {

      var distance = intersections[ 0 ].distance

      if ( distance > 0 && distance < 10 ) {

        this.playerControls.isOnObject( true )

      }

    }

    this.playerControls.update()
  },

  buildLevel: function() {

    var engine = this.engine

    var geometry, material, mesh

    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 )
    engine.currentCamera = camera

    var scene = engine.primaryScene
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 )

    var light = new THREE.DirectionalLight( 0xffffff, 1.5 )
    light.position.set( 1, 1, 1 )
    scene.add( light )

    var light = new THREE.DirectionalLight( 0xffffff, 0.75 )
    light.position.set( -1, - 0.5, -1 )
    scene.add( light )

    //

    this.playerControls = new THREE.PointerLockControls( camera )
    scene.add( this.playerControls.getObject() )

    gravityRay = new THREE.Raycaster()
    gravityRay.ray.direction.set( 0, -1, 0 )

    // floor

    geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 )
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

    geometry = new THREE.BoxGeometry( boxSize, boxSize, boxSize )

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
      engine.compManager.instantiateComponent( hoverComponent, mesh )
      var spinner = engine.compManager.instantiateComponent( spinnerComponent, mesh )
      spinner.instance.updateDisabled = true

      allObjects.push( mesh )

    }

  },

  defineComponents: function() {

    var engine = this.engine

    spinnerComponent = new ComponentClass({
      name: 'spinner',
      src: [
        '// spinner',
        'this.hitPoints = 250',
        'this.activate = '+function () {
          this.updateDisabled = !this.updateDisabled
        },
        'this.update = '+function () {
          target.rotateY(0.1)
        },
        ].join('\n')
    })

    engine.compManager.registerComponentClass( spinnerComponent )

    hoverComponent = new ComponentClass({
      name: 'hover',
      src: [
        '// hover',
        'var oldColor',
        'this.mouseEnter = '+function () {
          oldColor = target.material.color.getHex()
          target.material.color.setHex( 0xff0000 )
        },
        'this.mouseExit = '+function () {
          target.material.color.setHex( oldColor )
        },
        ].join('\n')
    })

    engine.compManager.registerComponentClass( hoverComponent )

  },


}


function drawLine(start, end) {
    
    console.log('drawing line...',start.toArray(), end.toArray())

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
      var target = this.currentSelectObject
      if (target) this.activateObject( target )
      break

    case 'scene':
      // update selectedObject
      var target = this.engine.getHover(event)
      if (target) this.setSelectedObject( target )

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
          this.transformControls.setMode('translate')
          break
        // 'E' key
        case 69:
          this.transformControls.setMode('rotate')
          break
        // 'R' key
        case 82:
          this.transformControls.setMode('scale')
          break
      }
      break

  }



}