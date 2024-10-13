import jsdom from 'jsdom';
import * as wInitializer from 'widgets-initializer'; // TODO: try to get rid of not used wInitializer.
// this is downside of forcing WidgetsInitializer to be singleton.
// possible solution would be to use some bundler (webpack) to build separate nodejs/browser dists.

const { JSDOM } = jsdom;

JSDOM.fromFile('index.html').then((dom) => {
  const ss = new WidgetsInitializerInternal();
  WidgetsInitializer.init(dom.window.document.getElementById('root'), (errors) => {
    if (errors) {
      console.log('Init completed with errors', errors);
    } else {
      console.log('Init successful');
    }
  }, {
    useRelativePathToImportWidgetClass: true,
    relativePath: import.meta.url.substring(0, import.meta.url.lastIndexOf('/')),
   });
});