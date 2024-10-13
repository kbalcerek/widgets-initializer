
import { BaseWidget } from "./BaseWidget";
import { sleep } from "./utils";

export const WidgetsInitializer = (typeof window !== 'undefined' ? window : global).WidgetsInitializer;
export { BaseWidget, sleep };