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