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