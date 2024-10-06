export default class BaseWidget {
    constructor() {
    }

    async init(node, done) {
        console.log('inside BaseWidget.init()');
        done();
    }

    destroy() {
    }
}