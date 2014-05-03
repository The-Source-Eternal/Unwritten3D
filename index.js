var setupPointerlock = require('./lib/setupPointerlock.js')

// var camera, scene, renderer
var controls

var boxSize = 5
var allObjects = []
var currentHover
var gravityRay

var projector, raycaster

setupPointerlock( pointerLockUpdate )
init()
mainLoop()

function init() {

  var geometry, material, mesh

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 )

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog( 0xffffff, 0, 750 )

  var light = new THREE.DirectionalLight( 0xffffff, 1.5 )
  light.position.set( 1, 1, 1 )
  scene.add( light )

  var light = new THREE.DirectionalLight( 0xffffff, 0.75 )
  light.position.set( -1, - 0.5, -1 )
  scene.add( light )

  //

  controls = new THREE.PointerLockControls( camera )
  scene.add( controls.getObject() )

  gravityRay = new THREE.Raycaster()
  gravityRay.ray.direction.set( 0, -1, 0 )

  //

  projector = new THREE.Projector()
  raycaster = new THREE.Raycaster()

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

  // randomly place boxes
  for ( var i = 0; i < 500; i ++ ) {

    material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } )

    var mesh = new THREE.Mesh( geometry, material )
    mesh.position.x = Math.floor( Math.random() * 50 - boxSize/2 ) * boxSize
    mesh.position.y = Math.floor( Math.random() * 20 ) * boxSize + boxSize/2
    mesh.position.z = Math.floor( Math.random() * 50 - boxSize/2 ) * boxSize
    scene.add( mesh )

    material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )

    allObjects.push( mesh )

  }

  //

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor( 0xffffff )
  renderer.setSize( window.innerWidth, window.innerHeight )

  document.body.appendChild( renderer.domElement )

  //

  window.addEventListener( 'resize', onWindowResize, false )

}

function pointerLockUpdate(err, isLocked) {
  controls.enabled = isLocked
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

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize( window.innerWidth, window.innerHeight )

}

function mainLoop() {

  requestAnimationFrame( mainLoop )


  updatePlayerControls()
  updateMouseOver()

  //

  renderer.render( scene, camera )

}

function updateMouseOver() {
// find intersections

  var raycastOrigin = new THREE.Vector3();
  raycastOrigin.setFromMatrixPosition( controls.getObject().matrixWorld );

  var vector = new THREE.Vector3( 0, 0, 1 )
  projector.unprojectVector( vector, camera )
  vector.sub( raycastOrigin ).normalize()

  raycaster.set( raycastOrigin, vector )

  var intersects = raycaster.intersectObjects( scene.children )

  // if (intersects[0]) {
  //   var debugOrigin = raycastOrigin.clone().add(vector.clone().multiplyScalar(0.5));
  //   drawLine( debugOrigin, intersects[0].point )
  // }

  updateIntersects(intersects)
}

function updateIntersects(intersects) {
  if ( intersects.length > 0 ) {

    if ( currentHover != intersects[ 0 ].object ) {

      if ( currentHover ) currentHover.material.color.setHex( currentHover.currentHex )

      currentHover = intersects[ 0 ].object
      currentHover.currentHex = currentHover.material.color.getHex()
      currentHover.material.color.setHex( 0xff0000 )

    }

  } else {

    if ( currentHover ) currentHover.material.color.setHex( currentHover.currentHex )

    currentHover = null

  }
}

function updatePlayerControls() {

  // check floor

  controls.isOnObject( false )

  gravityRay.ray.origin.copy( controls.getObject().position )
  gravityRay.ray.origin.y -= 10

  var intersections = gravityRay.intersectObjects( allObjects )

  if ( intersections.length > 0 ) {

    var distance = intersections[ 0 ].distance

    if ( distance > 0 && distance < 10 ) {

      controls.isOnObject( true )

    }

  }

  controls.update()
}