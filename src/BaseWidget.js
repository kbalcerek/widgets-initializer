import { DebugTypes, getFirstLevelWidgetNodes } from './utils';
import { WidgetsInitializerInternal } from './WidgetsInitializerInternal';

export class BaseWidget {
  widgetNode = undefined;
  /** original widget node, before .init() call, used to restore it in destroy()
   * NOTE: we keep original one, because .copyNode() does not copy event listeners,
   *       so we would loose them if we remember the copy!
   *       TODO: Possible workaround: implement wrapper around addEventListener
   */
  widgetNodeOrg = undefined;
  widgetPath = undefined;
  widgetDomPath = undefined;
  isInitialized = false;
  /** method called internally after initialization is done.
   * it is resolver of isDonePromise
   */
  setIsDone = undefined;
  isDonePromiseExecutor = (resolve) => {
    this.setIsDone = (caller) => {
      if (caller instanceof WidgetsInitializerInternal) {
        this.isInitialized = true;
        resolve();
      } else {
          throw new Error('Unauthorized access to private method BaseWidget.setIsDone()');
      }
    }
  }
  isDonePromise = new Promise(this.isDonePromiseExecutor); // NOTE: isDonePromiseExecutor if wrapped into property to reuse it to recreate isDonePromise (in .destroy())
  markAsFailedErrors = undefined;

  constructor(widgetNode, widgetPath, widgetDomPath) {
    this.widgetNodeOrg = widgetNode
    this.widgetNode = this.widgetNodeOrg.cloneNode(true);
    this.widgetNodeOrg.replaceWith(this.widgetNode);

    // replace node under which it is stored in initializedWidgets
    WidgetsInitializer.initializedWidgets.set(this.widgetNode, WidgetsInitializer.initializedWidgets.get(this.widgetNodeOrg));
    WidgetsInitializer.initializedWidgets.delete(this.widgetNodeOrg);
    // TODO: replace in nodesDuringInitialization

    this.widgetPath = widgetPath;
    this.widgetDomPath = widgetDomPath;
  }

  async init(done) {
    // TODO: if widget (path) already initialized (started initialization) -> do nothing here!
    //       IMPORTANT: handle case when this class is extended by some other (ex. AWidget), in this case super.init() may be called after
    //                  some code execution (part of widget initialization). Should we allow some code before super.init()? And if yes,
    //                  how to "do nothing" if already something has been done? Maybe .init() should allow some API for pre-init() code execution?
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    if (this.markAsFailedErrors !== undefined) {
      // TODO: implement this.onFail( pass in done here??? );
      done && done(this.markAsFailedErrors)
      // TODO: should there be: .catch()? done() method may also fail by user
      ;
      return;
    }
    
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);
    done && done();
  }

  destroy() {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.destroy()... BEFORE DESTROY CHILDREN (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    const widgetNodesToDestroy = getFirstLevelWidgetNodes(this.widgetNode);
    WidgetsInitializer.destroyNodes(widgetNodesToDestroy);
    WidgetsInitializer.addDebugMsg(this.widgetNode, `ALL CHILDREN DESTROYED (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    // cleanup
    this.isInitialized = false;
    this.isDonePromise = new Promise(this.isDonePromiseExecutor);
    this.markAsFailedErrors = undefined;
    this.widgetNode.replaceWith(this.widgetNodeOrg);
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
    // TODO: implement this.onFail( pass in done here??? );
  }
}