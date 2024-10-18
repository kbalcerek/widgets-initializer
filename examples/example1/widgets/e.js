import AWidget from './a.js';

export default class EWidget extends AWidget {
  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside EWidget.init(), initializing... (${this.constructor.name}: ${MyLibrary.getDomPath(this.widgetNode)})`, MyLibrary.DebugTypes.info);
    throw new Error('EWidget, this error is directly inside EWidget.init(), before super.init() is called');

    super.init(done);
  }
}