import { BaseWidget, sleep } from 'widgets-initializer';

export default class AWidget extends BaseWidget {
  async init(done) {
    console.log('initializing AWidget...');
    super.init(
      async () => {
        await sleep(2000);

        const span = this.widgetNode.ownerDocument.createElement('span');
        span.innerHTML = 'Widget A initialized';
        this.widgetNode.appendChild(span);

        console.log('AWidget is done().');

        done && done();
      }
    );
  }
}