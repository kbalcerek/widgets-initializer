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

export const PATH_SEPARATOR = ' > ';

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
    
    stack.unshift(
      el.nodeName.toLowerCase() + 
      (
        el.nodeName.toLowerCase() !== 'body' 
          ? ':nth-child(' + (sibIndex+1) + ')'
          : '' // don't add nth-child for body because we use paths in querySelectorAll() and it doesn't work when body:nth-child()
      )
    );
    
    el = el.parentNode;
  }

  const path = stack.slice(1); // removes the html element
  return path.join(PATH_SEPARATOR);
}

/**
 * 
 * @param {HTMLElement} targetNode 
 * @returns array of HTMLElements that are widget nodes inside targetNode, but only the root ones, it doesn't return nested widgets
 */
export const getFirstLevelWidgetNodes = (targetNode) => {
  const rootWidgets = [];

  function traverse(node) {
    if (node.hasAttribute('widget')) {
      rootWidgets.push(node);
      return;
    }

    for (let child of node.children) {
      traverse(child);
    }
  }

  for (let child of targetNode.children) {
    traverse(child);
  }

  return rootWidgets;
}

export default { sleep }