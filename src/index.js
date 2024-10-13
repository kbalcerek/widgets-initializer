
class WidgetsInitializerInternal {
  constructor() {
    if ((typeof window !== 'undefined' ? window : global).WidgetsInitializer !== undefined) {
      throw new Error('Only one instance of WidgetsInitializerInternal is allowed!')
    }
  }

  defaultOptions = {
    /** If TRUE relative paths are used to load widgets.
     * In browsers: relative to current URL
     * In node: relative to relativePath
     * 
     * ignored when resolver is provided!!!
     * 
     * When TRUE and in nodejs relativePath option have to be provided
     */
    useRelativePathToImportWidgetClass: false,
    /** used only in node when useRelativePathToImportWidgetClass is TRUE */
    relativePath: '',
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
        let relativePart = this.config.useRelativePathToImportWidgetClass
          ? typeof window !== 'undefined'
            ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))
            : this.config.relativePath // nodejs 
          : '';
        const module = await import(`${relativePart}/${widgetPath}.${typeof window !== 'undefined' ? 'js' : 'mjs'}`);
        return module.default;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async init(targetNode, callback, options = {}) {
    this.config = { ...this.config, ...options };
    const errors = [];
    const isDonePromises = [];

    // TODO: fill in this.initializedWidgets with all nodes (also nested ones) synchronously to prevent async init nested widget somewhere else
    //       NOTE: the above will not work if we add widgets in widget init markup!!!
    //             Remember path to targetNode?
    //             Or maybe create separate this.initializedInitializers .set(targetNode, something)
    //             and during initialization check if all parents of targetNode does not
    //             exist in this.initializedInitializers.
    const nodesToInit = targetNode.querySelectorAll(':scope > [widget], :scope > *:not([widget]) [widget]');
    const initPromises = Array.from(nodesToInit).map(async node => {
      const widgetPath = node.getAttribute('widget');
      this.initializedWidgets.set(
        node,
        widgetPath // TODO: change to relativeSelector
      ); // TODO: consider some lock here, because right now we have to remember that this line have to be before any await in this function!!!
      try {
        const WidgetClass = await this.loadWidgetClass(widgetPath);
        const widgetInstance = new WidgetClass();
        this.initializedWidgets.set(node, widgetInstance); // TODO: consider to store instances in separate WeakMap or just type (string/object) will indicate initialization state
        isDonePromises.push(widgetInstance.isDonePromise);
        widgetInstance.init(
          node,
          err => {
            if (err) {
              errors.push({ node, error: err });
            } else {
              console.log(`${widgetPath} Initialized.`);
            }
            widgetInstance.setIsDone(this);
          },
          this.config
        );
      } catch (err) {
        errors.push({ node, error: err });
      }
    });
    await Promise.all(initPromises); // await here is important to wait for all to add to: this.initializedWidgets
    
    try {
      console.log(`BEFORE ALL WIDGETS Initialized.`);
      await Promise.all(isDonePromises);
      console.log(`ALL WIDGETS Initialized.`);
      callback(errors.length ? errors : null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(targetNode) {
    console.log('WidgetsInitializer.destroy()');
  }
}

(typeof window !== 'undefined' ? window : global).WidgetsInitializer = new WidgetsInitializerInternal();