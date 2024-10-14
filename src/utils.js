export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const DebugTypes = Object.freeze({
  error: 'error',
  info: 'info',
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
    if ( el.hasAttribute('id') && el.id != '' ) {
      stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
    } else if ( sibCount > 1 ) {
      stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
    } else {
      stack.unshift(el.nodeName.toLowerCase());
    }
    el = el.parentNode;
  }

  const path = stack.slice(1); // removes the html element
  return path.join(' > ');
}

export default { sleep }