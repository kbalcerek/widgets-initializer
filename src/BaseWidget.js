import { DebugTypes } from './utils';
import { WidgetsInitializerInternal } from './WidgetsInitializerInternal';

export class BaseWidget {
  isInitialized = false;
  /** method called internally after initialization is done.
   * it is resolver of isDonePromise
   */
  setIsDone = undefined;
  isDonePromise = new Promise(resolve => {
    this.setIsDone = (caller) => {
      if (caller instanceof WidgetsInitializerInternal) {
        this.isInitialized = true;
        resolve();
      } else {
          throw new Error('Unauthorized access to private method BaseWidget.setIsDone()');
      }
    }
  });
  markAsFailedErrors = undefined;
  widgetPath = undefined;

  constructor() {
  }

  async init(targetNode, done) {
    WidgetsInitializer.addDebugMsg(targetNode, `inside BaseWidget.init(), initializing...`, DebugTypes.info);

    if (targetNode === undefined || targetNode === null) {
      // TODO: implement this.onFail( pass in done here??? );
      done && done('BaseWidget: targetNode cannot be null/undefined');
      return;
    }
    this.widgetPath = targetNode.getAttribute('widget');

    if (this.markAsFailedErrors !== undefined) {
      // TODO: implement this.onFail( pass in done here??? );
      done && done(this.markAsFailedErrors);
      return;
    }

    // init all children
    WidgetsInitializer.init(
      targetNode,
      () => {
        done && done();
      },
    ); 
  }

  destroy() {
  }

  done(callback) {
    // reverts previous call of fail(errors), but only if it was called! (unmark as failed)
    
    // TODO: fullfill the initialization
    //       After this.fail() (custom failure) is called it will be marked as failed,
    //       so the done callback (the one passed to init) will be called with errors (including fail(errors))
    //       this method here should cleanup this.markedAsFailedErrors and
    //       call callback() that will do the remaining stuff after custom failure
  }

  /**
   * Will mark this widget to finish initialization with errors.
   * Can be called to mark this widget as failed initialization because for example
   * something happened outside of this widget that impacts it cannot be successfully initialized.
   * 
   * @param {string} errors [optional] 
   */
  fail(errors) {
    this.markAsFailedErrors.push(...errors);
    this.isInitialized = false;
    // TODO: implement this.onFail( pass in done here??? );
  }
}