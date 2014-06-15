var UI = require('./UI.js')

module.exports = CodeEditor


function CodeEditor( game ) {

  var container = new UI.Panel()
  
  var codeEditor

  var showEditor = function( editMode ) {

    codeEditor = new UI.CodeEditor()
    container.dom.classList.remove('code-editor-minimized')
    container.dom.classList.add('code-editor-expanded')
    container.add( codeEditor )

  }

  var hideEditor = function() {

    container.clear()
    container.dom.classList.remove('code-editor-expanded')
    container.dom.classList.add('code-editor-minimized')

  }

  // events
  var currentComponentClass

  game.on( 'currentComponentClassChanged', function ( componentClass ) {

    // if a class is already open, save the contents
    if ( currentComponentClass ) {
      currentComponentClass.setCode( codeEditor.getValue() )
    }

    codeEditor.setValue( componentClass.getCode() )

    currentComponentClass = componentClass

  } )

  game.on('modeChanged', function ( mode ) {

    switch (mode) {
      
      case 'components':
        showEditor()
        break

      default:
        hideEditor()
        break

    }

  } )

  return container

}
