const WidgetClasses = Object.freeze({
  loading: 'widgets-initializer--loading',
  error: 'widgets-initializer--error',
  done: 'widgets-initializer--done',
});

export default class AWidget extends MyLibrary.BaseWidget {
  titleDiv = undefined;
  originalTitleDivInnerHtml = undefined;
  sleepTime = undefined;

  async init() {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside AWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);

    this.changeClassTo(WidgetClasses.loading);

    // update title
    this.titleDiv = this.widgetNode.querySelector(':scope > div.title');
    this.originalTitleDivInnerHtml = this.titleDiv.innerHTML;
    this.titleDiv.innerHTML = `Widget <B>${this.constructor.name}</B> initializing...`;

    // add "Click Me" text
    const clickMeElement = document.createElement('span');
    clickMeElement.innerHTML = `Click Me to test this binding`;
    clickMeElement.style.textDecoration = 'underline';
    clickMeElement.onclick = this.onClickMeHandler;
    this.titleDiv.after(clickMeElement);
    
    if (this.widgetNode.dataset.simulateValidationError === "failBefInit") {
      const errMsg = `AWidget failed, because: we are simulating validation failure here :) failBefInit`;
      this.fail([errMsg]);
      return;
    }

    this.sleepTime = Math.floor(Math.random()*5000) // <5000
    await MyLibrary.sleep(this.sleepTime);

    super.init();
  }

  async done (errors) {
    if (errors) {
      this.onError(errors);
      super.done(errors);
      return;
    }

    if (this.widgetNode.tagName.toLowerCase() === 'a') { // yes, this kind of validation should be done earlier, not in done callback, but I just wanted to give some example how to rise error here
      WidgetsInitializer.addDebugMsg(this.widgetNode, `AWidget(${this.widgetDomPath}): <a> tag is not supported (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.error);
      const tempErrors = this.getErrors();
      this.onError(tempErrors);
      super.done(tempErrors);
      return;
    }

    this.titleDiv.innerHTML = this.originalTitleDivInnerHtml;

    const helloMsgElement = document.createElement('div');
    helloMsgElement.innerHTML = `Hello from AWidget:<br /><B>${this.constructor.name}</B> initialized, sleepTime: ${this.sleepTime}`;
    this.widgetNode.appendChild(helloMsgElement);
    
    this.changeClassTo(WidgetClasses.done);

    WidgetsInitializer.addDebugMsg(this.widgetNode, `AWidget inside done() is doing some async stuff... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    const sleepTimeInDone = Math.floor(Math.random()*5000) // <5000
    await MyLibrary.sleep(sleepTimeInDone);

    WidgetsInitializer.addDebugMsg(this.widgetNode, `AWidget is done(). sleepTimeInDone: ${sleepTimeInDone}, calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, MyLibrary.DebugTypes.info);
    super.done(errors);
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

  onError(errors) {
    this.titleDiv.innerHTML = `Widget <B>${this.constructor.name}</B> errors:<br />${
      errors.map((err) => '- ' + err.debugMsg.replace('<', '&lt;').replace('>', '&gt;')).join('<br />')
    }`;
    this.changeClassTo(WidgetClasses.error);
  }
}