import { DebugTypes, getFirstLevelWidgetNodes } from './utils';

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
      if (caller instanceof BaseWidget) { // not perfect, we still can access it from child, or pass in fake caller, but better then nothing :)
        this.isInitialized = true;
        resolve();
      } else {
          throw new Error('Unauthorized access to private method BaseWidget.setIsDone()');
      }
    }
  }
  isDonePromise = new Promise(this.isDonePromiseExecutor); // NOTE: isDonePromiseExecutor is wrapped into property to reuse it to recreate isDonePromise (in .destroy())
  markAsFailedErrors = undefined;
  /** used internally, WidgetsInitializer options passed down to WidgetsInitializer.init() that will initialize children */
  configOptions = undefined;

  constructor(widgetNode, widgetPath, widgetDomPath) {
    this.widgetNodeOrg = widgetNode
    this.widgetNode = this.widgetNodeOrg.cloneNode(true);
    this.widgetNodeOrg.replaceWith(this.widgetNode);

    // replace node under which it is stored in initializedWidgets
    WidgetsInitializer.initializedWidgets.set(this.widgetNode, WidgetsInitializer.initializedWidgets.get(this.widgetNodeOrg));
    WidgetsInitializer.initializedWidgets.delete(this.widgetNodeOrg);
    // TODO: possible Refactor: replace in nodesDuringInitialization is done in WidgetsInitializer, maybe the above should also be there to make it more consistent - rethink!

    this.widgetPath = widgetPath;
    this.widgetDomPath = widgetDomPath;

    this.bindHandlers();
  }

  async init(done) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    if (this.markAsFailedErrors !== undefined) {
      this.markAsFailedErrors.forEach(err => {
        WidgetsInitializer.addDebugMsg(this.widgetNode, err, DebugTypes.error);
      });
      this.finish(done);
      return;
    }
    
    // init all children
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), init all children... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);
    WidgetsInitializer.init(
      this.widgetNode,
      (errChildren) => {
        if (errChildren) {
          WidgetsInitializer.addDebugMsg(this.widgetNode, `initialization FAILED because children failed, calling finish()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.error);
        } else {
          WidgetsInitializer.addDebugMsg(this.widgetNode, `FULLY Initialized, calling finish()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);
        }
        this.finish(done);
      },
      this.configOptions,
      false
    ).catch((err) => {
      WidgetsInitializer.addDebugMsg(this.widgetNode, err, DebugTypes.error);
      this.finish(done);
    }); 
  }

  destroy(configOptions) {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.destroy()... BEFORE DESTROY CHILDREN (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    const widgetNodesToDestroy = getFirstLevelWidgetNodes(this.widgetNode, configOptions.widgetAttributeName, true);
    WidgetsInitializer.destroyNodes(widgetNodesToDestroy, configOptions);
    WidgetsInitializer.addDebugMsg(this.widgetNode, `ALL CHILDREN DESTROYED (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    // cleanup
    this.isInitialized = false;
    this.isDonePromise = new Promise(this.isDonePromiseExecutor);
    this.markAsFailedErrors = undefined;
    this.widgetNode.replaceWith(this.widgetNodeOrg);
  }

  finish(done) {
    if (!this.isInitialized) {
      this.setIsDone(this);
      WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.finish(), calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

      const errors = WidgetsInitializer.debugLog.filter(log => log.domPath.startsWith(this.widgetDomPath) && log.type === DebugTypes.error);
      done && done(errors.length ? errors : undefined); // we don't have to handle errors thrown by done(), if method provided causes some errors the child class that extends BaseWidget should handle it on it's own
    }
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

  bindHandlers() {
    let obj = this;
    const boundPropNames = [];
    do {
      for (let prop of Object.getOwnPropertyNames(obj)) {
        if (
          typeof this[prop] === 'function' &&
          prop.endsWith('Handler') &&
          boundPropNames.findIndex((p) => p === prop) === -1 // prevent to reassign it twice if method is overridden
        ) {
          this[prop] = this[prop].bind(this);
          boundPropNames.push(prop);
        }
      }
      obj = Object.getPrototypeOf(obj)
    } while (obj != Object.prototype);
  }

  /**
   * 
   * @param {string} errMsg 
   * @returns err converted into debugLog format error
   */
  toDebugLogError(errMsg) {
    return WidgetsInitializer.toDebugLog(errMsg, this.widgetDomPath, DebugTypes.error);
  }
}