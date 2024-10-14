
import { BaseWidget } from "./BaseWidget";
import { sleep, getDomPath, DebugTypes } from "./utils";

export const WidgetsInitializer = (typeof window !== 'undefined' ? window : global).WidgetsInitializer;
export { BaseWidget, sleep, getDomPath, DebugTypes };