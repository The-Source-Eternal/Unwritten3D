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
* git
 - [git's official installation instructions](http://git-scm.com/book/en/Getting-Started-Installing-Git)
 - A [step-by-step of installing homebrew and then using that to install git](http://vimeo.com/14649488), which is simpler than a lot of other ways
* [npm, node package manager, installed globally](http://nodejs.org)

1) [Fork this repository](https://help.github.com/articles/fork-a-repo)
2) Install npm locally (gets some necessary files) - while in the folder for your local git repo (in Mac you can just drag the folder onto the terminal app icon), type: ```npm install```
3) Edit the files or not, as you wish
4) To launch it in your default browser, while in the same terminal window as before type: ```npm start```

_Remember, while playing you can press 'q' to open the editor._

#### Publish to the website
To publish to the website, you'll need commit access.

1) Do everything in the previous section, including viewing it to test whether you've broken anything
2) Do ```npm run publish```
