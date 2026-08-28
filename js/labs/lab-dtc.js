/* Lab: DTC Decoder — giải mã mã lỗi theo SAE J2012 + status byte theo ISO 14229 */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  var LETTER = ["P","C","B","U"];
  var LETTER_NAME = {
    P: "Powertrain — động cơ, hộp số",
    C: "Chassis — phanh, lái, treo",
    B: "Body — thân xe (túi khí, điều hòa, ghế…)",
    U: "Network — mạng giao tiếp (CAN/LIN…)"
  };
  var GROUP2 = { "0":"chuẩn hóa bởi SAE (ISO/SAE controlled)", "1":"do nhà sản xuất định nghĩa (manufacturer)", "2":"tùy loại", "3":"tùy loại" };
  // status bit meaning (ISO 14229-1, DTC status byte)
  var STATUS_BITS = [
    "testFailed — lần test gần nhất bị lỗi",
    "testFailedThisOperationCycle — lỗi trong chu kỳ hoạt động hiện tại",
    "pendingDTC — lỗi đang chờ xác nhận",
    "confirmedDTC — lỗi đã được xác nhận & lưu",
    "testNotCompletedSinceLastClear — chưa test lại kể từ lần xóa",
    "testFailedSinceLastClear — đã từng lỗi kể từ lần xóa",
    "testNotCompletedThisOperationCycle — chưa test xong trong chu kỳ này",
    "warningIndicatorRequested — yêu cầu bật đèn cảnh báo (MIL)"
  ];

  var EXAMPLES = [
    ["P0301", "0x0301", "Cylinder 1 Misfire Detected"],
    ["P0171", "0x0171", "System Too Lean (Bank 1)"],
    ["C0035", "0x4035", "Left Front Wheel Speed Sensor"],
    ["B1318", "0x9318", "Battery Voltage Low"],
    ["U0100", "0xC100", "Lost Communication With ECM/PCM"]
  ];

  function hx2(n){return (n&0xff).toString(16).toUpperCase().padStart(2,"0");}

  // decode a 16-bit value → "P0301" style
  function decode(v16){
    v16 &= 0xffff;
    var letter = LETTER[(v16>>>14)&0x3];
    var d1 = (v16>>>12)&0x3;
    var d2 = (v16>>>8)&0xf;
    var d3 = (v16>>>4)&0xf;
    var d4 = v16 & 0xf;
    var code = letter + d1.toString(16).toUpperCase() + d2.toString(16).toUpperCase() + d3.toString(16).toUpperCase() + d4.toString(16).toUpperCase();
    return { code:code, letter:letter, d1:d1, d2:d2 };
  }

  APP.register("lab-dtc", {
    title: "DTC Decoder",
    icon: "hash",
    keywords: "lab dtc decoder decode ma loi j2012 sae powertrain chassis body network status byte confirmed pending thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">DTC Decoder</h1>' +
'<p class="page-lead">Giải mã một Diagnostic Trouble Code (DTC) từ dạng hex sang định dạng chữ-số theo chuẩn SAE J2012 (vd <code>0x0301</code> → <strong>P0301</strong>), và giải nghĩa từng bit của status byte theo ISO 14229.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab"><div class="lab-grid">' +

// ---- decode hex → code ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("hash") + '<span>Giải mã DTC</span></div><div class="lab-panel-body">' +
'<div class="field"><label>DTC (hex, 2 byte + tùy chọn 1 byte FTB)</label>' +
'<input class="input" id="dtc-in" value="03 01" spellcheck="false" placeholder="03 01"></div>' +
'<div id="dtc-out"></div>' +
'</div></div>' +

// ---- build code → hex ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Tạo DTC ngược lại</span></div><div class="lab-panel-body">' +
'<div class="field-row">' +
'<div class="field" style="flex:0 0 90px"><label>Nhóm</label><select class="select" id="dtc-letter">' +
LETTER.map(function(l){return '<option value="'+l+'"'+(l==="P"?" selected":"")+'>'+l+'</option>';}).join('') +
'</select></div>' +
'<div class="field"><label>3 ký tự hex còn lại</label><input class="input" id="dtc-rest" value="301" spellcheck="false" placeholder="301"></div>' +
'</div>' +
'<div id="dtc-enc"></div>' +
'</div></div>' +

'</div>' + // end lab-grid

// ---- status byte ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("activity") + '<span>Giải mã Status byte (ISO 14229)</span></div><div class="lab-panel-body">' +
'<div class="field" style="max-width:260px"><label>Status byte (hex)</label><input class="input" id="dtc-status" value="2F" spellcheck="false" placeholder="2F"></div>' +
'<div id="dtc-status-out"></div>' +
'</div></div>' +

// ---- examples ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("book") + '<span>Ví dụ để thử</span></div><div class="lab-panel-body">' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Mã</th><th>Hex</th><th>Ý nghĩa</th><th></th></tr></thead><tbody id="dtc-ex"></tbody></table></div>' +
'</div></div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Cấu trúc 2 byte của DTC: <strong>2 bit đầu</strong> = nhóm (00=P, 01=C, 10=B, 11=U); <strong>2 bit kế</strong> = chữ số 1 (0–3); <strong>3 nibble còn lại</strong> = ba chữ số hex tiếp theo. Byte thứ 3 (nếu có) là <em>Failure Type Byte (FTB)</em> mô tả kiểu lỗi chi tiết theo ISO 14229.</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#uds-services">UDS Services</a> (dịch vụ 0x19 ReadDTCInformation, 0x14 ClearDiagnosticInformation).</p></div></div>' +

'</div>'
      );
    },

    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };

      function bytesOf(str){ return (str.match(/[0-9a-fA-F]{1,2}/g)||[]).map(function(x){return parseInt(x,16)&0xff;}); }

      // ---- decode hex → code ----
      function renderDecode() {
        var b = bytesOf($("#dtc-in").value);
        var out = $("#dtc-out");
        if (b.length < 2) { out.innerHTML = '<div class="callout warn">'+co("alert")+'<div class="callout-body"><p>Cần ít nhất 2 byte (vd <code>03 01</code>).</p></div></div>'; return; }
        var v = (b[0]<<8)|b[1];
        var d = decode(v);
        var ftb = b.length >= 3 ? b[2] : null;
        out.innerHTML =
          '<div class="result-box out"><div class="rb-label">Kết quả</div>' +
          '<div class="hex-out" style="font-size:26px">'+d.code+'</div></div>' +
          '<table class="data"><tbody>' +
          row("Nhóm", d.letter+" — "+LETTER_NAME[d.letter]) +
          row("Chữ số 1", d.d1 + " ("+(GROUP2[String(d.d1)]||"")+")") +
          row("16 bit", "0x"+v.toString(16).toUpperCase().padStart(4,"0")+"  =  "+v.toString(2).padStart(16,"0").replace(/(.{4})/g,"$1 ").trim()) +
          (ftb!==null ? row("FTB (byte 3)", "0x"+hx2(ftb)+" — Failure Type Byte (kiểu lỗi chi tiết)") : "") +
          '</tbody></table>';
      }

      // ---- build code → hex ----
      function renderEncode() {
        var letter = $("#dtc-letter").value;
        var rest = ($("#dtc-rest").value||"").replace(/[^0-9a-fA-F]/g,"").toUpperCase().slice(0,3);
        $("#dtc-rest").value = rest;
        var enc = $("#dtc-enc");
        if (rest.length < 3) { enc.innerHTML = '<div class="callout warn">'+co("alert")+'<div class="callout-body"><p>Nhập đủ 3 ký tự hex (vd <code>301</code>).</p></div></div>'; return; }
        var li = LETTER.indexOf(letter);
        var d1 = parseInt(rest[0],16);
        if (d1 > 3) d1 = 3; // chữ số 1 chỉ 0–3
        var v = (li<<14) | ((d1&0x3)<<12) | (parseInt(rest[1],16)<<8) | (parseInt(rest[2],16)<<4) | 0;
        // note: J2012 mã đầy đủ 4 chữ số; ở đây "301" = d1 d2 d3, d4=0. Cho phép nhập 4 ký tự?
        // Dùng đúng 16-bit: high byte, low byte
        var full = (li<<14)|((d1&0x3)<<12)|(parseInt(rest[1],16)<<8)|(parseInt(rest[2],16)<<4);
        var hi = (full>>>8)&0xff, lo = full & 0xff;
        var back = decode(full);
        enc.innerHTML =
          '<div class="result-box out"><div class="rb-label">Byte gửi trên bus</div>' +
          '<div class="hex-out" style="font-size:22px">'+hx2(hi)+' '+hx2(lo)+'</div>' +
          '<p class="muted" style="margin-top:8px;font-size:13px">Giải mã ngược: <strong>'+back.code+'</strong></p></div>';
      }

      // ---- status byte ----
      function renderStatus() {
        var b = bytesOf($("#dtc-status").value);
        var out = $("#dtc-status-out");
        if (!b.length) { out.innerHTML = ""; return; }
        var s = b[0];
        var rows = STATUS_BITS.map(function (label, i) {
          var on = (s>>>i)&1;
          return '<tr><td style="width:62px"><span class="badge '+(on?"green":"")+'">bit '+i+'</span></td>'+
            '<td class="mono" style="width:44px;font-weight:700">'+on+'</td>'+
            '<td style="font-family:var(--font-sans);color:'+(on?"var(--text)":"var(--text-muted)")+'">'+label+'</td></tr>';
        }).join("");
        out.innerHTML =
          // Label + value, not one uppercased sentence: .rb-label is transformed to
          // uppercase, which turned "0x2F" into "0X2F" and "…b" into "…B".
          '<div class="result-box out"><div class="rb-label">Giá trị</div>' +
          '<div class="hex-out" style="font-size:20px">0x'+hx2(s)+
          ' <span style="color:var(--text-muted);font-weight:400">= '+s.toString(2).padStart(8,"0")+'b</span></div></div>' +
          '<table class="data"><tbody>'+rows+'</tbody></table>';
      }

      // ---- examples ----
      $("#dtc-ex").innerHTML = EXAMPLES.map(function (e) {
        return '<tr><td class="mono"><strong>'+e[0]+'</strong></td><td class="mono">'+e[1]+'</td><td style="font-family:var(--font-sans)">'+e[2]+'</td>'+
          '<td><button class="btn sm" data-hex="'+e[1].replace("0x","").replace(/(..)(..)/,"$1 $2")+'">'+I("play")+'Thử</button></td></tr>';
      }).join("");
      $("#dtc-ex").querySelectorAll("[data-hex]").forEach(function (btn) {
        btn.addEventListener("click", function () { $("#dtc-in").value = btn.getAttribute("data-hex"); renderDecode(); });
      });

      function row(k,v){ return '<tr><td style="width:110px;color:var(--text-muted)">'+k+'</td><td class="mono">'+APP.esc(v)+'</td></tr>'; }

      // wire
      $("#dtc-in").addEventListener("input", renderDecode);
      $("#dtc-letter").addEventListener("change", renderEncode);
      $("#dtc-rest").addEventListener("input", renderEncode);
      $("#dtc-status").addEventListener("input", renderStatus);

      renderDecode(); renderEncode(); renderStatus();
    }
  });
})();
