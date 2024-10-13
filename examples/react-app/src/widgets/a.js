import { BaseWidget, sleep } from 'widgets-initializer';

export default class AWidget extends BaseWidget {
  async init(targetNode, done) {
    console.log('initializing AWidget...');
    super.init(targetNode,
      async () => {
        await sleep(2000);

        const span = targetNode.ownerDocument.createElement('span');
        span.innerHTML = 'Widget A initialized';
        targetNode.appendChild(span);

        console.log('AWidget almost Initialized.');

        done && done();
      }
    );
  }
}