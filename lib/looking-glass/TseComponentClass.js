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

  }  // end TseComponentClass()

  //
  // Public
  //

  TseComponentClass.prototype.instantiate = function ( target ) {

    return this.core.instantiate( target )

  },  // end TseComponentClass.prototype.instantiate()

  //
  // Private
  //

  TseComponentClass.prototype._createCore = function() {
    
    return new ComponentClass()
    
  }  // end TseComponentClass.prototype._createCore()


  return TseComponentClass

}  // end module.exports ()
