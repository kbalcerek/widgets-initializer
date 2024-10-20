export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const DebugTypes = Object.freeze({
  error: 'error',
  info: 'info',
});

export const ErrorTypes = Object.freeze({
  WidgetDestroyed: 'WidgetDestroyed',
});

// source: https://stackoverflow.com/a/16742828
export const getDomPath = (el) => {
  var stack = [];
  while ( el.parentNode != null ) {
    var sibCount = 0;
    var sibIndex = 0;
    for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
      var sib = el.parentNode.childNodes[i];
      if ( sib.nodeName == el.nodeName ) {
        if ( sib === el ) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    
    stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
    
    el = el.parentNode;
  }

  const path = stack.slice(1); // removes the html element
  return path.join(' > ');
}

/**
 * 
 * @param {HTMLElement} targetNode 
 * @returns array of HTMLElements that are widget nodes inside targetNode, but only the root ones, it doesn't return nested widgets
 */
export const getFirstLevelWidgetNodes = (targetNode) => {
  return targetNode.querySelectorAll(':scope [widget]:not(:scope [widget] [widget])'); //:scope > [widget], :scope > *:not([widget]) [widget]');;
}

export default { sleep }