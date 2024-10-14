const WidgetClasses = Object.freeze({
  loading: 'widgets-initializer--loading',
  error: 'widgets-initializer--error',
  done: 'widgets-initializer--done',
});

export default class AWidget extends MyLibrary.BaseWidget {
  widgetsRootNode = undefined;
  titleDiv = undefined;

  async init(targetNode, done) {
    WidgetsInitializer.addDebugMsg(targetNode, `inside AWidget.init(), initializing...`, MyLibrary.DebugTypes.info);

    this.widgetsRootNode = targetNode;

    this.changeClassTo(WidgetClasses.loading);

    // update title
    this.titleDiv = targetNode.querySelector(':scope > div.title');
    const originalInnerHtml = this.titleDiv.innerHTML;
    this.titleDiv.innerHTML = `Widget <B>${this.constructor.name}</B> initializing...`;


    super.init(targetNode,
      async (err) => {
        const sleepTime = Math.floor(Math.random()*5000) // <5000
        await MyLibrary.sleep(sleepTime);

        if (err) {
          this.onError();
          done && done(err);
          return;
        }

        if (targetNode.tagName.toLowerCase() === 'a') {
          this.onError();
          done && done(`AWidget(${this.widgetPath}): <a> tag is not supported`);
          return;
        }

        this.titleDiv.innerHTML = originalInnerHtml;

        const span = document.createElement('span');
        span.innerHTML = `Hello from AWidget:<br /><B>${this.constructor.name}</B> initialized, sleepTime: ${sleepTime}`;
        targetNode.appendChild(span);
        
        this.changeClassTo(WidgetClasses.done);

        console.log(`AWidget almost Initialized. sleepTime: ${sleepTime}`);

        done && done();
      }
    );

  }

  cleanupClasses() {
    this.widgetsRootNode.classList.remove(WidgetClasses.loading);
    this.widgetsRootNode.classList.remove(WidgetClasses.error);
    this.widgetsRootNode.classList.remove(WidgetClasses.done);
  }

  changeClassTo(className) {
    this.cleanupClasses();
    this.widgetsRootNode.classList.add(className);
  }

  onError() {
    this.titleDiv.innerHTML = `Widget <B>${this.constructor.name}</B> error`;
    this.changeClassTo(WidgetClasses.error);
  }
}