var TSEGame = require('./lib/game.js')

game = new TSEGame()

var element = document.getElementById('blocker')
element.addEventListener( 'click', function(){
  game.setMode('play')
}, false)

game.start()
