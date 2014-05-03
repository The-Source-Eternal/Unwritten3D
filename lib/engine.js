var EventEmitter = require('events').EventEmitter
var extend = require('extend')
var ComponentManager = require('./components.js').ComponentManager

module.exports = Engine


var projector = new THREE.Projector()
var raycaster = new THREE.Raycaster()

function Engine() {

  this.primaryScene = new THREE.Scene()
  this.currentCamera = null
  
  this.currentIntersects = []
  this.currentHover = null

  this.compManager = new ComponentManager()

  // implement events
  extend(this, new EventEmitter())

}

Engine.prototype.start = function() {

  // setup renderer
  this.renderer = new THREE.WebGLRenderer()
  this.renderer.setClearColor( 0xffffff )
  this.renderer.setSize( window.innerWidth, window.innerHeight )
  document.body.appendChild( this.renderer.domElement )
  window.addEventListener( 'resize', onWindowResize.bind(this), false )

  // start loop
  this.mainLoop()

}

Engine.prototype.mainLoop = function() {

  requestAnimationFrame( this.mainLoop.bind(this) )

  this.updateMouseOver()
  this.compManager.runComponentUpdate()

  this.emit('mainLoop')

  this.renderer.render( scene, this.currentCamera )

}

Engine.prototype.updateMouseOver = function() {

  // find intersections

  var raycastOrigin = new THREE.Vector3();
  raycastOrigin.setFromMatrixPosition( this.currentCamera.matrixWorld );

  var vector = new THREE.Vector3( 0, 0, 1 )
  projector.unprojectVector( vector, this.currentCamera )
  vector.sub( raycastOrigin ).normalize()

  raycaster.set( raycastOrigin, vector )

  var intersects = raycaster.intersectObjects( scene.children )

  this.currentIntersects = intersects

  // update currentHover

  var oldHover = this.currentHover
  var newHover = intersects[ 0 ] ? intersects[ 0 ].object : null

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

    // update currentHover
    this.currentHover = newHover

    this.emit('hoverChanged', newHover)

  }

}

function onWindowResize() {

  this.currentCamera.aspect = window.innerWidth / window.innerHeight
  this.currentCamera.updateProjectionMatrix()

  this.renderer.setSize( window.innerWidth, window.innerHeight )

}