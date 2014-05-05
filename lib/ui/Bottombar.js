var UI = require('./UI.js')

module.exports = Bottombar


function Bottombar( game ) {

  var container = new UI.Panel().onClick( function( event ) {

    event.stopPropagation()

  } )
  var translateButton, rotateButton, scaleButton
  var gridNumber, snapCheckbox, localCheckbox

  var buttons = new UI.Panel()
  container.add( buttons )

  // translate / rotate / scale

  translateButton = new UI.Button( 'translate' ).onClick( function (event) {

    game.emit('transformModeChanged', 'translate' )
    event.stopPropagation()

  } )
  buttons.add( translateButton )

  rotateButton = new UI.Button( 'rotate' ).onClick( function (event) {

    game.emit('transformModeChanged', 'rotate' )
    event.stopPropagation()

  } )
  buttons.add( rotateButton )

  scaleButton = new UI.Button( 'scale' ).onClick( function (event) {

    game.emit('transformModeChanged', 'scale' )
    event.stopPropagation()

  } )
  buttons.add( scaleButton )



  // grid

  gridNumber = new UI.Number( 25 ).onChange( update )
  gridNumber.dom.style.width = '42px'
  buttons.add( new UI.Text( 'Grid: ' ) )
  buttons.add( gridNumber )

  snapCheckbox = new UI.Checkbox( false ).onChange( update )
  buttons.add( snapCheckbox )
  buttons.add( new UI.Text( 'snap' ) )

  localCheckbox = new UI.Checkbox( false ).onChange( update )
  buttons.add( localCheckbox )
  buttons.add( new UI.Text( 'local' ) )

  update()
  setActiveButton( game.transformControlsMode || 'translate' )

  // events

  game.on('modeChanged', function ( mode ) {

    container.dom.classList.add( 'hidden' )

    switch (mode) {

      case 'scene':
        showMenubar()
        break

      case 'components':
        showMenubar()
        break

    }

  } )

  game.on('transformModeChanged', setActiveButton)

  //

  function update() {

    game.emit('snapChanged', snapCheckbox.getValue() === true ? gridNumber.getValue() : null )
    game.emit('spaceChanged', localCheckbox.getValue() === true ? "local" : "world" )

  }

  function showMenubar() {

    container.dom.classList.remove( 'hidden' )

  }

  function setActiveButton(mode) {

    translateButton.dom.classList.remove('active')
    rotateButton.dom.classList.remove('active')
    scaleButton.dom.classList.remove('active')

    var targetButton

    switch (mode) {

      case 'translate':
        targetButton = translateButton
        break

      case 'rotate':
        targetButton = rotateButton
        break

      case 'scale':
        targetButton = scaleButton
        break

    }

    targetButton.dom.classList.add('active')

  }


  return container

}
