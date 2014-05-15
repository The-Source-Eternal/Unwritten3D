

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