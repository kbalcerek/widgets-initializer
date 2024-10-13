import BaseWidget from '../../../src/BaseWidget.js';
import { sleep } from '../../../src/utils.js';

export default class WithOtherWidgetMarkupWidget extends BaseWidget {
  async init(targetNode, done) {
    console.log('initializing WithOtherWidgetMarkupWidget...');

    const span = document.createElement('span');
    span.innerHTML = `
      Some markup, the with widget c is below:
      <div widget="widgets/c">C injected</div>`;
    targetNode.appendChild(span);

    super.init(targetNode,
      async () => {
        const sleepTime = 10; // Math.floor(Math.random()*5000) // <5000
        await sleep(sleepTime);

        const span = document.createElement('span');
        span.innerHTML = `
          from WithOtherWidgetMarkupWidget: <B>${this.constructor.name}</B> initialized, sleepTime: ${sleepTime}
          
        `;
        targetNode.appendChild(span);

        console.log(`WithOtherWidgetMarkupWidget almost Initialized. sleepTime: ${sleepTime}`);

        done && done();
      }
    );

  }
}