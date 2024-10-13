import BaseWidget from 'widgets-initializer/src/BaseWidget.js';
import pkg from '../../../src/utils.js';
const { sleep } = pkg;

export default class AWidget extends BaseWidget {
  async init(targetNode, done) {
    console.log('initializing AWidget...');
    super.init(targetNode,
      async () => {
        await sleep(2000);

        if (targetNode.tagName.toLowerCase() === 'a') {
          done && done(`AWidget(${this.widgetPath}): <a> tag is not supported`);
          return;
        }

        const span = document.createElement('span');
        span.innerHTML = 'Widget A initialized';
        targetNode.appendChild(span);

        console.log('AWidget almost Initialized.');

        done && done();
      }
    );

  }
}