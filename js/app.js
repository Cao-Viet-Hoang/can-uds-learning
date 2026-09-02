/* ==========================================================================
   Core application: namespace, icons, router, navigation, theme, search.
   Loaded first. Content/lab scripts call APP.register(...). boot.js starts it.
   ========================================================================== */
(function () {
  "use strict";

  /* ----- Icon library (Feather-style, 24x24, stroke = currentColor) ----- */
  var ICONS = {
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
    info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    network: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 13v3"/>',
    wave: '<path d="M2 12h3l2-7 4 14 3-9 2 5 3-3h3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    merge: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.5 6.5c2 3 4 5 7 5M6 8.5v7"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9.5 12l1.8 1.8L15 10"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.2A8 8 0 1 1 21 12z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>',
    stack: '<rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="10.5" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="3.5" rx="1"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-8V3"/><path d="M7.5 15h9"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-.5-.5-2.1z"/>',
    car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 11h18v6H3z"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
    arrowRight: '<line x1="4" y1="12" x2="20" y2="12"/><path d="M14 6l6 6-6 6"/>',
    arrowLeft: '<line x1="20" y1="12" x2="4" y2="12"/><path d="M10 6l-6 6 6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    send: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-8-8-4z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    alert: '<path d="M12 3l9.5 16.5H2.5z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    step: '<path d="M5 5v14l8-7z"/><line x1="17" y1="5" x2="17" y2="19"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M17 4l3 3M15 6l3 3"/>',
    activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z"/>',
    grad: '<path d="M22 9L12 5 2 9l10 4 10-4z"/><path d="M6 11v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><line x1="22" y1="9" x2="22" y2="14"/>'
  };

  function icon(name) {
    var body = ICONS[name] || ICONS.info;
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + '</svg>';
  }

  /* Fill empty <span data-icon="name"></span> placeholders (static chrome in index.html) */
  function hydrateIcons(scope) {
    var host = scope || document;
    var nodes = host.querySelectorAll("[data-icon]");
    Array.prototype.forEach.call(nodes, function (el) {
      var name = el.getAttribute("data-icon");
      if (name && el.children.length === 0) el.innerHTML = icon(name);
    });
  }

  /* ----- Navigation structure (order + grouping) ----- */
  var NAV = [
    { label: "Bắt đầu", icon: "compass", items: ["intro"] },
    { label: "CAN Bus", icon: "network", items: ["can-basics", "can-physical", "can-frame", "can-arbitration", "can-errors"] },
    { label: "CAN FD", icon: "zap", items: ["canfd"] },
    { label: "UDS Diagnostics", icon: "message", items: ["uds-intro", "uds-format", "uds-services", "uds-security", "isotp", "autosar-routing"] },
    { label: "Thực hành (Labs)", icon: "flask", items: ["lab-can", "lab-arbitration", "lab-canfd", "lab-uds", "lab-dtc"] }
  ];

  /* ----- Public namespace ----- */
  var APP = {
    icon: icon,
    hydrateIcons: hydrateIcons,
    ICONS: ICONS,
    NAV: NAV,
    pages: {},
    order: [],          // flat ordered list of page ids
    _initCleanup: null,  // teardown for current lab

    register: function (id, cfg) {
      this.pages[id] = cfg;
    },

    /* small HTML-building helpers usable by content files */
    h: function (strings) {
      // tagged template passthrough: APP.h`...` returns the string
      if (Array.isArray(strings)) {
        var out = strings[0];
        for (var i = 1; i < arguments.length; i++) out += arguments[i] + strings[i];
        return out;
      }
      return strings;
    },
    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
  };

  window.APP = APP;

  /* ==================================================================
     Runtime wiring (called by boot.js after all pages registered)
     ================================================================== */
  APP.boot = function () {
    // Build flat order from NAV
    NAV.forEach(function (g) { g.items.forEach(function (id) { APP.order.push(id); }); });

    hydrateIcons();   // fill static topbar / sidebar-footer icon placeholders
    buildNav();
    wireTheme();
    wireMenu();
    wireSearch();
    wireProgress();

    window.addEventListener("hashchange", route);
    route();
  };

  /* ----- Navigation tree ----- */
  function buildNav() {
    var tree = document.getElementById("navTree");
    var html = "";
    NAV.forEach(function (group) {
      html += '<div class="nav-group">';
      // Label only — the group icon duplicated information the words already carry.
      html += '<div class="nav-group-label">' + group.label + "</div>";
      group.items.forEach(function (id) {
        var p = APP.pages[id];
        if (!p) return;
        var isLab = id.indexOf("lab-") === 0;
        html += '<a class="nav-link" data-id="' + id + '" href="#' + id + '">' +
          '<span data-icon>' + icon(p.icon || "book") + "</span>" +
          "<span>" + p.title + "</span>" +
          (isLab ? '<span class="lab-badge">LAB</span>' : "") +
          "</a>";
      });
      html += "</div>";
    });
    tree.innerHTML = html;
  }

  /* ----- Router ----- */
  function route() {
    var id = (location.hash || "#intro").slice(1);
    if (!APP.pages[id]) id = "intro";
    var page = APP.pages[id];

    // teardown previous lab if any
    if (typeof APP._initCleanup === "function") {
      try { APP._initCleanup(); } catch (e) {}
      APP._initCleanup = null;
    }

    var el = document.getElementById("page");
    el.innerHTML = page.render ? page.render() : "";
    // restart entrance animation
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";

    // run lab init
    if (typeof page.init === "function") {
      try { APP._initCleanup = page.init(el) || null; } catch (e) { console.error("init error", e); }
    }

    // active nav state
    document.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-id") === id);
    });

    buildPager(id);
    document.title = page.title + " · CAN·FD·UDS";

    // scroll to top of content
    var main = document.getElementById("content");
    main.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });

    // close mobile sidebar
    closeSidebar();
    updateProgress();
  }

  function buildPager(id) {
    var idx = APP.order.indexOf(id);
    var prev = idx > 0 ? APP.order[idx - 1] : null;
    var next = idx < APP.order.length - 1 ? APP.order[idx + 1] : null;
    var pager = document.getElementById("pager");
    var html = "";
    if (prev) {
      html += '<a class="prev" href="#' + prev + '">' + icon("arrowLeft") +
        '<span><span class="pg-dir">Trước</span><br><span class="pg-title">' + APP.pages[prev].title + "</span></span></a>";
    } else { html += '<a class="prev disabled"></a>'; }
    if (next) {
      html += '<a class="next" href="#' + next + '"><span><span class="pg-dir">Tiếp theo</span><br><span class="pg-title">' +
        APP.pages[next].title + "</span></span>" + icon("arrowRight") + "</a>";
    } else { html += '<a class="next disabled"></a>'; }
    pager.innerHTML = html;
  }

  /* ----- Theme ----- */
  function wireTheme() {
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved) root.setAttribute("data-theme", saved);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.setAttribute("data-theme", "dark");
    }
    document.getElementById("themeToggle").addEventListener("click", function () {
      var cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", cur);
      try { localStorage.setItem("theme", cur); } catch (e) {}
    });
  }

  /* ----- Mobile menu ----- */
  function wireMenu() {
    var btn = document.getElementById("menuToggle");
    var scrim = document.getElementById("scrim");
    btn.addEventListener("click", function () {
      var sb = document.getElementById("sidebar");
      var open = sb.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      scrim.hidden = !open;
    });
    scrim.addEventListener("click", closeSidebar);
  }
  function closeSidebar() {
    var sb = document.getElementById("sidebar");
    sb.classList.remove("open");
    document.getElementById("scrim").hidden = true;
    document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  }

  /* ----- Search ----- */
  function wireSearch() {
    var box = document.getElementById("searchBox");
    var results = document.getElementById("searchResults");
    var activeIdx = -1;
    var matches = [];

    function groupOf(id) {
      for (var i = 0; i < NAV.length; i++) if (NAV[i].items.indexOf(id) >= 0) return NAV[i].label;
      return "";
    }

    function build(q) {
      q = q.trim().toLowerCase();
      results.innerHTML = "";
      activeIdx = -1;
      if (!q) { results.hidden = true; return; }
      matches = APP.order.filter(function (id) {
        var p = APP.pages[id];
        var hay = (p.title + " " + (p.keywords || "")).toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      if (!matches.length) {
        results.innerHTML = '<div class="search-empty">Không tìm thấy kết quả cho “' + APP.esc(q) + '”</div>';
        results.hidden = false;
        return;
      }
      var html = "";
      matches.forEach(function (id) {
        var p = APP.pages[id];
        html += '<button class="search-result" data-id="' + id + '">' +
          icon(p.icon || "book") + "<span>" + p.title + "</span>" +
          '<span class="sr-group">' + groupOf(id) + "</span></button>";
      });
      results.innerHTML = html;
      results.hidden = false;
      Array.prototype.forEach.call(results.querySelectorAll(".search-result"), function (btn) {
        btn.addEventListener("mousedown", function (e) {
          e.preventDefault();
          location.hash = "#" + btn.getAttribute("data-id");
          box.value = ""; results.hidden = true;
        });
      });
    }

    box.addEventListener("input", function () { build(box.value); });
    box.addEventListener("focus", function () { if (box.value) build(box.value); });
    box.addEventListener("blur", function () { setTimeout(function () { results.hidden = true; }, 150); });
    box.addEventListener("keydown", function (e) {
      var items = results.querySelectorAll(".search-result");
      if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); }
      else if (e.key === "Enter") {
        if (activeIdx >= 0 && matches[activeIdx]) { location.hash = "#" + matches[activeIdx]; box.value = ""; results.hidden = true; box.blur(); }
        return;
      } else if (e.key === "Escape") { box.value = ""; results.hidden = true; box.blur(); return; }
      items.forEach(function (it, i) { it.classList.toggle("active", i === activeIdx); });
    });

    // keyboard shortcut "/" to focus search
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== box && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        e.preventDefault(); box.focus();
      }
    });
  }

  /* ----- Reading progress ----- */
  function wireProgress() {
    var main = document.getElementById("content");
    main.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("scroll", updateProgress, { passive: true });
  }
  function updateProgress() {
    var fill = document.getElementById("progressFill");
    if (!fill) return;
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop || document.body.scrollTop || 0;
    var height = (doc.scrollHeight - doc.clientHeight) || 1;
    var pct = Math.min(100, Math.max(0, (scrollTop / height) * 100));
    fill.style.width = pct + "%";
  }

  APP.updateProgress = updateProgress;
})();
