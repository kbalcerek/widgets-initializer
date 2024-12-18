import AWidget from './a.js';

export default class CWidget extends AWidget {
  async init() {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside CWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    super.init();
  }
}