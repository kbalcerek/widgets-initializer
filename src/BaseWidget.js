import { DebugTypes, getDomPath } from './utils';
import { WidgetsInitializerInternal } from './WidgetsInitializerInternal';

export class BaseWidget {
  widgetNode = undefined;
  widgetPath = undefined;
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

  constructor(widgetNode, widgetPath) {
    this.widgetNode = widgetNode;
    this.widgetPath = widgetPath;
  }

  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), initializing... (${this.constructor.name}: ${getDomPath(this.widgetNode)})`, DebugTypes.info);

    if (this.markAsFailedErrors !== undefined) {
      // TODO: implement this.onFail( pass in done here??? );
      done && done(this.markAsFailedErrors);
      return;
    }
    
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), calling done()... (${this.constructor.name}: ${getDomPath(this.widgetNode)})`, DebugTypes.info);
    done && done();
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