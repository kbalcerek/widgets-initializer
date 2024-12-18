import { WidgetsInitializer } from '../src/index';

beforeAll(() => {
  WidgetsInitializer.debug = true;
});

beforeEach(() => {
  window.resolveWaitForWidgetADonePromise = undefined;
  window.waitForWidgetADonePromise = new Promise((resolve) => {
    window.resolveWaitForWidgetADonePromise = () => {
      resolve();
    }
  });

  document.body.innerHTML = `
    <div id="root">
      <div widget="widgets/a" id="widgetA1">
        A
      </div>
      <div widget="widgets/a">
        <div class="title">Widget A</div>
        <div widget="widgets/b" id="widgetB2">
          <div class="title">Widget B</div>
          <div widget="widgets/c" id="widgetC2">
            <div class="title">Widget C</div>
          </div>
        </div>
      </div>
    </div>
  `;
});

test('widget A initialized', async () => {
  let resolvePromise = undefined;
  const waitForPromise = new Promise((resolve) => {
    resolvePromise = () => {
      resolve();
    }
  });
  
  WidgetsInitializer.init(document.getElementById('root'), (errors) => {
    resolvePromise();
  }, {
    resolver: (path) => new Promise((resolve, reject) => {
      import(`./${path}.js`)
        .then((module) => {
          resolve(module);
        })
        .catch((error) => {
          reject(error);
        }); 
    })
  });

  await waitForPromise;
  console.log('AFTER await waitForPromise, waiting for window.waitForWidgetADonePromise...');

  await window.waitForWidgetADonePromise; // done() of the widget is called asynchronously, so order of execution (WidgetsInitializer.done() and then Widget.done()) is not preserved
  console.log('AFTER await window.waitForWidgetADonePromise');

  expect(document.getElementById('root').getElementsByTagName('div')[0].getElementsByTagName('span')[0].outerHTML).toBe("<span>Widget A initialized and is done()</span>");
});

// test('widget no B & C errors', async () => {
//   let resolvePromise = undefined;
//   const waitForPromise = new Promise((resolve) => {
//     resolvePromise = () => {
//       resolve();
//     }
//   });
  
//   let returnedErrors = undefined;
  
//   WidgetsInitializer.init(document.getElementById('root'), (errors) => {
//     console.log("🚀 ~ file: WidgetsInitializerInternal.test.js:60 ~ WidgetsInitializer.init ~ errors:", errors)
//     console.log("🚀 ~ file: WidgetsInitializerInternal.test.js:60 ~ WidgetsInitializer.init ~ WidgetsInitializer.debugLog:", WidgetsInitializer.debugLog)
//     returnedErrors = errors;
//     resolvePromise();
//   }, {
//     resolver: (path) => new Promise((resolve, reject) => {
//       import(`./${path}.js`)
//         .then((module) => {
//           resolve(module);
//         })
//         .catch((error) => {
//           console.error(`WidgetsInitializerInternal.test.js: Error loading ${path}: ${error}`);
//           reject(error);
//         }); 
//     })
//   });

//   await waitForPromise;
//   expect(returnedErrors).toBe("<span>Widget A initialized</span>");
// });