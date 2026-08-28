/* Lab: CAN FD Builder — khám phá DLC mapping, BRS/ESI, so sánh với Classical CAN */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  var DLC_MAP = { 0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:12,10:16,11:20,12:24,13:32,14:48,15:64 };

  APP.register("lab-canfd", {
    title: "CAN FD Builder",
    icon: "zap",
    keywords: "lab canfd builder brs esi fdf dlc 64 byte payload so sanh classical thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">CAN FD Builder</h1>' +
'<p class="page-lead">Chọn kích thước payload (theo DLC của CAN FD), bật/tắt Bit Rate Switch và Error State Indicator, rồi so sánh hiệu quả với Classical CAN.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab"><div class="lab-grid">' +

'<div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Cấu hình khung FD</span></div><div class="lab-panel-body">' +
'<div class="field"><label>Identifier (hex, 11-bit)</label><input class="input" id="fd-id" value="18F" spellcheck="false"></div>' +
'<div class="field"><label>DLC → kích thước payload</label><select class="select" id="fd-dlc">' +
Object.keys(DLC_MAP).map(function(k){return '<option value="'+k+'"'+(+k===15?' selected':'')+'>DLC '+k+' → '+DLC_MAP[k]+' byte</option>';}).join('') +
'</select></div>' +

'<div class="switch-row"><label class="switch"><input type="checkbox" id="fd-brs" checked><span class="slider"></span></label>' +
'<span class="switch-label">BRS — Bit Rate Switch <small>Bật = pha dữ liệu chạy tốc độ cao</small></span></div>' +
'<div class="switch-row"><label class="switch"><input type="checkbox" id="fd-esi"><span class="slider"></span></label>' +
'<span class="switch-label">ESI — Error State Indicator <small>Bật = node đang error-passive</small></span></div>' +

'<div class="field-row">' +
'<div class="field"><label>Nominal bitrate</label><select class="select" id="fd-nom"><option value="500000" selected>500 kbit/s</option><option value="250000">250 kbit/s</option><option value="1000000">1 Mbit/s</option></select></div>' +
'<div class="field"><label>Data bitrate</label><select class="select" id="fd-data"><option value="2000000" selected>2 Mbit/s</option><option value="4000000">4 Mbit/s</option><option value="5000000">5 Mbit/s</option><option value="8000000">8 Mbit/s</option></select></div>' +
'</div>' +
'<button class="btn primary" id="fd-build">' + I("play") + 'Phân tích khung</button>' +
'</div></div>' +

'<div class="lab-panel"><div class="lab-panel-head">' + I("activity") + '<span>Kết quả</span></div><div class="lab-panel-body" id="fd-out"></div></div>' +

'</div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Cách tính: khi bật BRS, tốc độ đổi <strong>ngay tại bit BRS</strong> — nên ESI, DLC, Data, Stuff Count và CRC chạy ở data bitrate, rồi quay về nominal <strong>từ CRC delimiter</strong> trở đi. Các <em>fixed stuff bit</em> (1 bit trước Stuff Count + 1 bit sau mỗi 4 bit CRC) là cố định nên đã được cộng sẵn. Còn <em>dynamic stuff bit</em> phụ thuộc mẫu bit thực tế nên chỉ nêu khoảng.</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#canfd">CAN FD — Tổng quan</a>.</p></div></div>' +

'</div>'
      );
    },
    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };
      var out = $("#fd-out");

      function build() {
        var dlc = parseInt($("#fd-dlc").value, 10);
        var bytes = DLC_MAP[dlc];
        var brs = $("#fd-brs").checked;
        var esi = $("#fd-esi").checked;
        var nom = parseInt($("#fd-nom").value, 10);
        var data = parseInt($("#fd-data").value, 10);
        var crcLen = bytes > 16 ? 21 : 17;

        // ---- Exact field sizes of a standard (11-bit) CAN FD frame ----------
        // Split by phase: with BRS the bit rate switches at the BRS bit (so ESI
        // onward runs at the data rate) and switches back at the CRC delimiter.
        // Fixed stuff bits: one before the Stuff Count field, then one after
        // every 4 bits of the CRC sequence. These are deterministic.
        var fixedStuff = 1 + Math.floor(crcLen / 4);

        var NOM_PRE = [                       // SOF .. BRS — always nominal
          ["SOF", 1], ["Identifier", 11], ["RRS", 1], ["IDE", 1],
          ["FDF", 1], ["res", 1], ["BRS", 1]
        ];
        var FAST = [                          // ESI .. CRC — data rate if BRS
          ["ESI", 1], ["DLC", 4], ["Data field", bytes * 8],
          ["Stuff Count (3-bit gray + parity)", 4],
          ["CRC-" + crcLen, crcLen],
          ["Fixed stuff bit", fixedStuff]
        ];
        var NOM_POST = [                      // CRC delimiter .. IFS — nominal
          ["CRC delimiter", 1], ["ACK slot", 1], ["ACK delimiter", 1],
          ["EOF", 7], ["IFS", 3]
        ];
        var sum = function (rows) { return rows.reduce(function (a, x) { return a + x[1]; }, 0); };

        var nomBits  = sum(NOM_PRE) + sum(NOM_POST);
        var fastBits = sum(FAST);
        var totalBits = nomBits + fastBits;

        // Dynamic stuff bits depend on the actual bit pattern, which this lab
        // does not have (only the payload size is chosen) — so report a bound
        // instead of inventing a number. Dynamic stuffing covers SOF..Stuff
        // Count; worst case is one stuff bit per 4 original bits.
        var dynRegion = sum(NOM_PRE) + 1 + 4 + bytes * 8 + 4;
        var dynMax = Math.floor((dynRegion - 1) / 4);

        var fastRate = brs ? data : nom;
        var totalUs = (nomBits / nom + fastBits / fastRate) * 1e6;

        // ---- Classical CAN carrying the same payload, via ISO-TP -----------
        // A classical frame maxes out at 8 data bytes, so anything over 7 has
        // to be segmented: 1 First Frame (6 payload bytes) + Consecutive Frames
        // (7 each), and the receiver answers with one Flow Control frame.
        // Every frame is padded to DLC 8, so each costs 47 + 64 bits incl. IFS.
        var CLASSIC_BITS = 47 + 64;
        var cfCount = bytes <= 7 ? 0 : Math.ceil((bytes - 6) / 7);
        var dataFrames = bytes <= 7 ? 1 : 1 + cfCount;
        var fcFrames = bytes <= 7 ? 0 : 1;
        var classicalFrames = dataFrames + fcFrames;
        var classicalBits = classicalFrames * CLASSIC_BITS;
        var classicalUs = (classicalBits / nom) * 1e6;
        var segNote = bytes <= 7
          ? "1 Single Frame"
          : "1 First Frame (6 byte) + " + cfCount + " Consecutive Frame (7 byte) + 1 Flow Control";

        var idVal = (parseInt($("#fd-id").value || "0", 16) & 0x7ff).toString(16).toUpperCase().padStart(3,"0");

        function fieldRows(rows, phase) {
          return rows.filter(function (x) { return x[1] > 0; }).map(function (x) {
            return '<tr><td style="font-family:var(--font-sans)">'+x[0]+'</td>' +
                   '<td class="mono" style="width:60px;text-align:right">'+x[1]+'</td>' +
                   '<td style="width:96px;font-family:var(--font-sans);color:var(--text-muted);font-size:13px">'+phase+'</td></tr>';
          }).join("");
        }
        var fastPhase = brs ? "data rate" : "nominal";

        out.innerHTML =
          '<div class="result-box"><div class="rb-label">Khung CAN FD</div>' +
          '<table class="data" style="border:none"><tbody>' +
          r("Identifier", "0x"+idVal) +
          r("Payload", bytes + " byte (DLC "+dlc+")") +
          r("FDF", "1 (khung FD)") +
          r("BRS", brs ? "1 — data phase tốc độ cao" : "0 — giữ nominal") +
          r("ESI", esi ? "1 — error-passive" : "0 — error-active") +
          r("CRC", "CRC-"+crcLen+(bytes>16?" (payload > 16 byte)":" (payload ≤ 16 byte)")) +
          '</tbody></table></div>' +

          '<div class="result-box"><div class="rb-label">Ngân sách bit từng trường</div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Trường</th><th style="text-align:right">bit</th><th>Pha</th></tr></thead><tbody>' +
          fieldRows(NOM_PRE, "nominal") +
          fieldRows(FAST, fastPhase) +
          fieldRows(NOM_POST, "nominal") +
          '<tr><td style="font-family:var(--font-sans);font-weight:600">Tổng (cố định)</td>' +
          '<td class="mono" style="text-align:right;font-weight:700">'+totalBits+'</td><td></td></tr>' +
          '<tr><td style="font-family:var(--font-sans);color:var(--text-muted)">Dynamic stuff bit (phụ thuộc dữ liệu)</td>' +
          '<td class="mono" style="text-align:right;color:var(--text-muted)">0–'+dynMax+'</td>' +
          '<td style="font-family:var(--font-sans);color:var(--text-muted);font-size:13px">'+fastPhase+'</td></tr>' +
          '</tbody></table></div></div>' +

          '<div class="result-box"><div class="rb-label">Thời lượng</div>' +
          '<div style="display:flex;gap:22px;flex-wrap:wrap">' +
          stat("≥ "+totalBits, "bit") + stat("≥ "+totalUs.toFixed(1)+" µs", "1 khung FD") +
          '</div>' +
          '<p style="font-family:var(--font-sans);font-size:13px;color:var(--text-muted);margin-top:10px">Dấu “≥” vì chưa cộng dynamic stuff bit — số bit thật nằm trong khoảng '+totalBits+'–'+(totalBits+dynMax)+'.</p>' +
          '</div>' +

          '<div class="result-box"><div class="rb-label">So với Classical CAN (qua ISO-TP)</div>' +
          '<p style="font-family:var(--font-sans);font-size:14px;color:var(--text-soft);margin-bottom:10px">Để chở '+bytes+' byte, Classical CAN cần <strong>'+classicalFrames+' khung</strong>: '+segNote+'.</p>' +
          '<div style="display:flex;gap:22px;flex-wrap:wrap">' +
          stat(classicalFrames+"×", "khung classical") + stat("~"+classicalUs.toFixed(1)+" µs", "tổng classical") +
          '</div>' +
          (bytes > 7
            ? '<div class="callout tip">'+co("zap")+'<div class="callout-body"><p>CAN FD gói trọn trong <strong>1 khung</strong>'+(brs?' và chạy nhanh phần dữ liệu':'')+' → nhanh hơn khoảng <strong>'+ (classicalUs/totalUs).toFixed(1) +'×</strong>. Con số này còn <em>chưa</em> tính STmin (thời gian nghỉ giữa các Consecutive Frame) mà Flow Control yêu cầu, nên thực tế khoảng cách còn lớn hơn.</p></div></div>'
            : '<div class="callout info">'+co("info")+'<div class="callout-body"><p>Với ≤ 7 byte, cả hai đều gửi trong 1 khung — CAN FD chỉ nhanh hơn nếu bật BRS.</p></div></div>') +
          (bytes > 62
            ? '<div class="callout warn">'+co("alert")+'<div class="callout-body"><p>Lưu ý: ISO-TP Single Frame trên CAN FD chở tối đa <strong>62 byte</strong> (header 2 byte). Payload 64 byte vì thế vẫn phải chia FF + CF ở tầng ISO-TP, dù khung FD chở được 64 byte dữ liệu.</p></div></div>'
            : '') +
          '</div>';
      }
      function r(k,v){return '<tr><td style="width:120px;color:var(--text-muted)">'+k+'</td><td class="mono"><strong>'+APP.esc(v)+'</strong></td></tr>';}
      function stat(v,l){return '<div><div class="hex-out">'+v+'</div><div class="muted" style="font-size:12px">'+l+'</div></div>';}

      $("#fd-id").addEventListener("input", function(){ this.value = this.value.replace(/[^0-9a-fA-F]/g,"").toUpperCase().slice(0,3); });
      $("#fd-build").addEventListener("click", build);
      ["#fd-dlc","#fd-brs","#fd-esi","#fd-nom","#fd-data"].forEach(function(s){ $(s).addEventListener("change", build); });
      build();
    }
  });
})();
