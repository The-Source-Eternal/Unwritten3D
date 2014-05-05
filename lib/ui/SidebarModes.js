var UI = require('./UI.js')

module.exports = SidebarModes


function SidebarModes( game ) {

  var container = new UI.Panel()
  container.setId( 'sidebar-modes' )

  // inspector

  var inspectorButton = new UI.Button( 'Inspector' ).onClick( function() {

    game.setMode( 'scene' )

  } )
  container.add( inspectorButton )

  // components

  var componentsButton = new UI.Button( 'Components' ).setFloat('right').onClick( function() {

    game.setMode( 'components' )

  } )
  container.add( componentsButton )

  // set active

  if ( game.currentMode == 'scene' ) {

    inspectorButton.dom.classList.add('active')

  } else if ( game.currentMode == 'components' ) {

    componentsButton.dom.classList.add('active')

  }

  return container

}
