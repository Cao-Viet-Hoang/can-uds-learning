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
'<div class="callout-body"><p>Ước lượng số bit chỉ mang tính minh họa: phần header (arbitration + control) và trailer (CRC/ACK/EOF) được tính ở nominal bitrate, còn phần dữ liệu (nếu bật BRS) tính ở data bitrate. Thực tế còn có stuff bit và fixed stuff bit trong CAN FD nên con số thật sẽ dao động.</p></div></div>' +

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

        // rough bit budget (standard FD frame)
        var headerBits = 1 /*SOF*/ + 11 /*ID*/ + 1 /*RRS*/ + 1 /*IDE*/ + 1 /*FDF*/ + 1 /*BRS*/ + 1 /*ESI*/ + 4 /*DLC*/;
        var dataBits = bytes * 8;
        var crcBits = crcLen + 1 /*delim*/ + (bytes > 16 ? 6 : 5) /*stuff count area approx*/;
        var trailerBits = 2 /*ACK*/ + 7 /*EOF*/ + 3 /*IFS*/;

        // time: header at nominal; data+crc at data rate if BRS else nominal
        var fastRate = brs ? data : nom;
        var tHeader = headerBits / nom;
        var tData = (dataBits + crcBits) / fastRate;
        var tTrailer = trailerBits / nom;
        var totalUs = (tHeader + tData + tTrailer) * 1e6;
        var totalBits = headerBits + dataBits + crcBits + trailerBits;

        // classical CAN comparison: how many 8-byte classical frames needed
        var classicalFrames = Math.max(1, Math.ceil(bytes / 8));
        // approx classical frame time (8 byte) at nominal: ~ (44 overhead + 64 data) bits
        var classicalBitsPer = 44 + 64;
        var classicalUs = classicalFrames * (classicalBitsPer / nom) * 1e6;

        var idVal = (parseInt($("#fd-id").value || "0", 16) & 0x7ff).toString(16).toUpperCase().padStart(3,"0");

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

          '<div class="result-box"><div class="rb-label">Ước lượng thời lượng</div>' +
          '<div style="display:flex;gap:22px;flex-wrap:wrap">' +
          stat("~"+totalBits, "bit") + stat("~"+totalUs.toFixed(1)+" µs", "1 khung FD") +
          '</div></div>' +

          '<div class="result-box"><div class="rb-label">So với Classical CAN</div>' +
          '<p style="font-family:var(--font-sans);font-size:14px;color:var(--text-soft);margin-bottom:10px">Để chở '+bytes+' byte, Classical CAN (8 byte/khung) cần <strong>'+classicalFrames+' khung</strong>.</p>' +
          '<div style="display:flex;gap:22px;flex-wrap:wrap">' +
          stat(classicalFrames+"×", "khung classical") + stat("~"+classicalUs.toFixed(1)+" µs", "tổng classical") +
          '</div>' +
          (bytes > 8 ? '<div class="callout tip">'+co("zap")+'<div class="callout-body"><p>CAN FD gói trọn trong <strong>1 khung</strong> và'+(brs?' chạy nhanh phần dữ liệu →':'') +' hiệu quả hơn '+ (classicalUs/totalUs).toFixed(1) +'× về thời gian trong ví dụ này.</p></div></div>' : '') +
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
