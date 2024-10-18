export default class WithOtherWidgetMarkupWidget extends MyLibrary.BaseWidget {
  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside WithOtherWidgetMarkupWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);

    this.widgetNode.style.fontSize = '13px';
    const span = document.createElement('span');
    span.innerHTML = `
      Some markup added in WithOtherWidgetMarkupWidget.init() method<br />
      this markup is with widget c:
      <div widget="widgets/c">
        <div class="title">WidgetC injected in WithOtherWidgetMarkupWidget</div>
      </div>
      this text is below widget c<br /><br />
    `;
    this.widgetNode.appendChild(span);

    super.init(
      async () => {
        const sleepTime = 10; // Math.floor(Math.random()*5000) // <5000
        await MyLibrary.sleep(sleepTime);

        const span = document.createElement('span');
        span.innerHTML = `Hello from WithOtherWidgetMarkupWidget:<br /><B>${this.constructor.name}</B> initialized, sleepTime: ${sleepTime}`;
        this.widgetNode.appendChild(span);

        WidgetsInitializer.addDebugMsg(this.widgetNode, `inside WithOtherWidgetMarkupWidget almost Initialized. sleepTime: ${sleepTime}, calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
        done && done();
      }
    );

  }
}