import BaseWidget from '../../../src/BaseWidget.js';

export default class AWidget extends BaseWidget {
  async init(targetNode, callback) {
    console.log('inside AWidget.init()');
    super.init(targetNode, callback);

    const span = document.createElement('span');
    span.innerHTML = 'Widget A initialized';
    targetNode.appendChild(span);
  }
}