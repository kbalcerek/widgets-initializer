import AWidget from './a.js';

export default class EWidget extends AWidget {

  async init(targetNode, done) {
    console.log('initializing EWidget...');
    throw new Error('EWidget, this error is directly inside EWidget.init(), before super.init() is called');

    super.init(targetNode, done);
  }
}