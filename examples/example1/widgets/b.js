import AWidget from './a.js';

export default class BWidget extends AWidget {
  async init(targetNode, done) {
    WidgetsInitializer.addDebugMsg(targetNode, `inside BWidget.init(), initializing... (${this.constructor.name}: ${MyLibrary.getDomPath(targetNode)})`, MyLibrary.DebugTypes.info);
    super.init(targetNode, done);
  }
}