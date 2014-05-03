var UI = require('./UI.js')
var ComponentInstances = require('./ComponentInstances.js')

module.exports = Sidebar;


function Sidebar( game ) {

  var container = new UI.Panel();

  var showInspector = function() {

    // container.add( new Sidebar.Renderer( game ) );
    // container.add( new Sidebar.Scene( game ) );
    // container.add( new Sidebar.Object3D( game ) );
    // container.add( new Sidebar.Geometry( game ) );
    // container.add( new Sidebar.Material( game ) );
    // container.add( new Sidebar.Animation( game ) );
    container.add( new ComponentInstances( game ) );

  };

  var showComponents = function() {

    container.add( new Sidebar.ComponentClasses( game ) );

  };

  // events

  game.on('sidebarModeChanged', function ( mode ) {

    container.clear();

    switch (mode) {
      
      case 'inspector':
        showInspector();
        break;

      case 'components':
        showComponents();
        break;

    }

  } );

  showInspector();

  return container;

}