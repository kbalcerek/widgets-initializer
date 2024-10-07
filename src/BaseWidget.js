export default class BaseWidget {
  constructor() {
  }

  async init(node, callback) {
    console.log('inside BaseWidget.init()');
    callback();
  }

  destroy() {
  }
}