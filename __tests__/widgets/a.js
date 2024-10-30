import { BaseWidget } from '../../src/BaseWidget';
import { sleep } from '../../src/utils';

export default class AWidget extends BaseWidget {
  async init(done) {
    console.log('initializing AWidget...');
    
    await sleep(1500);

    super.init(
      async () => {
        await sleep(2000);

        const span = this.widgetNode.ownerDocument.createElement('span');
        span.innerHTML = 'Widget A initialized and is done()';
        this.widgetNode.appendChild(span);

        console.log('AWidget is done().');
        window.resolveWaitForWidgetADonePromise();
        console.log('AFTER resolve resolveWaitForWidgetADonePromise()');

        done && done();
      }
    );
  }
}