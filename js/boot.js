/* Starts the app once DOM + all page/lab scripts are parsed. */
(function () {
  "use strict";
  function start() { if (window.APP && APP.boot) APP.boot(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
