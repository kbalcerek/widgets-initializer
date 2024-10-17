import { getDomPath, DebugTypes } from "./utils";

export class WidgetsInitializerInternal {
  constructor() {
    if ((typeof window !== 'undefined' ? window : global).WidgetsInitializer !== undefined) {
      throw new Error('Only one instance of WidgetsInitializerInternal is allowed!')
    }
  }

  defaultOptions = {
    /** custom Widget classes dynamic loader.
     * ```
     * ```
     * If provided this one will be used to load Widget classes (instead of import()), example:
     * ```
     * (path) => new Promise()
     * ```
     */
    resolver: undefined,
    debug: false,
  };
  config = this.defaultOptions;
  initializedWidgets = new WeakMap();
  /** contains elements like:
   * [
   *  { domPath: '', type, debugMsgs: [] },
   * ]
   */
  debugLog = [];

  /**
   * 
   * @param {*} widgetPath path where widget class is located, the one from [widget] attribute 
   * @returns The widget class
   */
  async loadWidgetClass(widgetPath) {
    try {
      if (this.config.resolver !== undefined) {
        const module = await this.config.resolver(widgetPath);
        return module.default;
      } else {
        const module = await import(`/${widgetPath}.js`);
        return module.default;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async init(targetNode, callback, options = {}) { // TODO: options here - make them configurable per instance (.init() call) because right now 2nd call will overwrite first one and will be common for all
    this.config = { ...this.config, ...options };
    const targetNodeDomPath = getDomPath(targetNode);
    const isDonePromises = [];

    // TODO: fill in this.initializedWidgets with all nodes (also nested ones) synchronously to prevent async init nested widget somewhere else
    //       NOTE: the above will not work if we add widgets in widget init markup!!!
    //             Remember path to targetNode?
    //             Or maybe create separate this.initializedInitializers .set(targetNode, something)
    //             and during initialization check if all parents of targetNode does not
    //             exist in this.initializedInitializers.
    const nodesToInit = targetNode.querySelectorAll(':scope [widget]:not(:scope [widget] [widget])'); //:scope > [widget], :scope > *:not([widget]) [widget]');
    const initPromises = Array.from(nodesToInit).map(async widgetNode => {
      const widgetNodeDomPath = getDomPath(widgetNode);

      const widgetPath = widgetNode.getAttribute('widget');
      this.initializedWidgets.set(
        widgetNode,
        widgetPath // TODO: change to relativeSelector
      ); // TODO: consider some lock here, because right now we have to remember that this line have to be before any await in this function!!!
      try {
        const WidgetClass = await this.loadWidgetClass(widgetPath);
        const widgetInstance = new WidgetClass();
        this.initializedWidgets.set(widgetNode, widgetInstance); // TODO: consider to store instances in separate WeakMap or just type (string/object) will indicate initialization state
        isDonePromises.push(widgetInstance.isDonePromise);
        widgetInstance.init(
          widgetNode,
          err => {
            if (err) {
              this.addDebugMsg(widgetNode, err, DebugTypes.error);
              widgetInstance.setIsDone(this);
            } else {
              // init all children
              WidgetsInitializer.init(
                widgetNode,
                (errChildren) => {
                  if (errChildren) {
                    this.addDebugMsg(widgetNode, `${widgetPath} initialization FAILED, calling setIsDone()...`, DebugTypes.error);
                  } else {
                    this.addDebugMsg(widgetNode, `${widgetPath} FULLY Initialized, calling setIsDone()...`, DebugTypes.info);
                  }
                  widgetInstance.setIsDone(this);
                },
              ).catch((err) => {
                this.addDebugMsg(widgetNode, err, DebugTypes.error);
                widgetInstance.setIsDone(this);
              }); 
            }
          },
          this.config
        ).catch((err) => {
          this.addDebugMsg(widgetNode, err, DebugTypes.error);
          widgetInstance.setIsDone(this);
        });
      } catch (err) {
        this.addDebugMsg(widgetNode, err, DebugTypes.error);
      }
    });
    
    try {
      await Promise.all(initPromises); // await here is important to wait for all to add to: this.initializedWidgets
    
      this.addDebugMsg(targetNode, `WAITING FOR ALL WIDGETS (inside ${this.initializedWidgets.get(targetNode)?.constructor.name}: ${targetNodeDomPath}) to finish...`, DebugTypes.info);
      await Promise.all(isDonePromises);
      this.addDebugMsg(targetNode, `ALL WIDGETS (inside ${this.initializedWidgets.get(targetNode)?.constructor.name}: ${targetNodeDomPath}) finished initialization. (with or without errors!)`, DebugTypes.info);

      const errors = this.debugLog.filter(log => log.domPath.startsWith(targetNodeDomPath) && log.type === DebugTypes.error);

      callback(errors.length ? errors : null);
    } catch (err) {
      this.addDebugMsg(targetNode, err, DebugTypes.error);
      callback(err);
    }
  }

  async destroy(targetNode) {
    console.log('WidgetsInitializer.destroy()');
  }

  addDebugMsg(targetNode, msg, type = DebugTypes.info) {
    // if (!WEBPACK_isProd) {
    if (
      this.config.debug ||
      type !== DebugTypes.info // errors (and other debug messages other then "info", like maybe someday warnings) should be always added to debugLog, because they are later on returned in callback
    ) {
      if (Array.isArray(msg)) {
        msg.forEach((m) => this.addDebugMsg(targetNode, m.msg, m.type));
        return;
      }
      console.log(msg);
      const targetNodeDomPath = getDomPath(targetNode);
      this.debugLog.push({
        domPath: targetNodeDomPath,
        type,
        debugMsg: msg,
      })
    }
  }
}

(typeof window !== 'undefined' ? window : global).WidgetsInitializer = new WidgetsInitializerInternal();
export const WidgetsInitializer = (typeof window !== 'undefined' ? window : global).WidgetsInitializer;