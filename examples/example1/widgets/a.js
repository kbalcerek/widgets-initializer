const WidgetClasses = Object.freeze({
  loading: 'widgets-initializer--loading',
  error: 'widgets-initializer--error',
  done: 'widgets-initializer--done',
});

export default class AWidget extends MyLibrary.BaseWidget {
  titleDiv = undefined;

  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside AWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);

    this.changeClassTo(WidgetClasses.loading);

    // update title
    this.titleDiv = this.widgetNode.querySelector(':scope > div.title');
    const originalInnerHtml = this.titleDiv.innerHTML;
    this.titleDiv.innerHTML = `Widget <B>${this.constructor.name}</B> initializing...`;

    // add "Click Me" text
    const clickMeElement = document.createElement('span');
    clickMeElement.innerHTML = `Click Me to test this binding`;
    clickMeElement.style.textDecoration = 'underline';
    clickMeElement.onclick = this.onClickMeHandler;
    this.titleDiv.after(clickMeElement);


    super.init(
      async (err) => {
        const sleepTime = Math.floor(Math.random()*5000) // <5000
        await MyLibrary.sleep(sleepTime);

        if (err) {
          this.onError();
          done && done(err);
          return;
        }

        if (this.widgetNode.tagName.toLowerCase() === 'a') { // yes, this kind of validation should be done earlier, not in done callback, but I just wanted to give some example how to rise error here
          this.onError();
          done && done(`AWidget(${this.widgetDomPath}): <a> tag is not supported`);
          return;
        }

        this.titleDiv.innerHTML = originalInnerHtml;

        const span = document.createElement('span');
        span.innerHTML = `Hello from AWidget:<br /><B>${this.constructor.name}</B> initialized, sleepTime: ${sleepTime}`;
        this.widgetNode.appendChild(span);
        
        this.changeClassTo(WidgetClasses.done);

        WidgetsInitializer.addDebugMsg(this.widgetNode, `inside AWidget almost Initialized. sleepTime: ${sleepTime}, calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
        done && done();
      }
    );

  }

  onClickMeHandler() {
    alert(`this.constructor.name: ${this.constructor.name}`);
  }

  cleanupClasses() {
    this.widgetNode.classList.remove(WidgetClasses.loading);
    this.widgetNode.classList.remove(WidgetClasses.error);
    this.widgetNode.classList.remove(WidgetClasses.done);
  }

  changeClassTo(className) {
    this.cleanupClasses();
    this.widgetNode.classList.add(className);
  }

  onError() {
    this.titleDiv.innerHTML = `Widget <B>${this.constructor.name}</B> error`;
    this.changeClassTo(WidgetClasses.error);
  }
}