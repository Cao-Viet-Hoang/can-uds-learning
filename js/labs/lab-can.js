/* Lab: CAN Frame Builder — dựng khung Classical CAN, tính CRC-15, bit-stuffing */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("lab-can", {
    title: "CAN Frame Builder",
    icon: "layers",
    keywords: "lab can frame builder bit stuffing crc dlc identifier standard extended thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">CAN Frame Builder</h1>' +
'<p class="page-lead">Nhập Identifier và dữ liệu, hệ thống sẽ dựng toàn bộ khung Classical CAN ở mức bit: tính CRC-15, áp dụng bit-stuffing, và đếm tổng số bit thực tế trên bus.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab"><div class="lab-grid">' +

// ---- Left: inputs ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Cấu hình khung</span></div><div class="lab-panel-body">' +
'<div class="field"><label>Định dạng khung</label>' +
'<select class="select" id="cf-fmt"><option value="std">Standard (11-bit ID)</option><option value="ext">Extended (29-bit ID)</option></select></div>' +

'<div class="field"><label>Identifier <span class="hint">(hex)</span></label>' +
'<input class="input" id="cf-id" value="123" spellcheck="false" /></div>' +

'<div class="switch-row"><label class="switch"><input type="checkbox" id="cf-rtr"><span class="slider"></span></label>' +
'<span class="switch-label">Remote Frame (RTR) <small>Bật = yêu cầu dữ liệu, không có Data field</small></span></div>' +

'<div class="field"><label>DLC <span class="hint">(mã 4 bit)</span></label>' +
'<select class="select" id="cf-dlc">' +
[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(function(n){
  var lbl = n <= 8 ? (n + " → " + n + " byte") : (n + " → vẫn 8 byte (Classical CAN)");
  return '<option value="'+n+'"'+(n===8?' selected':'')+'>DLC '+lbl+'</option>';
}).join('') +
'</select></div>' +

'<div class="field" id="cf-bytes-field"><label>Data bytes <span class="hint">(hex, mỗi ô 1 byte)</span></label>' +
'<div class="byte-grid" id="cf-bytes"></div></div>' +

'<div class="field"><label>Bitrate <span class="hint">(để ước lượng thời gian)</span></label>' +
'<select class="select" id="cf-rate"><option value="1000000">1 Mbit/s</option><option value="500000" selected>500 kbit/s</option><option value="250000">250 kbit/s</option><option value="125000">125 kbit/s</option></select></div>' +

'<div class="btn-row"><button class="btn primary" id="cf-build">' + I("play") + 'Dựng khung</button>' +
'<button class="btn" id="cf-rand">' + I("refresh") + 'Ngẫu nhiên</button></div>' +
'</div></div>' +

// ---- Right: output ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("activity") + '<span>Kết quả</span><span class="lp-sub" id="cf-summary"></span></div><div class="lab-panel-body" id="cf-out">' +
'<p class="muted">Bấm "Dựng khung" để xem kết quả.</p>' +
'</div></div>' +

'</div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>CRC-15 được tính theo đa thức chuẩn của CAN <code>0x4599</code> trên chuỗi bit từ SOF đến hết Data (chưa gồm stuff bit). Các bit được chèn bởi bit-stuffing (viền cam nét đứt) không nằm trong tính CRC nhưng vẫn tính vào tổng số bit trên bus. ACK slot hiển thị ở mức recessive (mức node gửi phát ra trước khi bị node nhận kéo xuống dominant).</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#can-frame">Cấu trúc khung</a> để hiểu ý nghĩa từng trường trước khi thử ở đây.</p></div></div>' +

'</div>'
      );
    },
    init: function (root) {
      var $ = function (id) { return root.querySelector(id); };
      var fmt = $("#cf-fmt"), id = $("#cf-id"), rtr = $("#cf-rtr"), dlc = $("#cf-dlc"),
          bytesWrap = $("#cf-bytes"), rate = $("#cf-rate"),
          out = $("#cf-out"), summary = $("#cf-summary");

      // DLC is a 4-bit code; in Classical CAN codes 9–15 all mean 8 data bytes.
      // The code goes on the wire as-is, the byte count is what it maps to.
      function dlcCode() { return parseInt(dlc.value, 10); }
      function dataLen() { return Math.min(dlcCode(), 8); }

      function buildByteInputs() {
        var n = dataLen();
        var cur = getBytes();
        var html = "";
        for (var i = 0; i < n; i++) {
          var v = cur[i] != null ? cur[i] : (i === 0 ? "DE" : i === 1 ? "AD" : "00");
          html += '<div><input class="byte-box" data-b="'+i+'" maxlength="2" value="'+v+'" spellcheck="false"><div class="byte-index">D'+i+'</div></div>';
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

      // ---- CAN bit assembly ----
      function bits(num, width) {
        var s = (num >>> 0).toString(2);
        while (s.length < width) s = "0" + s;
        return s.slice(-width).split("").map(Number);
      }
      function crc15(arr) {
        // arr: array of bits (0/1), MSB first. Poly 0x4599.
        var crc = 0;
        for (var i = 0; i < arr.length; i++) {
          var doInv = ((crc >> 14) & 1) ^ arr[i];
          crc = (crc << 1) & 0x7fff;
          if (doInv) crc ^= 0x4599;
        }
        return crc;
      }
      function stuff(arr) {
        // returns {bits:[{v,stuffed}], count}
        var res = [], run = 0, last = null, stuffed = 0;
        for (var i = 0; i < arr.length; i++) {
          var b = arr[i];
          if (b === last) run++; else { run = 1; last = b; }
          res.push({ v: b, stuffed: false });
          if (run === 5) { var s = b === 0 ? 1 : 0; res.push({ v: s, stuffed: true }); stuffed++; last = s; run = 1; }
        }
        return { bits: res, stuffed: stuffed };
      }

      function build() {
        var isExt = fmt.value === "ext";
        var idVal = parseInt(id.value.replace(/[^0-9a-fA-F]/g, "") || "0", 16);
        var maxId = isExt ? 0x1fffffff : 0x7ff;
        var idInvalid = idVal > maxId;
        if (idInvalid) idVal = idVal % (maxId + 1);
        var isRemote = rtr.checked;
        var code = dlcCode();
        // A Remote Frame still carries DLC — it tells the responder how many
        // bytes to send back. Only the Data field is absent.
        var nBytes = dataLen();
        var dataBytes = isRemote ? [] : getBytes().slice(0, nBytes).map(function (h) { return parseInt(h || "0", 16); });

        // build the "stuffable" region bits: SOF..end of CRC
        var region = []; // {v, field}
        function push(vArr, field) { vArr.forEach(function (v) { region.push({ v: v, field: field }); }); }

        push([0], "SOF");
        if (!isExt) {
          push(bits(idVal, 11), "ARB");        // 11-bit id
          push([isRemote ? 1 : 0], "ARB");     // RTR
          push([0], "CTRL");                   // IDE=0
          push([0], "CTRL");                   // r0
        } else {
          var baseId = (idVal >> 18) & 0x7ff;
          var extId = idVal & 0x3ffff;
          push(bits(baseId, 11), "ARB");
          push([1], "ARB");                    // SRR (recessive)
          push([1], "CTRL");                   // IDE=1
          push(bits(extId, 18), "ARB");
          push([isRemote ? 1 : 0], "ARB");     // RTR
          push([0], "CTRL");                   // r1
          push([0], "CTRL");                   // r0
        }
        push(bits(code, 4), "DLC");   // the 4-bit code, not the byte count
        dataBytes.forEach(function (byte) { push(bits(byte, 8), "DATA"); });

        // CRC over region so far (values only)
        var regionVals = region.map(function (b) { return b.v; });
        var crc = crc15(regionVals);
        var crcBits = bits(crc, 15);
        push(crcBits, "CRC");

        // Apply stuffing to region (SOF..CRC)
        var regionValsFull = region.map(function (b) { return b.v; });
        var st = stuff(regionValsFull);

        // Non-stuffed trailer: CRC delimiter, ACK slot, ACK delim, EOF(7)
        var trailer = [
          { v: 1, field: "CRCDEL" },
          { v: 1, field: "ACK" },   // recessive as transmitted
          { v: 1, field: "ACKDEL" },
        ];
        for (var e = 0; e < 7; e++) trailer.push({ v: 1, field: "EOF" });

        // total bit count on bus = stuffed region + trailer + 3 IFS
        var totalBits = st.bits.length + trailer.length + 3;
        var timeUs = (totalBits / parseInt(rate.value, 10)) * 1e6;

        render({
          isExt: isExt, idVal: idVal, idInvalid: idInvalid, isRemote: isRemote,
          nBytes: nBytes, dataBytes: dataBytes, crc: crc, crcBits: crcBits,
          regionField: region, stuffedRegion: st, trailer: trailer,
          stuffedCount: st.stuffed, totalBits: totalBits, timeUs: timeUs, maxId: maxId
        });
      }

      function fieldColor(f) {
        return { SOF:"sof", ARB:"arb", CTRL:"ctrl", DLC:"ctrl", DATA:"data", CRC:"crc", CRCDEL:"crc", ACK:"ack", ACKDEL:"ack", EOF:"eof" }[f] || "";
      }

      function render(m) {
        // stitch field labels onto stuffed bits: walk regionField and stuffedRegion together
        var out2 = [];
        var ri = 0;
        m.stuffedRegion.bits.forEach(function (b) {
          if (b.stuffed) { out2.push({ v: b.v, field: "STUFF", stuffed: true }); }
          else { out2.push({ v: b.v, field: m.regionField[ri] ? m.regionField[ri].field : "", stuffed: false }); ri++; }
        });
        m.trailer.forEach(function (t) { out2.push({ v: t.v, field: t.field, stuffed: false }); });

        var streamHtml = out2.map(function (b) {
          var cls = "bit " + (b.v === 0 ? "b0" : "b1") + (b.stuffed ? " stuffed" : "");
          return '<span class="'+cls+'" title="'+(b.stuffed?"stuff bit":b.field)+'">'+b.v+'</span>';
        }).join("");

        var idHex = "0x" + m.idVal.toString(16).toUpperCase().padStart(m.isExt ? 8 : 3, "0");
        var dataHex = m.isRemote ? "(remote — no data)" : (m.dataBytes.length ? m.dataBytes.map(function (b) { return b.toString(16).toUpperCase().padStart(2,"0"); }).join(" ") : "(rỗng)");

        summary.textContent = m.totalBits + " bit · " + m.timeUs.toFixed(1) + " µs";

        var warn = m.idInvalid ? '<div class="callout danger" style="margin-bottom:14px">'+co("alert")+'<div class="callout-body"><p>Identifier vượt giá trị tối đa ('+("0x"+m.maxId.toString(16).toUpperCase())+'). Đã cắt bớt (mask) cho vừa.</p></div></div>' : "";

        out.innerHTML =
          warn +
          '<div class="result-box"><div class="rb-label">Tóm tắt trường</div>' +
          '<table class="data" style="border:none"><tbody>' +
          row("Định dạng", m.isExt ? "Extended (29-bit)" : "Standard (11-bit)") +
          row("Identifier", idHex + (m.isExt?"":"")) +
          row("Loại", m.isRemote ? "Remote Frame" : "Data Frame") +
          row("DLC", m.nBytes + " byte") +
          row("Data", dataHex) +
          row("CRC-15", "0x" + m.crc.toString(16).toUpperCase().padStart(4,"0") + " (" + m.crcBits.join("") + ")") +
          '</tbody></table></div>' +

          '<div class="result-box"><div class="rb-label">Thống kê trên bus</div>' +
          '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
          stat(m.totalBits, "tổng bit") + stat(m.stuffedCount, "stuff bit") + stat(m.timeUs.toFixed(1)+" µs", "thời gian") +
          '</div></div>' +

          '<div class="result-box"><div class="rb-label">Chuỗi bit trên bus (SOF → EOF + IFS)</div>' +
          '<div class="bitstream">' + streamHtml + '</div>' +
          '<div class="bit-legend">' +
            '<span><span class="swatch" style="background:var(--dominant)"></span>dominant (0)</span>' +
            '<span><span class="swatch" style="background:var(--recessive);border:1px solid var(--border-strong)"></span>recessive (1)</span>' +
            '<span><span class="swatch" style="border:2px dashed var(--c-amber)"></span>stuff bit</span>' +
          '</div></div>';
      }
      function row(k, v) { return '<tr><td style="width:120px;color:var(--text-muted)">'+k+'</td><td class="mono"><strong>'+APP.esc(v)+'</strong></td></tr>'; }
      function stat(v, l) { return '<div><div class="hex-out">'+v+'</div><div class="muted" style="font-size:12px">'+l+'</div></div>'; }

      // events
      fmt.addEventListener("change", function () {
        id.value = fmt.value === "ext" ? "18DAF110" : "123";
      });
      dlc.addEventListener("change", buildByteInputs);
      id.addEventListener("input", function () { id.value = id.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase(); });
      rtr.addEventListener("change", function () { dlc.disabled = rtr.checked; });
      $("#cf-build").addEventListener("click", build);
      $("#cf-rand").addEventListener("click", function () {
        // vary by using current time-independent counter through DOM
        var r = function (max) { return Math.floor((performance.now() * (1 + Math.random())) % max); };
        id.value = (fmt.value === "ext" ? r(0x1fffffff) : r(0x7ff)).toString(16).toUpperCase();
        var n = 1 + r(8); dlc.value = n; buildByteInputs();
        bytesWrap.querySelectorAll(".byte-box").forEach(function (b) { b.value = r(256).toString(16).toUpperCase().padStart(2,"0"); });
        build();
      });

      buildByteInputs();
      build();
    }
  });
})();
