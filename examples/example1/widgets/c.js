import AWidget from './a.js';

export default class CWidget extends AWidget {
  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside CWidget.init(), initializing... (${this.constructor.name}: ${MyLibrary.getDomPath(this.widgetNode)})`, MyLibrary.DebugTypes.info);
    super.init(done);
  }
}