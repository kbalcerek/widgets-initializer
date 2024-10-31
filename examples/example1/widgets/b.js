import AWidget from './a.js';

export default class BWidget extends AWidget {
  async init() {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    super.init();
  }

  onClickMeHandler() {
    alert(`WidgetB says: this.constructor.name: ${this.constructor.name}`);
  }

  done (errors) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `BWidget is done(), calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    super.done(errors);
  }
}