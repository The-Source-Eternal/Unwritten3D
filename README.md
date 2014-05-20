Unwritten3D is a prototype for an open source online game engine and creator using three.js and a couple of other libraries, and borrowing code from a few more. We hope to experiment with a more intuitive way of manipulating the building blocks that make up your game

You will need to have webGL capabilities to view the [demo] (http://the-source-eternal.github.io/Unwritten3D/
). You can check if you have webGL here: http://get.webgl.org

To open the editor once you are playing, press "q".

To build our latest version locally you'll need to be able to use your command line. If you're new to the command line, you might want to check out the [command line crash course in Learning Coding The Hard Way](http://learncodethehardway.org/cli/book/cli-crash-course.html), though it's a bit dictatorial).

#### See it on your local machine
[Open your terminal] (http://learncodethehardway.org/cli/book/cli-crash-course.html#do-this).

[Navigate](http://en.wikipedia.org/wiki/Cd_(command)) to the folder that you want the repo to be in:
- In OSX 10.9 (Mavericks), you can drag and drop the folder you want to use onto the terminal app icon (in the dock or in your Applications folder).
- Otherwise, replace all the stuff in brackets with names from your own directory ([what is a home folder?](https://www.google.com/search?q=what+is+a+home+folder%3F&rlz=1C5ACMJ_enUS519US519&oq=what+is+a+home+folder%3F&aqs=chrome..69i57j0l5.2952j0j7&sourceid=chrome&es_sm=91&ie=UTF-8))
```bash
cd ~/[aFolderInYourHomeDirectory]/[aFolderInsideThat]/[keepGoingTillYouReachTheFolderYouWant]
```

Clone this repository:
```bash
git clone git@github.com:The-Source-Eternal/Unwritten3D.git
cd Unwritten3D
```

Double click the index.html file in the folder or drag and drop index.html into the icon of a browser of your choice.

Remember, while playing you can press 'q' to open the editor.

#### Publish to the website
To publish to the website, you'll need commit access. You'll also need [node package modules (or npm)](https://www.npmjs.org).

Install node package modules (npm) if you don't have it (or follow [their installation advice](http://blog.npmjs.org/post/85484771375/how-to-install-npm)):
```bash
npm install
```

Navigate to the repo's folder in your directory (or drag and drop the Unwritten3D folder onto the command line app):
```bash
cd ~/[pathToContainingFolder]/Unwritten3D
```

Start:
```bash
npm start
```

Publish:
```bash
npm run publish
```
