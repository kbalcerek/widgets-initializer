export default class AWidget extends MyLibrary.BaseWidget {
  async init(targetNode, done) {
    console.log('initializing AWidget...');
    super.init(targetNode,
      async () => {
        const sleepTime = Math.floor(Math.random()*5000) // <5000
        await MyLibrary.sleep(sleepTime);

        if (targetNode.tagName.toLowerCase() === 'a') {
          done && done(`AWidget(${this.widgetPath}): <a> tag is not supported`);
          return;
        }

        const span = document.createElement('span');
        span.innerHTML = `from AWidget: <B>${this.constructor.name}</B> initialized, sleepTime: ${sleepTime}`;
        targetNode.appendChild(span);

        console.log(`AWidget almost Initialized. sleepTime: ${sleepTime}`);

        done && done();
      }
    );

  }
}