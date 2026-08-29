/* Lab: CAN FD Builder — dựng khung CAN FD ở mức bit, CRC-17/21, stuff count, so sánh Classical CAN */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  var DLC_MAP = { 0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:12,10:16,11:20,12:24,13:32,14:48,15:64 };

  APP.register("lab-canfd", {
    title: "CAN FD Builder",
    icon: "zap",
    keywords: "lab canfd builder brs esi fdf dlc 64 byte payload stuff count crc17 crc21 so sanh classical thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">CAN FD Builder</h1>' +
'<p class="page-lead">Nhập Identifier và dữ liệu, hệ thống dựng toàn bộ khung CAN FD ở mức bit: bit-stuffing động, Stuff Count, CRC-17/21, và tách rõ hai pha tốc độ khi bật BRS.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab">' +

'<div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Cấu hình khung FD</span></div><div class="lab-panel-body">' +
'<div class="field-row">' +
'<div class="field"><label>Identifier <span class="hint">(hex, 11-bit)</span></label><input class="input" id="fd-id" value="18F" spellcheck="false"></div>' +
'<div class="field"><label>DLC → kích thước payload</label><select class="select" id="fd-dlc">' +
Object.keys(DLC_MAP).map(function(k){return '<option value="'+k+'"'+(+k===10?' selected':'')+'>DLC '+k+' → '+DLC_MAP[k]+' byte</option>';}).join('') +
'</select></div>' +
'</div>' +

'<div class="switch-row"><label class="switch"><input type="checkbox" id="fd-brs" checked><span class="slider"></span></label>' +
'<span class="switch-label">BRS — Bit Rate Switch <small>Bật = pha dữ liệu chạy tốc độ cao</small></span></div>' +
'<div class="switch-row"><label class="switch"><input type="checkbox" id="fd-esi"><span class="slider"></span></label>' +
'<span class="switch-label">ESI — Error State Indicator <small>Bật = node đang error-passive</small></span></div>' +

'<div class="field-row">' +
'<div class="field"><label>Nominal bitrate</label><select class="select" id="fd-nom"><option value="500000" selected>500 kbit/s</option><option value="250000">250 kbit/s</option><option value="1000000">1 Mbit/s</option></select></div>' +
'<div class="field"><label>Data bitrate</label><select class="select" id="fd-data"><option value="2000000" selected>2 Mbit/s</option><option value="4000000">4 Mbit/s</option><option value="5000000">5 Mbit/s</option><option value="8000000">8 Mbit/s</option></select></div>' +
'</div>' +

'<div class="field" id="fd-bytes-field"><label>Data bytes <span class="hint">(hex, mỗi ô 1 byte)</span></label>' +
'<div class="byte-grid" id="fd-bytes"></div></div>' +

'<div class="btn-row"><button class="btn primary" id="fd-build">' + I("play") + 'Phân tích khung</button>' +
'<button class="btn" id="fd-rand">' + I("refresh") + 'Ngẫu nhiên</button></div>' +
'</div></div>' +

'<div class="lab-panel"><div class="lab-panel-head">' + I("activity") + '<span>Kết quả</span><span class="lp-sub" id="fd-summary"></span></div><div class="lab-panel-body" id="fd-out"></div></div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Khi bật BRS, tốc độ đổi <strong>ngay sau bit BRS</strong> — nên ESI, DLC, Data, Stuff Count và CRC chạy ở data bitrate, rồi quay về nominal <strong>từ CRC delimiter</strong> trở đi. CAN FD có hai loại stuff bit: <em>dynamic</em> (viền cam nét đứt, theo quy tắc 5 bit cùng mức như Classical CAN, áp dụng từ SOF đến hết Data) và <em>fixed</em> (viền xanh chấm, đặt cố định trước Stuff Count, trước chuỗi CRC và sau mỗi 4 bit CRC). Khác Classical CAN, CRC của FD được tính <strong>bao gồm cả stuff bit</strong> và thanh ghi CRC khởi tạo bằng 1 ở bit cao nhất.</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#canfd">CAN FD — Tổng quan</a>.</p></div></div>' +

'</div>'
      );
    },
    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };
      var out = $("#fd-out"), summary = $("#fd-summary"), bytesWrap = $("#fd-bytes");
      var showLabels = true;

      function payloadLen() { return DLC_MAP[parseInt($("#fd-dlc").value, 10)]; }

      function buildByteInputs() {
        var n = payloadLen();
        var cur = getBytes();
        var html = "";
        for (var i = 0; i < n; i++) {
          var v = cur[i] != null ? cur[i] : (i & 0xff).toString(16).toUpperCase().padStart(2, "0");
          html += '<div><input class="byte-box" maxlength="2" value="'+v+'" spellcheck="false"><div class="byte-index">D'+i+'</div></div>';
        }
        if (n === 0) html = '<span class="muted" style="font-size:13px">DLC = 0 · không có byte dữ liệu</span>';
        bytesWrap.innerHTML = html;
        bytesWrap.querySelectorAll(".byte-box").forEach(function (b) {
          b.addEventListener("input", function () { b.value = b.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0,2); });
        });
      }
      function getBytes() {
        return Array.prototype.map.call(bytesWrap.querySelectorAll(".byte-box"), function (b) {
          return (b.value || "0").toUpperCase().padStart(2, "0").slice(-2);
        });
      }

      function bits(num, width) {
        var s = (num >>> 0).toString(2);
        while (s.length < width) s = "0" + s;
        return s.slice(-width).split("").map(Number);
      }

      // CAN FD CRC. Two differences from Classical CAN's CRC-15, both per
      // ISO 11898-1:2015: the register starts with a 1 in its top bit instead
      // of all zeros, and the sequence it runs over includes the stuff bits.
      function crcFd(arr, len) {
        var poly = len === 17 ? 0x1685b : 0x102899;   // leading x^len term dropped
        var mask = (1 << len) - 1;
        var crc = 1 << (len - 1);
        for (var i = 0; i < arr.length; i++) {
          var msb = (crc >> (len - 1)) & 1;
          crc = (crc << 1) & mask;
          if (msb ^ arr[i]) crc ^= poly;
        }
        return crc >>> 0;
      }

      function build() {
        var dlc = parseInt($("#fd-dlc").value, 10);
        var nBytes = DLC_MAP[dlc];
        var brs = $("#fd-brs").checked;
        var esi = $("#fd-esi").checked;
        var nom = parseInt($("#fd-nom").value, 10);
        var dataRate = parseInt($("#fd-data").value, 10);
        var crcLen = nBytes > 16 ? 21 : 17;
        var idVal = parseInt($("#fd-id").value.replace(/[^0-9a-fA-F]/g, "") || "0", 16) & 0x7ff;
        var dataBytes = getBytes().slice(0, nBytes).map(function (h) { return parseInt(h || "0", 16); });

        // ---- SOF .. end of Data: the region dynamic bit-stuffing covers ----
        // `phase` marks which bit rate the bit goes out at: BRS itself is still
        // nominal, the switch takes effect from ESI onward.
        var pre = [];
        function push(vArr, label, cls, phase) {
          vArr.forEach(function (v) { pre.push({ v: v, label: label, cls: cls, phase: phase }); });
        }
        push([0], "SOF", "sof", "nom1");
        push(bits(idVal, 11), "Identifier", "arb", "nom1");
        push([0], "RRS", "arb", "nom1");          // replaces RTR, always dominant in FD
        push([0], "IDE", "ctrl", "nom1");
        push([1], "FDF", "ctrl", "nom1");         // recessive → this is an FD frame
        push([0], "res", "ctrl", "nom1");
        push([brs ? 1 : 0], "BRS", "ctrl", "nom1");
        push([esi ? 1 : 0], "ESI", "ctrl", "fast");
        push(bits(dlc, 4), "DLC", "ctrl", "fast");
        dataBytes.forEach(function (b, i) { push(bits(b, 8), "D" + i, "data", "fast"); });

        var all = [], run = 0, last = null, dynCount = 0;
        pre.forEach(function (b) {
          if (b.v === last) run++; else { run = 1; last = b.v; }
          all.push({ v: b.v, label: b.label, cls: b.cls, phase: b.phase, stuff: null });
          if (run === 5) {
            var s = b.v === 0 ? 1 : 0;
            all.push({ v: s, label: b.label, cls: b.cls, phase: b.phase, stuff: "dyn" });
            dynCount++; last = s; run = 1;
          }
        });

        // A fixed stuff bit is simply the inverse of the bit before it — its
        // job is to mark a known position, not to break up a run.
        function addFixed(label) {
          all.push({ v: all[all.length-1].v ? 0 : 1, label: label, cls: "crc", phase: "fast", stuff: "fixed" });
        }

        // ---- Stuff Count: how many dynamic stuff bits were inserted (mod 8),
        // gray-coded, plus an even-parity bit. Lets the receiver verify it
        // destuffed the same number of bits the transmitter stuffed. --------
        addFixed("Stuff Count");
        var sc = dynCount % 8;
        var g = bits(sc ^ (sc >> 1), 3);
        var scBits = g.concat([g[0] ^ g[1] ^ g[2]]);
        scBits.forEach(function (v) { all.push({ v: v, label: "Stuff Count", cls: "crc", phase: "fast", stuff: null }); });

        var crc = crcFd(all.map(function (b) { return b.v; }), crcLen);
        var crcBits = bits(crc, crcLen);
        var crcLabel = "CRC-" + crcLen;

        addFixed(crcLabel);
        crcBits.forEach(function (v, i) {
          all.push({ v: v, label: crcLabel, cls: "crc", phase: "fast", stuff: null });
          if ((i + 1) % 4 === 0 && i + 1 < crcLen) addFixed(crcLabel);
        });

        // ---- trailer: back at nominal from the CRC delimiter on. All recessive;
        // ACK slot is shown as the transmitter sends it, before a receiver
        // pulls it dominant. No stuffing applies here. -----------------------
        function post(n, label, cls) {
          for (var i = 0; i < n; i++) all.push({ v: 1, label: label, cls: cls, phase: "nom2", stuff: null });
        }
        post(1, "CRC del", "crc"); post(1, "ACK slot", "ack"); post(1, "ACK del", "ack");
        post(7, "EOF", "eof"); post(3, "IFS", "eof");

        var fixedCount = all.filter(function (b) { return b.stuff === "fixed"; }).length;
        var fastBits = all.filter(function (b) { return b.phase === "fast"; }).length;
        var nomBits = all.length - fastBits;
        var totalBits = all.length;
        var totalUs = (nomBits / nom + fastBits / (brs ? dataRate : nom)) * 1e6;

        // ---- Classical CAN carrying the same payload, via ISO-TP -----------
        // A classical frame maxes out at 8 data bytes, so anything over 7 has
        // to be segmented: 1 First Frame (6 payload bytes) + Consecutive Frames
        // (7 each), and the receiver answers with one Flow Control frame.
        // Every frame is padded to DLC 8, so each costs 47 + 64 bits incl. IFS.
        var CLASSIC_BITS = 47 + 64;
        var cfCount = nBytes <= 7 ? 0 : Math.ceil((nBytes - 6) / 7);
        var classicalFrames = (nBytes <= 7 ? 1 : 1 + cfCount) + (nBytes <= 7 ? 0 : 1);
        var classicalUs = (classicalFrames * CLASSIC_BITS / nom) * 1e6;
        var segNote = nBytes <= 7
          ? "1 Single Frame"
          : "1 First Frame (6 byte) + " + cfCount + " Consecutive Frame (7 byte) + 1 Flow Control";

        // ---- one band per bit-rate phase, bits grouped by field inside ----
        function band(phase, cap, fast) {
          var groups = [];
          all.forEach(function (b) {
            if (b.phase !== phase) return;
            var g = groups[groups.length - 1];
            if (g && g.label === b.label) g.items.push(b);
            else groups.push({ label: b.label, cls: b.cls, items: [b] });
          });
          var html = groups.map(function (g) {
            var cells = g.items.map(function (b) {
              var cls = "bit " + (b.v === 0 ? "b0" : "b1") +
                        (b.stuff === "dyn" ? " stuffed" : b.stuff === "fixed" ? " fixed" : "");
              var t = g.label + (b.stuff === "dyn" ? " (+ dynamic stuff bit)" : b.stuff === "fixed" ? " (+ fixed stuff bit)" : "");
              return '<span class="'+cls+'" title="'+APP.esc(t)+'">'+b.v+'</span>';
            }).join("");
            return '<div class="bit-group"><div class="bit-group-label '+g.cls+'">'+APP.esc(g.label)+'</div>' +
                   '<div class="bit-group-bits">'+cells+'</div></div>';
          }).join("");
          return '<div class="fd-phase'+(fast ? ' fast' : '')+'"><div class="fd-phase-cap">'+APP.esc(cap)+'</div>' +
                 '<div class="bitstream">'+html+'</div></div>';
        }

        var idHex = "0x" + idVal.toString(16).toUpperCase().padStart(3, "0");
        var dataHex = dataBytes.length
          ? dataBytes.map(function (b) { return b.toString(16).toUpperCase().padStart(2,"0"); }).join(" ")
          : "(rỗng)";
        var kbit = function (r) { return r >= 1e6 ? (r/1e6) + " Mbit/s" : (r/1000) + " kbit/s"; };

        summary.textContent = totalBits + " bit · " + totalUs.toFixed(1) + " µs";

        out.innerHTML =
          '<div class="result-box"><div class="rb-label">Tóm tắt trường</div>' +
          '<table class="data" style="border:none"><tbody>' +
          r("Identifier", idHex + " (11-bit)") +
          r("Payload", nBytes + " byte (DLC " + dlc + " = " + bits(dlc,4).join("") + ")") +
          r("Data", dataHex) +
          r("FDF", "1 (khung FD)") +
          r("BRS", brs ? "1 — data phase tốc độ cao" : "0 — giữ nominal") +
          r("ESI", esi ? "1 — error-passive" : "0 — error-active") +
          r("Stuff Count", dynCount + " mod 8 = " + sc + " → gray " + g.join("") + " + parity " + scBits[3]) +
          r(crcLabel, "0x" + crc.toString(16).toUpperCase().padStart(Math.ceil(crcLen/4),"0") + " (" + crcBits.join("") + ")") +
          '</tbody></table></div>' +

          '<div class="result-box"><div class="rb-label">Thống kê trên bus</div>' +
          '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
          stat(totalBits, "tổng bit") + stat(dynCount, "dynamic stuff") + stat(fixedCount, "fixed stuff") +
          stat(nomBits + "/" + fastBits, "bit nominal / data") + stat(totalUs.toFixed(1)+" µs", "thời gian") +
          '</div></div>' +

          '<div class="result-box"><div class="rb-label" style="display:flex;align-items:center;justify-content:space-between;gap:10px">' +
          '<span>Chuỗi bit trên bus (SOF → EOF + IFS)</span>' +
          '<label style="display:flex;align-items:center;gap:6px;text-transform:none;font-weight:500;color:var(--text-muted);cursor:pointer">' +
          '<input type="checkbox" id="fd-show-labels"'+(showLabels ? ' checked' : '')+'>Hiện nhãn trường</label>' +
          '</div>' +
          '<div id="fd-frame"'+(showLabels ? '' : ' class="hide-labels"')+'>' +
          band("nom1", "nominal · " + kbit(nom), false) +
          band("fast", brs ? "data rate · " + kbit(dataRate) + " (BRS = 1)" : "nominal · " + kbit(nom) + " (BRS = 0)", brs) +
          band("nom2", "nominal · " + kbit(nom), false) +
          '</div>' +
          '<div class="bit-legend">' +
            '<span><span class="swatch" style="background:var(--dominant)"></span>dominant (0)</span>' +
            '<span><span class="swatch" style="background:var(--recessive);border:1px solid var(--border-strong)"></span>recessive (1)</span>' +
            '<span><span class="swatch" style="border:2px dashed var(--c-amber)"></span>dynamic stuff</span>' +
            '<span><span class="swatch" style="border:2px dotted var(--c-blue)"></span>fixed stuff</span>' +
          '</div></div>' +

          '<div class="result-box"><div class="rb-label">So với Classical CAN (qua ISO-TP)</div>' +
          '<p style="font-family:var(--font-sans);font-size:14px;color:var(--text-soft);margin-bottom:10px">Để chở '+nBytes+' byte, Classical CAN cần <strong>'+classicalFrames+' khung</strong>: '+segNote+'.</p>' +
          '<div style="display:flex;gap:22px;flex-wrap:wrap">' +
          stat(classicalFrames+"×", "khung classical") + stat("~"+classicalUs.toFixed(1)+" µs", "tổng classical") +
          '</div>' +
          (nBytes > 7
            ? '<div class="callout tip">'+co("zap")+'<div class="callout-body"><p>CAN FD gói trọn trong <strong>1 khung</strong>'+(brs?' và chạy nhanh phần dữ liệu':'')+' → nhanh hơn khoảng <strong>'+ (classicalUs/totalUs).toFixed(1) +'×</strong>. Con số này còn <em>chưa</em> tính STmin (thời gian nghỉ giữa các Consecutive Frame) mà Flow Control yêu cầu, nên thực tế khoảng cách còn lớn hơn.</p></div></div>'
            : '<div class="callout info">'+co("info")+'<div class="callout-body"><p>Với ≤ 7 byte, cả hai đều gửi trong 1 khung — CAN FD chỉ nhanh hơn nếu bật BRS.</p></div></div>') +
          (nBytes > 62
            ? '<div class="callout warn">'+co("alert")+'<div class="callout-body"><p>Lưu ý: ISO-TP Single Frame trên CAN FD chở tối đa <strong>62 byte</strong> (header 2 byte). Payload 64 byte vì thế vẫn phải chia FF + CF ở tầng ISO-TP, dù khung FD chở được 64 byte dữ liệu.</p></div></div>'
            : '') +
          '</div>';
      }
      function r(k,v){return '<tr><td style="width:120px;color:var(--text-muted)">'+k+'</td><td class="mono"><strong>'+APP.esc(v)+'</strong></td></tr>';}
      function stat(v,l){return '<div><div class="hex-out">'+v+'</div><div class="muted" style="font-size:12px">'+l+'</div></div>';}

      // Delegated on `out`, which survives the innerHTML rewrite that every
      // build() does — same approach as the CAN lab's label toggle.
      out.addEventListener("change", function (e) {
        if (e.target && e.target.id === "fd-show-labels") {
          showLabels = e.target.checked;
          var frame = $("#fd-frame");
          if (frame) frame.classList.toggle("hide-labels", !showLabels);
        }
      });

      $("#fd-id").addEventListener("input", function(){ this.value = this.value.replace(/[^0-9a-fA-F]/g,"").toUpperCase().slice(0,3); });
      $("#fd-build").addEventListener("click", build);
      $("#fd-rand").addEventListener("click", function () {
        var rnd = function (max) { return Math.floor(Math.random() * max); };
        $("#fd-id").value = rnd(0x800).toString(16).toUpperCase();
        bytesWrap.querySelectorAll(".byte-box").forEach(function (b) { b.value = rnd(256).toString(16).toUpperCase().padStart(2,"0"); });
        build();
      });
      $("#fd-dlc").addEventListener("change", function(){ buildByteInputs(); build(); });
      ["#fd-brs","#fd-esi","#fd-nom","#fd-data"].forEach(function(s){ $(s).addEventListener("change", build); });

      buildByteInputs();
      build();
    }
  });
})();
