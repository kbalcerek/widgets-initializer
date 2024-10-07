import BaseWidget from 'widgets-initializer/src/BaseWidget';

export default class AWidget extends BaseWidget {
    async init(target, done) {
        console.log('inside AWidget.init()');
        super.init(target, done);
    }

    destroy() {
        super.destroy();
    }
}