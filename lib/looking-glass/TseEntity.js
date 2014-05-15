

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