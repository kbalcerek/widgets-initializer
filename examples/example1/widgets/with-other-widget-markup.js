export default class WithOtherWidgetMarkupWidget extends MyLibrary.BaseWidget {
  async init(targetNode, done) {
    WidgetsInitializer.addDebugMsg(targetNode, `inside WithOtherWidgetMarkupWidget.init(), initializing...`, MyLibrary.DebugTypes.info);

    targetNode.style.fontSize = '13px';
    const span = document.createElement('span');
    span.innerHTML = `
      Some markup added in WithOtherWidgetMarkupWidget.init() method<br />
      this markup is with widget c:
      <div widget="widgets/c">
        <div class="title">WidgetC injected in WithOtherWidgetMarkupWidget</div>
      </div>
      this text is below widget c<br /><br />
    `;
    targetNode.appendChild(span);

    super.init(targetNode,
      async () => {
        const sleepTime = 10; // Math.floor(Math.random()*5000) // <5000
        await MyLibrary.sleep(sleepTime);

        const span = document.createElement('span');
        span.innerHTML = `Hello from WithOtherWidgetMarkupWidget:<br /><B>${this.constructor.name}</B> initialized, sleepTime: ${sleepTime}`;
        targetNode.appendChild(span);

        console.log(`WithOtherWidgetMarkupWidget almost Initialized. sleepTime: ${sleepTime}`);

        done && done();
      }
    );

  }
}