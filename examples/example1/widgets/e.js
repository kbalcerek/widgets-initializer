import AWidget from './a.js';

export default class EWidget extends AWidget {
  async init(targetNode, done) {
    WidgetsInitializer.addDebugMsg(targetNode, `inside EWidget.init(), initializing... (${this.constructor.name}: ${MyLibrary.getDomPath(targetNode)})`, MyLibrary.DebugTypes.info);
    throw new Error('EWidget, this error is directly inside EWidget.init(), before super.init() is called');

    super.init(targetNode, done);
  }
}