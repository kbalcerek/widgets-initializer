import jsdom from 'jsdom';
import { WidgetsInitializer } from 'widgets-initializer';

const { JSDOM } = jsdom;

JSDOM.fromFile('index.html').then((dom) => {
  WidgetsInitializer.init(dom.window.document.getElementById('root'), (errors) => {
    if (errors) {
      console.log('Init completed with errors', errors);
    } else {
      console.log('Init successful');
    }
    console.log('DOM after widgets initialization finished: ', dom.window.document.body.innerHTML);
  }, {
    resolver: (path) => new Promise((resolve, reject) => {
      import(`./${path}.mjs`)
        .then((module) => {
          resolve(module);
        })
        .catch((error) => {
          console.error(`App.js: Error loading ${path}: ${error}`);
          reject(error);
        }); 
    })
   });
});