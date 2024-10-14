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
  };
  config = this.defaultOptions;
  initializedWidgets = new WeakMap();
  /** contains elements like:
   * {
   *  domPath: {
   *    targetNode,
   *    debugMsgs: []
   *  }
   */
  initializedPaths = {};

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

  async init(targetNode, callback, options = {}) {
    this.config = { ...this.config, ...options };
    const targetNodeDomPath = getDomPath(targetNode);
    if (this.initializedPaths[targetNodeDomPath] === undefined) {
      this.initializedPaths[targetNodeDomPath] = { targetNode, debugMsgs: [] };
    }
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
      if (this.initializedPaths[widgetNodeDomPath] === undefined) {
        this.initializedPaths[widgetNodeDomPath] = { targetNode: widgetNode, debugMsgs: [] };
      }

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
            } else {
              this.addDebugMsg(widgetNode, `${widgetPath} Initialized.`, DebugTypes.info);
            }
            widgetInstance.setIsDone(this);
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
    
      this.addDebugMsg(targetNode, `WAITING FOR ALL WIDGETS (inside: ${targetNodeDomPath}) to finish...`, DebugTypes.info);
      await Promise.all(isDonePromises);
      this.addDebugMsg(targetNode, `ALL WIDGETS (inside: ${targetNodeDomPath}) finished initialization. (with or without errors!)`, DebugTypes.info);

      const errors = this.initializedPaths[targetNodeDomPath].debugMsgs.filter((dMsg) => dMsg.type === DebugTypes.error);

      callback(errors.length ? errors : null);
    } catch (err) {
      this.addDebugMsg(targetNode, err, DebugTypes.error);
      callback(err);
    }
  }

  async destroy(targetNode) {
    delete this.initializedPaths[getDomPath(targetNode)];
    console.log('WidgetsInitializer.destroy()');
  }

  addDebugMsg(targetNode, msg, type = DebugTypes.info) {
    if (!WEBPACK_isProd) {
      console.log(msg);
      const targetNodeDomPath = getDomPath(targetNode);
      this.initializedPaths[targetNodeDomPath].debugMsgs.push({
        type,
        msg
      });
    }
  }
}

(typeof window !== 'undefined' ? window : global).WidgetsInitializer = new WidgetsInitializerInternal();
export const WidgetsInitializer = (typeof window !== 'undefined' ? window : global).WidgetsInitializer;