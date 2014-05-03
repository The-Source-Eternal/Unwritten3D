var UI = require('./UI.js')

module.exports = ComponentInstances


function ComponentInstances( game, editMode ) {

  var compManager = game.engine.compManager

  var container = new UI.Panel()

  drawPanel()

  // events

  game.on('selectedObjectChanged', function () {

    container.clear()
    drawPanel()

  } )

  game.on('componentClassRegistryChanged', function () {

    container.clear()
    drawPanel()

  } )

  return container

  //

  function drawPanel() {

    var selectedObject = game.getSelectedObject()

    if ( selectedObject ) {

      drawComponentPanels( selectedObject )
      if (editMode) drawNewComponent( selectedObject )

    }

  }

  function drawComponentPanels ( selectedObject ) {

    var components = compManager.componentsForObject( selectedObject )

    components.forEach( function( component ) {
    
      container.add( createComponentPanel( component ) )

    } )

  }

  function drawNewComponent ( selectedObject ) {

    var newComponentPanel = new UI.Panel()

    var options = {
      null: '...'
    }

    Object.keys(compManager.componentClasses).forEach( function (uuid) {

      var componentClass = compManager.componentClasses[ uuid ]
      options[ componentClass.uuid ] = componentClass.name

    } )

    options.new = '( New Component )'

    var newComponentLabel = new UI.Text( 'Add' ).setWidth( '50px' ).setColor( '#888' ).setFontSize( '14px' )
    var newComponentSelect = new UI.Select().setWidth( '200px' ).setOptions( options ).onChange( function () {

      var uuid = newComponentSelect.getValue()
      
      if ( uuid === 'new' ) {

        var newComponentClass = new ComponentClass()
        compManager.registerComponentClass( newComponentClass )
        uuid = newComponentClass.uuid
        
        compManager.setSidebarMode('components')
        // compManager.signals.currentComponentClassChanged.dispatch( newComponentClass )

      }

      var componentClass = compManager.componentClasses[ uuid ]
      compManager.instantiateComponent( componentClass, selectedObject )

    } )

    newComponentPanel.add( newComponentLabel )
    newComponentPanel.add( newComponentSelect )
    container.add( newComponentPanel )

  }

  function createComponentPanel ( component ) {
    
    var panel = new UI.CollapsiblePanel()
    panel.addStatic( new UI.Text( component.class.name ) )
    panel.add( new UI.Break() )

    if (editMode) {

      // Edit + Delete

      var componentCrudRow = new UI.Panel().setFloat( 'right' )

      var componentEditButton = new UI.Button( 'Edit' ).onClick( function () {
        
        compManager.setSidebarMode('components')
        // compManager.signals.currentComponentClassChanged.dispatch( component.class )

      } )

      var componentDeleteButton = new UI.Button( 'Delete' ).onClick( function () {
        
        compManager.deleteComponentInstance( component )
        // compManager.signals.componentClassRegistryChanged.dispatch()

      } )

      componentCrudRow.add( componentEditButton )
      componentCrudRow.add( componentDeleteButton )
      panel.addStatic( componentCrudRow )

    }

    // Properties

    var componentProperties = new UI.Panel()

    Object.keys( component.instance ).forEach( function ( key ) {

      var value = component.instance[ key ]

      switch ( typeof value ) {

        case 'number':

          var propertyPanel = createNumberPropertyPanel( component.instance, key, value )
          panel.add( propertyPanel )
          break

        default:
          
          var propertyPanel = new UI.Panel()
          propertyPanel.add( new UI.Text( key ).setWidth( '120px' ) )
          propertyPanel.add( new UI.Text( '(' + typeof value + ')' ).setWidth( '60px' ) )
          panel.add( propertyPanel )
          break

      }

    } )

    panel.add( componentProperties )


    return panel

  }

  function createNumberPropertyPanel( instance, key, value ) {

    var propertyPanel = new UI.Panel()

    var numberSetter = new UI.Number().setWidth( '60px' ).setValue( value )
    numberSetter.onChange( function () {

      instance[ key ] = numberSetter.getValue()

    } )

    propertyPanel.add( new UI.Text( key ).setWidth( '120px' ) )
    propertyPanel.add( numberSetter )
    
    return propertyPanel

  }

}