import AWidget from './a.js';

export default class BWidget extends AWidget {
  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    super.init(done);
  }

  onClickMeHandler() {
    alert(`WidgetB says: this.constructor.name: ${this.constructor.name}`);
  }
}