var UI = require('./UI.js')
var ComponentInstances = require('./ComponentInstances.js')
var ComponentClasses = require('./ComponentClasses.js')
var SidebarModes = require('./SidebarModes.js')

module.exports = Sidebar;


function Sidebar( game ) {

  var container = new UI.Panel();

  var showInspector = function( editMode ) {

    if (editMode) container.add( new SidebarModes( game ) );
    container.add( new ComponentInstances( game, editMode ) );

  };

  var showComponents = function() {

    container.add( new SidebarModes( game ) );
    container.add( new ComponentClasses( game ) );

  };

  // events

  game.on('modeChanged', function ( mode ) {

    container.clear();

    switch (mode) {
      
      case 'play':
        showInspector( false );
        break;

      case 'scene':
        showInspector( true );
        break;

      case 'components':
        showComponents();
        break;

    }

  } );

  showInspector();

  return container;

}
