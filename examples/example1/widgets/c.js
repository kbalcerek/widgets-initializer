import AWidget from './a.js';

export default class CWidget extends AWidget {
  async init(targetNode, done) {
    WidgetsInitializer.addDebugMsg(targetNode, `inside CWidget.init(), initializing... (${this.constructor.name}: ${MyLibrary.getDomPath(targetNode)})`, MyLibrary.DebugTypes.info);
    super.init(targetNode, done);
  }
}