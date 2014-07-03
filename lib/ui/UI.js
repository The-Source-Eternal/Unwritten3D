// Derived heavily from three.js/editor

var UI = {};

module.exports = UI;


UI.Element = function () {};

UI.Element.prototype = {

  setId: function ( id ) {

    this.dom.id = id;
    
    return this;

  },

  setClass: function ( name ) {

    this.dom.className = name;

    return this;

  },

  setStyle: function ( style, array ) {

    for ( var i = 0; i < array.length; i ++ ) {

      this.dom.style[ style ] = array[ i ];

    }

  },

  setDisabled: function ( value ) {

    this.dom.disabled = value;

    return this;

  },

  setTextContent: function ( value ) {

    this.dom.textContent = value;

    return this;

  }

}  // end UI.Element.prototype {}

// properties

var properties = [ 'position', 'float', 'left', 'top', 'right', 'bottom', 'width', 'height',
'border', 'borderLeft', 'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display',
'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding',
'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color', 'backgroundColor',
'opacity', 'fontSize', 'fontWeight', 'textTransform', 'cursor' ];

properties.forEach( function ( property ) {

  var method = 'set' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

  UI.Element.prototype[ method ] = function () {

    this.setStyle( property, arguments );
    return this;

  };

} );

// events

var events = [ 'KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'Change' ];

events.forEach( function ( event ) {

  var method = 'on' + event;

  UI.Element.prototype[ method ] = function ( callback ) {

    this.dom.addEventListener( event.toLowerCase(), callback.bind( this ), false );

    return this;

  };

} );


// Panel

UI.Panel = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Panel';

  this.dom = dom;

  return this;
};  // end UI.Panel()

UI.Panel.prototype = Object.create( UI.Element.prototype );

UI.Panel.prototype.add = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.dom.appendChild( arguments[ i ].dom );

  }

  return this;

};  // end UI.Panel.prototype.add()

UI.Panel.prototype.remove = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.dom.removeChild( arguments[ i ].dom );

  }

  return this;

};  // end UI.Panel.prototype.remove()

UI.Panel.prototype.clear = function () {

  while ( this.dom.children.length ) {

    this.dom.removeChild( this.dom.lastChild );

  }

};  // end UI.Panel.prototype.clear()


// Collapsible Panel

UI.CollapsiblePanel = function () {

  UI.Panel.call( this );

  this.dom.className = 'Panel CollapsiblePanel';

  this.button = document.createElement( 'div' );
  this.button.className = 'CollapsiblePanelButton';
  this.dom.appendChild( this.button );

  var scope = this;
  this.button.addEventListener( 'click', function ( event ) {

    scope.toggle();

  }, false );

  this.content = document.createElement( 'div' );
  this.content.className = 'CollapsibleContent';
  this.dom.appendChild( this.content );

  this.isCollapsed = false;

  return this;

};  // end UI.CollapsiblePanel()

UI.CollapsiblePanel.prototype = Object.create( UI.Panel.prototype );

UI.CollapsiblePanel.prototype.addStatic = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.dom.insertBefore( arguments[ i ].dom, this.content );

  }

  return this;

};  // end UI.CollapsiblePanel.prototype.addStatic()

UI.CollapsiblePanel.prototype.removeStatic = UI.Panel.prototype.remove;

UI.CollapsiblePanel.prototype.clearStatic = function () {

  this.dom.childNodes.forEach( function ( child ) {

    if ( child !== this.content ) {

      this.dom.removeChild( child );

    }

  });

};  // end UI.CollapsiblePanel.prototype.clearStatic()

UI.CollapsiblePanel.prototype.add = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.content.appendChild( arguments[ i ].dom );

  }

  return this;

};  // end UI.CollapsiblePanel.prototype.add()

UI.CollapsiblePanel.prototype.remove = function () {

  for ( var i = 0; i < arguments.length; i ++ ) {

    this.content.removeChild( arguments[ i ].dom );

  }

  return this;

};  // end UI.CollapsiblePanel.prototype.remove()

UI.CollapsiblePanel.prototype.clear = function () {

  while ( this.content.children.length ) {

    this.content.removeChild( this.content.lastChild );

  }

};  // end UI.CollapsiblePanel.prototype.clear()

UI.CollapsiblePanel.prototype.toggle = function() {

  this.setCollapsed( !this.isCollapsed );

};  // end UI.CollapsiblePanel.prototype.toggle()

UI.CollapsiblePanel.prototype.collapse = function() {

  this.setCollapsed( true );

};  // end UI.CollapsiblePanel.prototype.collapse()

UI.CollapsiblePanel.prototype.expand = function() {

  this.setCollapsed( false );

};  // end UI.CollapsiblePanel.prototype.expand()

UI.CollapsiblePanel.prototype.setCollapsed = function( setCollapsed ) {

  if ( setCollapsed ) {

    this.dom.classList.add('collapsed');

  } else {

    this.dom.classList.remove('collapsed');

  }

  this.isCollapsed = setCollapsed;

};  // end UI.CollapsiblePanel.prototype.setCollapsed()

// Text

UI.Text = function ( text ) {

  UI.Element.call( this );

  var dom = document.createElement( 'span' );
  dom.className = 'Text';
  dom.style.cursor = 'default';
  dom.style.display = 'inline-block';
  dom.style.verticalAlign = 'middle';

  this.dom = dom;
  this.setValue( text );

  return this;

};  // end UI.Text

UI.Text.prototype = Object.create( UI.Element.prototype );

UI.Text.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.textContent = value;

  }

  return this;

};  // end UI.Text.prototype.setValue()


// Input

UI.Input = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Input';
  dom.style.padding = '2px';
  dom.style.border = '1px solid #ccc';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;

  return this;

};  // end UI.Input()

UI.Input.prototype = Object.create( UI.Element.prototype );

UI.Input.prototype.getValue = function () {

  return this.dom.value;

};  // end UI.Input.prototype.getValue()

UI.Input.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};  // end UI.Input.prototype.setValue()


// TextArea

UI.TextArea = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'textarea' );
  dom.className = 'TextArea';
  dom.style.padding = '2px';
  dom.style.border = '1px solid #ccc';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;

  return this;

};  // end UI.TextArea()

UI.TextArea.prototype = Object.create( UI.Element.prototype );

UI.TextArea.prototype.getValue = function () {

  return this.dom.value;

};  // end UI.TextArea.prototype.getValue()

UI.TextArea.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};  // end UI.TextArea.prototype.setValue()

// CodeEditor

UI.CodeEditor = function () {

  UI.Element.call( this );

  var scope = this;

  var dom;

  var setDom = function(element) {
    dom = element;
  }

  var codeMirrorOptions = {
    mode: 'javascript',
    theme: 'monokai',
    lineNumbers: true
  }

  var codeMirror = CodeMirror(setDom, codeMirrorOptions);

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.dom = dom;
  this.codeMirror = codeMirror;

  return this;

};  // end UI.CodeEditor()

UI.CodeEditor.prototype = Object.create( UI.Element.prototype );

UI.CodeEditor.prototype.getValue = function () {

  return this.codeMirror.getValue();

};  // end UI.CodeEditor.prototype.getValue()

UI.CodeEditor.prototype.setValue = function ( value ) {

  this.codeMirror.setValue( value );

  return this;

};  // end UI.CodeEditor.prototype.setValue()

// Select

UI.Select = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'select' );
  dom.className = 'Select';
  dom.style.width = '64px';
  dom.style.height = '16px';
  dom.style.border = '0px';
  dom.style.padding = '0px';

  this.dom = dom;

  return this;

};  // end UI.Select()

UI.Select.prototype = Object.create( UI.Element.prototype );

UI.Select.prototype.setMultiple = function ( boolean ) {

  this.dom.multiple = boolean;

  return this;

};  // end UI.Select.prototype.setMultiple()

UI.Select.prototype.setOptions = function ( options ) {

  var selected = this.dom.value;

  while ( this.dom.children.length > 0 ) {

    this.dom.removeChild( this.dom.firstChild );

  }

  for ( var key in options ) {

    var option = document.createElement( 'option' );
    option.value = key;
    option.innerHTML = options[ key ];
    this.dom.appendChild( option );

  }

  this.dom.value = selected;

  return this;

};  // end UI.Select.prototype.setOptions()

UI.Select.prototype.getValue = function () {

  return this.dom.value;

};  // end UI.Select.prototype.getValue()

UI.Select.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};  // end UI.Select.prototype.setValue()

// FancySelect

UI.FancySelect = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'div' );
  dom.className = 'FancySelect';
  dom.tabIndex = 0; // keyup event is ignored without setting tabIndex

  // Broadcast for object selection after arrow navigation
  var changeEvent = document.createEvent('HTMLEvents');
  changeEvent.initEvent( 'change', true, true );

  // Prevent native scroll behavior
  dom.addEventListener( 'keydown', function (event) {

    switch ( event.keyCode ) {
      case 38: // up
      case 40: // down
        event.preventDefault();
        event.stopPropagation();
        break;
    }

  }, false);

  // Keybindings to support arrow navigation
  dom.addEventListener( 'keyup', function (event) {

    switch ( event.keyCode ) {
      case 38: // up
      case 40: // down
        scope.selectedIndex += ( event.keyCode == 38 ) ? -1 : 1;

        if ( scope.selectedIndex >= 0 && scope.selectedIndex < scope.options.length ) {

          // Highlight selected dom elem and scroll parent if needed
          scope.setValue( scope.options[ scope.selectedIndex ].value );

          scope.dom.dispatchEvent( changeEvent );

        }

        break;
    }

  }, false);

  this.dom = dom;

  this.options = [];
  this.selectedIndex = -1;
  this.selectedValue = null;

  return this;

};  // end UI.FancySelect()

UI.FancySelect.prototype = Object.create( UI.Element.prototype );

UI.FancySelect.prototype.setOptions = function ( options ) {

  var scope = this;

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  while ( scope.dom.children.length > 0 ) {

    scope.dom.removeChild( scope.dom.firstChild );

  }

  scope.options = [];

  for ( var i = 0; i < options.length; i ++ ) {

    var option = options[ i ];

    var div = document.createElement( 'div' );
    div.className = 'option';
    div.innerHTML = option.html;
    div.value = option.value;
    scope.dom.appendChild( div );

    scope.options.push( div );

    div.addEventListener( 'click', function ( event ) {

      scope.setValue( this.value );
      scope.dom.dispatchEvent( changeEvent );

    }, false );

  }  // end for options.length

  return scope;

};  // end UI.FancySelect.prototype.setOptions()

UI.FancySelect.prototype.getValue = function () {

  return this.selectedValue;

};  // end UI.FancySelect.prototype.getValue()

UI.FancySelect.prototype.setValue = function ( value ) {

  for ( var i = 0; i < this.options.length; i ++ ) {

    var element = this.options[ i ];

    if ( element.value === value ) {

      element.classList.add( 'active' );

      // scroll into view

      var y = element.offsetTop - this.dom.offsetTop;
      var bottomY = y + element.offsetHeight;
      var minScroll = bottomY - this.dom.offsetHeight;

      if ( this.dom.scrollTop > y ) {

        this.dom.scrollTop = y

      } else if ( this.dom.scrollTop < minScroll ) {

        this.dom.scrollTop = minScroll;

      }

      this.selectedIndex = i;

    } else {

      element.classList.remove( 'active' );

    }

  }

  this.selectedValue = value;

  return this;

};  // end UI.FancySelect.prototype.setValue()


// Checkbox

UI.Checkbox = function ( boolean ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Checkbox';
  dom.type = 'checkbox';

  this.dom = dom;
  this.setValue( boolean );

  return this;

};  // end UI.Checkbox()

UI.Checkbox.prototype = Object.create( UI.Element.prototype );

UI.Checkbox.prototype.getValue = function () {

  return this.dom.checked;

};  // end UI.Checkbox.prototype.getValue()

UI.Checkbox.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.checked = value;

  }

  return this;

};  // end UI.Checkbox.prototype.setValue()


// Color

UI.Color = function () {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Color';
  dom.style.width = '64px';
  dom.style.height = '16px';
  dom.style.border = '0px';
  dom.style.padding = '0px';
  dom.style.backgroundColor = 'transparent';

  try {

    dom.type = 'color';
    dom.value = '#ffffff';

  } catch ( exception ) {}

  this.dom = dom;

  return this;

};  // end UI.Color()

UI.Color.prototype = Object.create( UI.Element.prototype );

UI.Color.prototype.getValue = function () {

  return this.dom.value;

};  // end UI.Color.prototype.getValue()

UI.Color.prototype.getHexValue = function () {

  return parseInt( this.dom.value.substr( 1 ), 16 );

};  // end UI.Color.prototype.getHexValue()

UI.Color.prototype.setValue = function ( value ) {

  this.dom.value = value;

  return this;

};  // end UI.Color.prototype.setValue

UI.Color.prototype.setHexValue = function ( hex ) {

  this.dom.value = "#" + ( '000000' + hex.toString( 16 ) ).slice( -6 );

  return this;

};  // end UI.Color.prototype.setHexValue


// Number

UI.Number = function ( number ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Number';
  dom.value = '0.00';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

    if ( event.keyCode === 13 ) dom.blur();

  }, false );

  this.min = - Infinity;
  this.max = Infinity;

  this.precision = 2;
  this.step = 1;

  this.dom = dom;
  this.setValue( number );

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  var distance = 0;
  var onMouseDownValue = 0;

  var pointer = new THREE.Vector2();
  var prevPointer = new THREE.Vector2();

  var onMouseDown = function ( event ) {

    event.preventDefault();

    distance = 0;

    onMouseDownValue = parseFloat( dom.value );

    prevPointer.set( event.clientX, event.clientY );

    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );

  };  // end onMouseDown()

  var onMouseMove = function ( event ) {

    var currentValue = dom.value;

    pointer.set( event.clientX, event.clientY );

    distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

    var number = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;

    dom.value = Math.min( scope.max, Math.max( scope.min, number ) ).toFixed( scope.precision );

    if ( currentValue !== dom.value ) dom.dispatchEvent( changeEvent );

    prevPointer.set( event.clientX, event.clientY );

  };  // end onMouseMove()

  var onMouseUp = function ( event ) {

    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'mouseup', onMouseUp, false );

    if ( Math.abs( distance ) < 2 ) {

      dom.focus();
      dom.select();

    }

  };  // end onMouseUp()

  var onChange = function ( event ) {

    var number = parseFloat( dom.value );

    dom.value = isNaN( number ) === false ? number : 0;

  };  // end onChange()

  var onFocus = function ( event ) {

    dom.style.backgroundColor = '';
    dom.style.borderColor = '#ccc';
    dom.style.cursor = '';

  };  // end onFocus

  var onBlur = function ( event ) {

    dom.style.backgroundColor = 'transparent';
    dom.style.borderColor = 'transparent';
    dom.style.cursor = 'col-resize';

  };  // end onBlur()

  dom.addEventListener( 'mousedown', onMouseDown, false );
  dom.addEventListener( 'change', onChange, false );
  dom.addEventListener( 'focus', onFocus, false );
  dom.addEventListener( 'blur', onBlur, false );

  return this;

};  // end UI.Number()

UI.Number.prototype = Object.create( UI.Element.prototype );

UI.Number.prototype.getValue = function () {

  return parseFloat( this.dom.value );

};  // end UI.Number.prototype.getValue()

UI.Number.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.value = value.toFixed( this.precision );

  }

  return this;

};  // end UI.Number.prototype.setValue()

UI.Number.prototype.setRange = function ( min, max ) {

  this.min = min;
  this.max = max;

  return this;

};  // end UI.Number.prototype.setRange()

UI.Number.prototype.setPrecision = function ( precision ) {

  this.precision = precision;

  return this;

};  // end UI.Number.prototype.setPrecision()


// Integer

UI.Integer = function ( number ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'input' );
  dom.className = 'Number';
  dom.value = '0.00';

  dom.addEventListener( 'keydown', function ( event ) {

    event.stopPropagation();

  }, false );

  this.min = - Infinity;
  this.max = Infinity;

  this.step = 1;

  this.dom = dom;
  this.setValue( number );

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );

  var distance = 0;
  var onMouseDownValue = 0;

  var pointer = new THREE.Vector2();
  var prevPointer = new THREE.Vector2();

  var onMouseDown = function ( event ) {

    event.preventDefault();

    distance = 0;

    onMouseDownValue = parseFloat( dom.value );

    prevPointer.set( event.clientX, event.clientY );

    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', onMouseUp, false );

  };

  var onMouseMove = function ( event ) {

    var currentValue = dom.value;

    pointer.set( event.clientX, event.clientY );

    distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

    var number = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;

    dom.value = Math.min( scope.max, Math.max( scope.min, number ) ) | 0;

    if ( currentValue !== dom.value ) dom.dispatchEvent( changeEvent );

    prevPointer.set( event.clientX, event.clientY );

  };

  var onMouseUp = function ( event ) {

    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'mouseup', onMouseUp, false );

    if ( Math.abs( distance ) < 2 ) {

      dom.focus();
      dom.select();

    }

  };

  var onChange = function ( event ) {

    var number = parseInt( dom.value );

    if ( isNaN( number ) === false ) {

      dom.value = number;

    }

  };

  var onFocus = function ( event ) {

    dom.style.backgroundColor = '';
    dom.style.borderColor = '#ccc';
    dom.style.cursor = '';

  };

  var onBlur = function ( event ) {

    dom.style.backgroundColor = 'transparent';
    dom.style.borderColor = 'transparent';
    dom.style.cursor = 'col-resize';

  };

  dom.addEventListener( 'mousedown', onMouseDown, false );
  dom.addEventListener( 'change', onChange, false );
  dom.addEventListener( 'focus', onFocus, false );
  dom.addEventListener( 'blur', onBlur, false );

  return this;

};  // end UI.Integer()

UI.Integer.prototype = Object.create( UI.Element.prototype );

UI.Integer.prototype.getValue = function () {

  return parseInt( this.dom.value );

};  // end UI.Integer.prototype.getValue()

UI.Integer.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.dom.value = value | 0;

  }

  return this;

};  // end UI.Integer.prototype.setValue()

UI.Integer.prototype.setRange = function ( min, max ) {

  this.min = min;
  this.max = max;

  return this;

};  // end UI.Integer.prototype.setRange()


// Break

UI.Break = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'br' );
  dom.className = 'Break';

  this.dom = dom;

  return this;

};  // end UI.Break()

UI.Break.prototype = Object.create( UI.Element.prototype );


// HorizontalRule

UI.HorizontalRule = function () {

  UI.Element.call( this );

  var dom = document.createElement( 'hr' );
  dom.className = 'HorizontalRule';

  this.dom = dom;

  return this;

};  // end UI.HorizontalRule()

UI.HorizontalRule.prototype = Object.create( UI.Element.prototype );


// Button

UI.Button = function ( value ) {

  UI.Element.call( this );

  var scope = this;

  var dom = document.createElement( 'button' );
  dom.className = 'Button';

  this.dom = dom;
  this.dom.textContent = value;

  return this;

};  // end UI.Button()

UI.Button.prototype = Object.create( UI.Element.prototype );

UI.Button.prototype.setLabel = function ( value ) {

  this.dom.textContent = value;

  return this;

};  // end UI.Button.prototype.setLabel()
