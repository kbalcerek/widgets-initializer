import AWidget from './a.js';

export default class EWidget extends AWidget {
  async init() {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside EWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    this.titleDiv = this.widgetNode.querySelector(':scope > div.title');
    throw new Error('EWidget, this error is thrown directly inside EWidget.init(), before super.init() is called');

    super.init();
  }
}