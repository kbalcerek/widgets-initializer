import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import WidgetsInitializer from 'widgets-initializer';

function App() {
  useEffect(() => {
    document.getElementById('init')?.addEventListener('click', async () => {
      WidgetsInitializer.init(document.getElementById('root'), (errors) => {
          if (errors) {
              console.log('Init completed with errors', errors);
          } else {
              console.log('Init successful');
          }
      }, {
        resolver: (path) => new Promise((resolve, reject) => {
          import(`./${path}.js`)
            .then((module) => {
              resolve(module);
            })
            .catch((error) => {
              console.error('Error loading MyClass:', error);
              reject(error);
            }); 
        })
      });
    });
  }, []);

  return (
    <div className="App">

      <div id="root">
          <div widget="widgets/a">
              <div widget="widgets/b"></div>
          </div>
          <div></div>
          <div widget="widgets/c"></div>
      </div>

      <div className="controls">
          <button id="init">Init</button>
          <button id="destroy">Destroy</button>
      </div>

      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
