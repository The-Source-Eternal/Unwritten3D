Unwritten3D is a prototype for an open source online game engine and creator using three.js and a couple of other libraries, and borrowing code from a few more. We hope to experiment with a more intuitive way of manipulating the building blocks that make up your game.

You will need to have webGL capabilities to view the [demo] (http://the-source-eternal.github.io/Unwritten3D/
). You can check if you have webGL here: http://get.webgl.org

To open the editor once you are playing, press "q".

Having it on your local machine is a bit more complicated than just cloning the repo and dragging index.html into your browser. The instructions are written just below. This is because Unwritten3D has to use a server and, working locally, a tiny temporary one needs to be created.

### See and edit it on your local machine
#### Requirements:
* A familiarity with the command line
 - If you're new to the command line, you might want to check out the [command line crash course in Learning Coding The Hard Way](http://learncodethehardway.org/cli/book/cli-crash-course.html), though some find it a bit dictatorial.
* A browser with webgl capabilities
* git and a basic familiarity with it (mostly the ability to clone)
 - [git's official installation instructions](http://git-scm.com/book/en/Getting-Started-Installing-Git)
 - A [step-by-step of installing homebrew and then using that to install git](http://vimeo.com/14649488), which is simpler than a lot of other ways
* [npm, node package manager, installed globally](http://nodejs.org)

1. Get the repo onto your machine:
 1. [Fork this repository](https://help.github.com/articles/fork-a-repo)
 2. Clone it onto your computer
2. Install npm locally (gets some necessary files) 
 1. Access the command line while in the repo folder/directory  (in Mac you can just drag the folder of the repo onto the terminal app icon)
 2. Type: ```npm install```
3. To launch it in your default browser
 1. In the same terminal window, type ```npm start```
 2. When you save changes on your files, the page will be automatically updated...
 3. ...unless you add a new file or something, in which case you need to ctrl-c to stop the server and type ```npm start``` again so beefy can rebuild your bundle.js to include that new file
4. Edit the files or not, as you wish

_Remember, while playing you can press 'q' to open the editor._

### Publish to the website
To publish to the website, you'll need commit access. For devs only.

1. Do everything in the previous section, including viewing it to test whether you've broken anything
2. Do ```npm run publish```
