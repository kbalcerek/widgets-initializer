import { getDomPath, DebugTypes, getFirstLevelWidgetNodes, ErrorTypes, PATH_SEPARATOR } from "./utils";
import { remove } from 'lodash';

export class WidgetsInitializerInternal {
  constructor() {
    if ((typeof window !== 'undefined' ? window : global).WidgetsInitializer !== undefined) {
      throw new Error('Only one instance of WidgetsInitializerInternal is allowed!')
    }
  }

  defaultOptions = {
    /** custom Widget classes dynamic loader.
     * 
     * If provided this one will be used to load Widget classes (instead of import()), example:
     * ```
     * (path) => new Promise()
     * ```
     */
    resolver: undefined,
    /** name of the attribute that indicates widget nodes */
    widgetAttributeName: 'widget',
    /** if set to true targetNode won't be initialized if it is a widget (initialize only children) */
    skipTargetNode: false,
    debug: false,
  };
  config = this.defaultOptions;
  /** Contains only root nodes (the targetNode passed to WidgetsInitializer.init())
   * to mark which nodes are during initialization. Only the top level, not nested ones.
   * 
   * Elements are removed after this node has finished its initialization (with or without errors).
   * 
   * NOTE: we have to store list of nodes that are currently initialized outside of widget because it can be
   *       some not widget node, like simple div that contains widgets inside.
   * 
   * contains elements like:
   * ```
   * [
   *  {
   *    targetNode: HTMLElement,
   *    domPath: string,
   *    errorsInjected[key: ErrorTypes]: [IWidgetDestroyedErrorDetails | IOtherErrorTypeErrorDetails] // list of errors that will be injected into async WidgetsInitializer.init() if they happen before it finishes, for ex. .destroy() call may rise WidgetDestroyed
   *    // IOtherErrorTypeErrorDetails - of course this interface doesn't exist right now, it is here just to show the idea
   *  },
   * ]
   * 
   * interface IWidgetDestroyedErrorDetails {
   *    domPath: string, // path where this error should be applied
   * }
   * ```
  */
  nodesDuringInitialization = [];
  /** Contains nodes of initialized (or during initialization) widgets
   * 
   * contains elements like:
   * <HTMLElement, string | WidgetClass instance>
   * value:
   * string - WidgetClass has not been loaded (yet or by some error)
   * WidgetClass - loaded instance of the class
   */
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

  /**
   * 
   * @param {*} targetNode 
   * @param {*} callback 
   * @param {*} options 
   * @param {boolean} addToNodesDI used internally with false to avoid adding nested paths to this.nodesDuringInitialization
   */
  async init(targetNode, callback, options = {}, addToNodesDI = true) { // TODO: options here - make them configurable per instance (.init() call) because right now 2nd call will overwrite first one and will be common for all
    // TODO: cleanup debugLog for this targetNodeDomPath
    // TODO: check if targetNode isn't already initializing! (also including parents if they are not initializing)
    this.config = { ...this.config, ...options };
    const targetNodeDomPath = getDomPath(targetNode);
    if (addToNodesDI) {
      this.nodesDuringInitialization.push({
        targetNode,
        domPath: targetNodeDomPath,
        errorsInjected: {},
      });
    }
    const isDonePromises = [];

    // TODO: fill in this.initializedWidgets with all nodes (also nested ones) synchronously to prevent async init nested widget somewhere else
    //       NOTE: the above will not work if we add widgets in widget init markup!!!
    //             Remember path to targetNode?
    //             Or maybe create separate this.initializedInitializers .set(targetNode, something)
    //             and during initialization check if all parents of targetNode does not
    //             exist in this.initializedInitializers.
    const nodesToInit = getFirstLevelWidgetNodes(targetNode, this.config.widgetAttributeName, this.config.skipTargetNode);
    const initPromises = Array.from(nodesToInit).map(async widgetNode => {
      let widgetNodeFromInstance = undefined;
      const widgetPath = widgetNode.getAttribute(this.config.widgetAttributeName);
      this.initializedWidgets.set( // TODO: check if it isn't already initializing/initialized! if exist in this array then: continue
        widgetNode,
        widgetPath // TODO: change to relativeSelector
      ); // no lock here is required, because right now we have to remember that this line have to be before any await in this function!!!
      // TODO: create test to test in case somebody gives await in the future before above line,
      //       because in this case this.initializedWidgets cannot be guaranteed to be filled in properly if for
      //       example two nested paths are started with .init() This should be enough in test:
      //       WidgetsInitializer.init();
      //       WidgetsInitializer.init();
      try {
        const WidgetClass = await this.loadWidgetClass(widgetPath);
        const widgetInstance = new WidgetClass(widgetNode, widgetPath, getDomPath(widgetNode), this.config);
        widgetNodeFromInstance = widgetInstance.widgetNode;
        this.initializedWidgets.set(widgetNodeFromInstance, widgetInstance); // TODO: consider to store instances in separate WeakMap or just type (string/object) will indicate initialization state
        isDonePromises.push(widgetInstance.isDonePromise);
        widgetInstance.init(
          err => {
            if (err) {
              this.addDebugMsg(widgetNodeFromInstance, err, DebugTypes.error);
              widgetInstance.setIsDone(this);
            } else {
              // init all children
              WidgetsInitializer.init(
                widgetNodeFromInstance,
                (errChildren) => {
                  if (errChildren) {
                    this.addDebugMsg(widgetNodeFromInstance, `${widgetPath} initialization FAILED because children failed, calling setIsDone()...`, DebugTypes.error);
                  } else {
                    this.addDebugMsg(widgetNodeFromInstance, `${widgetPath} FULLY Initialized, calling setIsDone()...`, DebugTypes.info);
                  }
                  widgetInstance.setIsDone(this);
                },
                {
                  ...this.config,
                  skipTargetNode: true,
                },
                false
              ).catch((err) => {
                this.addDebugMsg(widgetNodeFromInstance, err, DebugTypes.error);
                widgetInstance.setIsDone(this);
              }); 
            }
          },
          this.config
        ).catch((err) => {
          this.addDebugMsg(widgetNodeFromInstance, err, DebugTypes.error);
          widgetInstance.setIsDone(this);
        });
      } catch (err) {
        this.addDebugMsg(widgetNodeFromInstance ?? widgetNode, err, DebugTypes.error);
      }
    });
    // TODO: targetNode may be outdated here because of replaceWith in BaseWidget.constructor
    try {
      await Promise.all(initPromises); // await here is important to wait for all to add to: this.initializedWidgets
    
      this.addDebugMsg(targetNode, `WAITING FOR ALL WIDGETS (inside ${this.initializedWidgets.get(targetNode)?.constructor.name || ''}: ${targetNodeDomPath}) to finish...`, DebugTypes.info);
      await Promise.all(isDonePromises);
      this.addDebugMsg(targetNode, `ALL WIDGETS (inside ${this.initializedWidgets.get(targetNode)?.constructor.name || ''}: ${targetNodeDomPath}) finished initialization. (with or without errors!), cleanup...`, DebugTypes.info);

      const errors = this.debugLog.filter(log => log.domPath.startsWith(targetNodeDomPath) && log.type === DebugTypes.error);

      // cleanup (handle errorsInjected)
      const parentDI = this.isNodeDuringInitialization(targetNode.parentNode);
      if (parentDI !== undefined) {
        // some upper node is still during initialization - do nothing, it will do cleanup later on
      } else {
        // targetNode is finalizing it's initialization
        const targetNodeDI = this.nodesDuringInitialization.find((obj) => obj.targetNode === targetNode);
        let nodesToDestroy = [];
        if (targetNodeDI.errorsInjected[ErrorTypes.WidgetDestroyed]) {
          nodesToDestroy = this.findWidgetDestroyedErrorsInjectedRootPathsOnly(targetNodeDI.errorsInjected[ErrorTypes.WidgetDestroyed])
            .map((wdErr) => Array.from(targetNode.ownerDocument.querySelectorAll(wdErr.domPath))) // select nodes from DOM basing on domPath
            .flat();

          delete targetNodeDI.errorsInjected[ErrorTypes.WidgetDestroyed];
        }

        // handle other errors here if any in the future

        if (Object.keys(targetNodeDI.errorsInjected).length > 0) {
          this.addDebugMsg(targetNode, `Not all errorsInjected handled: ${Object.keys(targetNodeDI.errorsInjected).join(', ')} (inside ${this.initializedWidgets.get(targetNode)?.constructor.name || ''}: ${targetNodeDomPath})`, DebugTypes.error);
        }
        
        remove(this.nodesDuringInitialization, (obj) => obj.targetNode === targetNode);
        
        nodesToDestroy.forEach(nodeToDestroy => this.destroy(nodeToDestroy)); // yes, in here, it have to be called after remove(this.nodesDuringInitialization...
      }

      callback(errors.length ? errors : null);
    } catch (err) {
      this.addDebugMsg(targetNode, err, DebugTypes.error);
      callback(err);
    }
  }

  destroy(targetNode) {
    const targetNodeDomPath = getDomPath(targetNode); 
    const targetNodeDI = this.isNodeDuringInitialization(targetNode);
    if (targetNodeDI !== undefined) {
      // targetNode is during initialization OR
      // targetNode is inside node that didn't finish yet it's initialization
      // -> send WidgetDestroyed error
      this.addDebugMsg(targetNode, `WidgetsInitializer.destroy(): targetNode is during initialization -> send WidgetDestroyed error (${targetNodeDomPath})`, DebugTypes.info);
      this.addToErrorsInjected(
        targetNodeDI.errorsInjected,
        ErrorTypes.WidgetDestroyed,
        { domPath: targetNodeDomPath }, // use targetNodeDomPath because it can be different then targetNodeDI.domPath (if targetNode is nested inside initializing path)
      );
    } else {
      // no parents in nodesDuringInitialization -> targetNode is NOT inside already initialized path:
      this.addDebugMsg(targetNode, `WidgetsInitializer.destroy(): no parents in nodesDuringInitialization -> targetNode is NOT inside already initialized path (${targetNodeDomPath})`, DebugTypes.info);
      const widgetNodesToDestroy =  getFirstLevelWidgetNodes(targetNode, this.config.widgetAttributeName);
      this.destroyNodes(widgetNodesToDestroy);
    }

    this.addDebugMsg(targetNode, `WidgetsInitializer.destroy(): END (${targetNodeDomPath})`, DebugTypes.info);
  }

  /** destroys widgetNodesToDestroy recursively.
   * Can be called only after making sure nodes are not inside other already initializing nodes
   * but nodes in passed array can be during initialization.
   * 
   * a) find root widget nodes
   * b) destroy them 1 by 1 synchronously
   * c) if some of them is during initialization mark it to receive WidgetDestroyed error after initialization finishes
   * d) destroy the rest synchronously 1 by 1
   */
  destroyNodes(widgetNodesToDestroy) {
    Array.from(widgetNodesToDestroy).forEach((widgetNode) => {
      const widgetNodeDomPath = getDomPath(widgetNode);
      const widgetNodeDI = this.isNodeDuringInitialization(widgetNode);
      if (widgetNodeDI !== undefined) {
        // widgetNode is during initialization -> send WidgetDestroyed error
        // NOTE: widget class may be not loaded yet, we cannot use it here
        this.addDebugMsg(widgetNode, `WidgetsInitializer.destroyNodes(): widgetNode is during initialization -> send WidgetDestroyed error (${widgetNodeDomPath})`, DebugTypes.info);
        if (
          widgetNodeDI.domPath !== widgetNodeDomPath ||
          widgetNodeDI.targetNode !== widgetNode
        ) {
          this.addDebugMsg(widgetNode, `WidgetsInitializer.destroyNodes(): unexpected error, widgetNodeDI.domPath !== widgetNodeDomPath (${widgetNodeDomPath})`, DebugTypes.error);
          // widgetNodeDI.targetNode here should be the widgetNode because this method
          // "Can be called only after making sure nodes are not inside other already initializing nodes"
        }
        this.addToErrorsInjected(
          widgetNodeDI.errorsInjected,
          ErrorTypes.WidgetDestroyed,
          { domPath: widgetNodeDI.domPath }
        );
        return;
      } else {
        // widget finished initialization (with or without errors)
        const widgetClassInstance = this.initializedWidgets.get(widgetNode);
        if (widgetClassInstance === undefined) {
          // NOT INITIALIZED, cannot destroy not initialized, do nothing
          this.addDebugMsg(widgetNode, `WidgetsInitializer.destroyNodes(): NOT INITIALIZED, cannot destroy not initialized, do nothing (${widgetNodeDomPath})`, DebugTypes.info);
        } else if (typeof(widgetClassInstance) === 'string') {
          // widget class has not been loaded, there had to be error during loading widget class
          // cleanup
          this.addDebugMsg(widgetNode, `WidgetsInitializer.destroyNodes(): widget class has not been loaded, there had to be error during loading widget class (${widgetNodeDomPath})`, DebugTypes.info);
          this.initializedWidgets.delete(widgetNode);
          return;
        } else {
          this.addDebugMsg(widgetNode, `WidgetsInitializer.destroyNodes(): calling ${widgetClassInstance.constructor.name}.destroy()... (${widgetNodeDomPath})`, DebugTypes.info);
          widgetClassInstance.destroy();
          this.initializedWidgets.delete(widgetNode);
        }
      }
      this.addDebugMsg(widgetNodeDomPath, `WidgetsInitializer.destroyNodes(): FINISHED DESTROYING (${widgetNodeDomPath})`, DebugTypes.info);
    });
  }

  /** Traverse up (starting from targetNode inclusive) if it is in this.nodesDuringInitialization */
  isNodeDuringInitialization(targetNode) {
    let currentNode = targetNode;

    while (currentNode) {
      const nodeDI = this.nodesDuringInitialization.find((obj) => obj.targetNode === currentNode);
      if (nodeDI !== undefined) {
        return nodeDI;
      }
      currentNode = currentNode.parentNode;
    }

    return undefined;
  }
  
  /**
   * 
   * @param {{ domPath: string }} widgetDestroyedErrorsInjected 
   * @returns filters out only root paths (domPath)
   */
  findWidgetDestroyedErrorsInjectedRootPathsOnly(widgetDestroyedErrorsInjected) {
    let result = [...widgetDestroyedErrorsInjected];

    // TODO: it probably can be written in more optimal way, but let's leave it right now as is
    widgetDestroyedErrorsInjected.forEach(widgetDestroyedError => {
      result = result.filter(resultError =>
        !resultError.domPath.startsWith(widgetDestroyedError.domPath + PATH_SEPARATOR) // all that don't start with this + separator
      );
    });

    return result;
}

  addDebugMsg(targetNodeOrPath, msg, type = DebugTypes.info) {
    // if (!WEBPACK_isProd) {
    if (
      this.config.debug ||
      type !== DebugTypes.info // errors (and other debug messages other then "info", like maybe someday warnings) should be always added to debugLog, because they are later on returned in callback
    ) {
      if (Array.isArray(msg)) {
        msg.forEach((m) => this.addDebugMsg(targetNodeOrPath, m.msg, m.type));
        return;
      }
      console.log(msg);
      const targetNodeDomPath = typeof(targetNodeOrPath) === 'string'
        ? targetNodeOrPath
        : getDomPath(targetNodeOrPath);
      this.debugLog.push({
        domPath: targetNodeDomPath,
        type,
        debugMsg: msg,
      })
    }
  }

  addToErrorsInjected(errorsInjected, errorType, obj) {
    if (errorsInjected[errorType] === undefined) {
      errorsInjected[errorType] = [];
    }
    errorsInjected[errorType].push(obj);
  }
}

(typeof window !== 'undefined' ? window : global).WidgetsInitializer = new WidgetsInitializerInternal();
export const WidgetsInitializer = (typeof window !== 'undefined' ? window : global).WidgetsInitializer;