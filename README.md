# widgets-initializer

Developed under node version 18.17.1\
Until now it has been tested/developed only under Windows environment.

## Available Scripts

1. `npm i`
2. `npm run init-project` - makes a copy of hacked anywhere file that supports extra flag -u, required to run `npm run example:1`
3. `npm run build:dev`
4. To run tests: `npm run test`

## There are 3 examples attached in 'examples' folder

### 'example1'

It is example of how to use library as *.js file (`<script src="../../dist/lib.script.js"></script>`)\
To browse example run:\
`npm run example:1`

### 'nodejs-with-jsdom'

It is example of how to use library in node.js environment\
(for example for testing purposes with 'jsdom')\
See details in [/nodejs-with-jsdom/README.md](https://github.com/kbalcerek/widgets-initializer/tree/main/examples/nodejs-with-jsdom/README.md)

### 'react-app'

It is example of how to use library in FrontEnd environments\
See details in [/react-app/README.md](https://github.com/kbalcerek/widgets-initializer/tree/main/examples/react-app/README.md)

##

# Event Listeners in [widget] nodes

Library internally uses .cloneNode() on [widget] nodes to remember their original state. That leads to downside that widget nodes after initialization will loose any event listeners attached. They have to be re-applied in widget class in .afterInit() - or some other method: to be implemented.
For simplicity I didn't handle it right now. As a workaround that could be implemented to fully support event listeners we could implement wrapper around addEventListener() and apply them in BaseWidget class just right after cloning.

# Wait for external task

Widget can wait for external task to finish before it finishes it's initialization. For example if some field needs to be filled in before we show up our widget. In this case "waitForExternalDone" property of BaseWidget have to be set to true by extending class and if it is ready "externalDone" method should be called.