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