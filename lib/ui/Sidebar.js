var UI = require('./UI.js')
var ComponentInstances = require('./ComponentInstances.js')
var ComponentClasses = require('./ComponentClasses.js')

module.exports = Sidebar;


function Sidebar( game ) {

  var container = new UI.Panel();

  var showInspector = function( editMode ) {

    // container.add( new Sidebar.Renderer( game ) );
    // container.add( new Sidebar.Scene( game ) );
    // container.add( new Sidebar.Object3D( game ) );
    // container.add( new Sidebar.Geometry( game ) );
    // container.add( new Sidebar.Material( game ) );
    // container.add( new Sidebar.Animation( game ) );
    container.add( new ComponentInstances( game, editMode ) );

  };

  var showComponents = function() {

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
