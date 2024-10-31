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
  /** flag that indicates if initialization finished (with or without errors) */
  isInitializationFinished = false;
  /** will be set to true if some errors occurs */
  isInitializationFailed = false;
  /** method called internally after initialization is done.
   * it is resolver of isDonePromise
   */
  setIsDone = undefined;
  isDonePromiseExecutor = (resolve) => {
    this.setIsDone = (caller) => {
      if (caller instanceof BaseWidget) { // not perfect, we still can access it from child, or pass in fake caller, but better then nothing :)
        this.isInitializationFinished = true;
        resolve();
      } else {
          throw new Error('Unauthorized access to private method BaseWidget.setIsDone()');
      }
    }
  }
  isDonePromise = new Promise(this.isDonePromiseExecutor); // NOTE: isDonePromiseExecutor is wrapped into property to reuse it to recreate isDonePromise (in .destroy())
  /** used internally, WidgetsInitializer options passed down to WidgetsInitializer.init() that will initialize children */
  configOptions = undefined;
  /** will be set to true just before async subtree initialization starts (used to decide if .finish() should be executed on fail() immediately or later) */
  startedInitSubtree = false;

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

  async init() {
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), initializing... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    if (this.getErrors().length > 0) {
      this.finish();
      return;
    }
    
    // init all children
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.init(), init all children... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);
    this.startedInitSubtree = true;
    WidgetsInitializer.init(
      this.widgetNode,
      (errChildren) => {
        if (errChildren) {
          WidgetsInitializer.addDebugMsg(this.widgetNode, `initialization FAILED because children failed, calling finish()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.error);
        } else {
          WidgetsInitializer.addDebugMsg(this.widgetNode, `FULLY Initialized, calling finish()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);
        }
        this.finish();
      },
      this.configOptions,
      false
    ).catch((err) => {
      WidgetsInitializer.addDebugMsg(this.widgetNode, err, DebugTypes.error);
      this.finish();
    }); 
  }

  /**
   * callback called when widget finishes it's initialization
   * 
   * NOTE: when overriding it can become async function too
   * 
   * @param {{ domPath: string; type: DebugTypes; debugMsg: string; }[] | undefined} errors list of errors or undefined
   */
  done (errors) { }

  destroy(configOptions) {
    if (!this.isInitializationFinished) {
      // prevent double execution
      return;
    }

    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.destroy()... BEFORE DESTROY CHILDREN (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    const widgetNodesToDestroy = getFirstLevelWidgetNodes(this.widgetNode, configOptions.widgetAttributeName, true);
    WidgetsInitializer.destroyNodes(widgetNodesToDestroy, configOptions);
    WidgetsInitializer.addDebugMsg(this.widgetNode, `ALL CHILDREN DESTROYED (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    // cleanup
    this.isInitializationFinished = false;
    this.isDonePromise = new Promise(this.isDonePromiseExecutor);
    this.isInitializationFailed = false;
    this.widgetNode.replaceWith(this.widgetNodeOrg);
    this.startedInitSubtree = false;
    // TODO: create separate debugErrorLog (next to debugLog) and clean it up here
  }

  finish() {
    if (this.isInitializationFinished) {
      return;
    }

    this.setIsDone(this);
    WidgetsInitializer.addDebugMsg(this.widgetNode, `inside BaseWidget.finish(), calling done()... (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.info);

    const errors = this.getErrors();
    if (errors.length > 0) {
      this.isInitializationFailed = true;
    }

    try {
      const doneResult = this.done(errors.length ? errors : undefined);
      if (this.done.constructor.name === 'AsyncFunction') {
        doneResult.catch((err) => {
          WidgetsInitializer.addDebugMsg(this.widgetNode, `async Widget.done() thrown error: ${err} (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.error);
        });
      }
    } catch (err) {
      WidgetsInitializer.addDebugMsg(this.widgetNode, `Widget.done() thrown error: ${err} (${this.constructor.name}: ${this.widgetDomPath})`, DebugTypes.error);
    }
  }

  /**
   * If widget didn't finish it's initialization this method will
   * mark this widget to finish initialization with errors.
   * 
   * This method can be called multiple times if widget didn't finish it's initialization.
   * More errors will be added
   * 
   * NOTE: Can be called to mark this widget as failed initialization because for example
   * something happened outside of this widget that impacts it cannot be
   * successfully initialized (instances are available in: WidgetsInitializer.initializedWidgets). // TODO: provide API to get widget instance by path or targetNode
   * 
   * @param {string[] | undefined} errors array with errors (cause of failure)
   */
  fail(errors) {
    if (this.isInitializationFinished) {
      throw new Error("Widget already initialized (or didn't start initialization)!");
    }

    if (errors !== undefined && errors.length > 0) {
      errors.forEach(err => {
        WidgetsInitializer.addDebugMsg(this.widgetNode, err, DebugTypes.error);
      });
    }

    if (!this.startedInitSubtree) {
      // we can finish only if subtree initialization didn't startup yet, otherwise it will call finish when it finishes
      this.finish();
    }
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

  getErrors() {
    return WidgetsInitializer.debugLog.filter(log => log.domPath.startsWith(this.widgetDomPath) && log.type === DebugTypes.error);
  }
}