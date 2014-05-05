var UI = require('./UI.js')

module.exports = Topbar


function Topbar( game ) {

  var container = new UI.Panel().onClick( function( event ) {

    event.stopPropagation()

  } )

  function drawMenubar() {

    container.dom.classList.remove( 'hidden' )
    container.add( new UI.Text( 'This is the Topbar' ) )

  }

  // events

  game.on('modeChanged', function ( mode ) {

    container.clear()
    container.dom.classList.add( 'hidden' )

    switch (mode) {

      case 'scene':
        drawMenubar()
        break

      case 'components':
        drawMenubar()
        break

    }

  } )

  return container

}
