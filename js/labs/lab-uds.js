/* Lab: UDS Simulator — ECU ảo trả lời request UDS đúng theo session & security */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  // ---------- helper: hex ----------
  function hx(b){return (b&0xff).toString(16).toUpperCase().padStart(2,"0");}
  function toHex(arr){return arr.map(hx).join(" ");}
  // Tokenise on non-hex runs and read each token in byte pairs, left-padding an
  // odd-length one. The old /[0-9a-fA-F]{1,2}/g chopped "22F19" into 22 F1 9
  // (→ 0x09), silently changing the request.
  function parseHex(s){
    var toks = String(s||"").replace(/0x/gi," ").match(/[0-9a-fA-F]+/g) || [];
    var out = [];
    toks.forEach(function (t) {
      if (t.length % 2) t = "0" + t;
      for (var i = 0; i < t.length; i += 2) out.push(parseInt(t.substr(i,2),16) & 0xff);
    });
    return out;
  }
  function ascii(s){return s.split("").map(function(c){return c.charCodeAt(0);});}
  function fromAscii(arr){return arr.map(function(b){return (b>=32&&b<127)?String.fromCharCode(b):".";}).join("");}
  // Only call a value "text" if every byte is printable — otherwise a binary
  // config value like 00 00 rendered as ".." and looked like corrupt data.
  function isText(arr){
    if (!arr.length) return false;
    for (var i=0;i<arr.length;i++) if (arr[i]<32||arr[i]>126) return false;
    return true;
  }
  function valStr(arr){ return isText(arr) ? '"'+fromAscii(arr)+'"' : toHex(arr)+" (nhị phân)"; }
  function hex4(v){ return hx((v>>8)&0xff)+hx(v&0xff); }

  // ---------- ISO-TP (ISO 15765-2) framing, for display ----------
  var TX_ID = 0x7E0, RX_ID = 0x7E8, PAD = 0xAA;
  var FRAME_NOTE = {
    SF: "Single Frame — PDU vừa 1 khung",
    FF: "First Frame — byte đầu chứa tổng độ dài",
    CF: "Consecutive Frame — SN đếm vòng 1..F",
    FC: "Flow Control — ClearToSend, BS=0, STmin=0"
  };
  function padTo8(b){ while (b.length < 8) b.push(PAD); return b; }
  function isotp(payload){
    var out = [], n = payload.length;
    if (n <= 7) { out.push({ t:"SF", b: padTo8([n].concat(payload)) }); return out; }
    out.push({ t:"FF", b: [0x10 | ((n>>8)&0x0f), n & 0xff].concat(payload.slice(0,6)) });
    var idx = 6, sn = 1;
    while (idx < n) {
      out.push({ t:"CF", b: padTo8([0x20 | (sn & 0x0f)].concat(payload.slice(idx, idx+7))) });
      idx += 7; sn = (sn + 1) & 0x0f;
    }
    return out;
  }

  // ---------- public demo seed→key algorithm (for learning only) ----------
  function computeKey(seed){
    var k=(seed ^ 0xA5A5A5A5)>>>0;
    k=(k + 0x5A5A5A5A)>>>0;
    k=((k<<3)|(k>>>29))>>>0;         // rotate left 3
    return k>>>0;
  }

  APP.register("lab-uds", {
    title: "UDS Simulator",
    icon: "message",
    keywords: "lab uds simulator ecu ao request response nrc security seed key session did dtc routine tester present thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">UDS Simulator</h1>' +
'<p class="page-lead">Gửi request UDS tới một ECU ảo và nhận response thật (positive hoặc negative với NRC) tùy theo diagnostic session và trạng thái Security Access hiện tại. Đây là cách tốt nhất để "thấm" phần lý thuyết UDS.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab">' +

// status strip
'<div class="status-strip" id="uds-status"></div>' +

'<div class="lab-grid">' +

// ---- left: request builder ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Xây dựng request</span></div><div class="lab-panel-body">' +
'<div class="field"><label>Dịch vụ (Service)</label><select class="select" id="uds-svc">' +
'<option value="10">0x10 · DiagnosticSessionControl</option>' +
'<option value="11">0x11 · ECUReset</option>' +
'<option value="27">0x27 · SecurityAccess</option>' +
'<option value="22" selected>0x22 · ReadDataByIdentifier</option>' +
'<option value="2E">0x2E · WriteDataByIdentifier</option>' +
'<option value="19">0x19 · ReadDTCInformation</option>' +
'<option value="14">0x14 · ClearDiagnosticInformation</option>' +
'<option value="31">0x31 · RoutineControl</option>' +
'<option value="3E">0x3E · TesterPresent</option>' +
'</select></div>' +
'<div id="uds-params"></div>' +
'<div class="result-box out" style="margin:14px 0 16px"><div class="rb-label">Request sắp gửi</div><div class="hex-out" id="uds-preview">22 F1 90</div></div>' +
'<div class="btn-row"><button class="btn primary" id="uds-send">' + I("send") + 'Gửi request</button></div>' +

'<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">' +
'<div class="field"><label>Hoặc nhập raw hex <span class="hint">(vd: 22 F1 90)</span></label>' +
'<div class="field-row"><input class="input" id="uds-raw" placeholder="22 F1 90" spellcheck="false" style="flex:1">' +
'<button class="btn" id="uds-sendraw" style="flex:0 0 auto">' + I("send") + 'Gửi</button></div></div>' +
'</div></div>' +

// ---- right: console ----
'<div class="lab-panel"><div class="lab-panel-head">' + I("activity") + '<span>Bus log</span>' +
'<label class="switch-inline" style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:var(--fs-xs);color:var(--text-muted);cursor:pointer">' +
'<input type="checkbox" id="uds-frames" checked>ISO-TP</label>' +
'<button class="btn sm ghost" id="uds-clear">'+I("x")+'Xóa log</button>' +
'<button class="btn sm ghost" id="uds-reset">'+I("refresh")+'Dựng lại ECU</button></div>' +
'<div class="lab-panel-body"><div class="console" id="uds-log"></div></div></div>' +

'</div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p><span class="log-dir" style="color:var(--c-blue)">TX</span> = request từ Tester (CAN ID 0x7E0), <span class="log-dir" style="color:var(--c-green)">RX</span> = response từ ECU (0x7E8), <span class="log-dir" style="color:var(--c-red)">ERR</span> = negative response, <span class="log-dir" style="color:var(--c-amber)">PND</span> = NRC 0x78 responsePending. Khối thụt vào dưới mỗi dòng là <strong>lớp ISO-TP</strong> — các khung CAN 8 byte thật sự chạy trên bus (tắt bằng ô “ISO-TP”).</p></div></div>' +

'<div class="callout warn">' + co("key") +
'<div class="callout-body"><div class="callout-title">Gợi ý luyện tập</div>' +
'<p><strong>1.</strong> Đọc VIN ngay (<code>22 F1 90</code>) — để ý ISO-TP phải chia FF + FC + CF vì 20 byte không vừa 1 khung.<br>' +
'<strong>2.</strong> Thử ghi (<code>2E F1 A0 AA BB</code>) khi đang Default → NRC 0x7F. Vào Extended (<code>10 03</code>) rồi thử lại → NRC 0x33.<br>' +
'<strong>3.</strong> Làm Security Access: <code>27 01</code> → <code>27 02 &lt;key&gt;</code>. Cố tình sai key 3 lần để thấy NRC 0x35 → 0x36 → 0x37.<br>' +
'<strong>4.</strong> Sau khi mở khóa, chạy <code>31 01 02 03</code> để thấy NRC 0x78 responsePending trước khi có kết quả thật.<br>' +
'<strong>5.</strong> Ngồi im 5 giây → S3 timeout tự đá bạn về Default. Gửi <code>3E 80</code> để giữ phiên.<br>' +
'<strong>6.</strong> Xóa DTC theo nhóm: <code>14 40 00 00</code> chỉ xóa nhóm Chassis (C), <code>14 FF FF FF</code> xóa tất cả.<br>' +
'<strong>7.</strong> Xóa DTC rồi gửi <code>11 01</code> (ECUReset) — DTC <em>không</em> quay lại, vì bộ nhớ lỗi là non-volatile.</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p><a href="#uds-format">Định dạng message</a> · <a href="#uds-services">Services &amp; Sessions</a> · <a href="#uds-security">Security Access</a></p></div></div>' +

'</div>'
      );
    },

    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };

      // ---------------- timing constants ----------------
      var S3_MS      = 5000;   // ISO 14229 S3server — session times out without activity
      var DELAY_MS   = 10000;  // security lockout after too many bad keys
      var PENDING_MS = 700;    // how long the demo routine "works" behind a 0x78
      var MAX_ATTEMPTS = 3;

      // ---------------- ECU model ----------------
      var ECU;
      function freshECU() {
        return {
          session: 0x01,               // default
          unlocked: false,
          seed: null,                  // current issued seed (32-bit)
          attempts: 0,
          delayUntil: 0,               // security lockout deadline (ms epoch)
          dids: {
            0xF190: ascii("WVWZZZ1JZXW000017"),  // VIN
            0xF187: ascii("1K0907115C"),          // spare part no
            0xF189: ascii("0040"),                // sw version
            0xF18C: ascii("SN-2024-0001"),        // serial
            0xF1A0: [0x00, 0x00]                  // writable config
          },
          dtcs: [
            { b: [0x03,0x01,0x00], status: 0x2F, label: "P0301 · Cylinder 1 Misfire Detected" },
            { b: [0x01,0x71,0x00], status: 0x08, label: "P0171 · System Too Lean (Bank 1)" },
            // 0xC1 would decode to U0123 (11b = Network), not C0123. Chassis is
            // 01b, so the high byte is 0x41.
            { b: [0x41,0x23,0x00], status: 0x2F, label: "C0123 · Chassis-specific fault" }
          ]
        };
      }
      // ECUReset clears volatile state only. Rebuilding the whole ECU made
      // cleared DTCs and written DIDs reappear, which taught the opposite of
      // what non-volatile fault memory actually does.
      function resetVolatile() {
        ECU.session = 0x01;
        ECU.unlocked = false;
        ECU.seed = null;
        ECU.attempts = 0;
        ECU.delayUntil = 0;
      }

      var SESSION_NAME = { 0x01:"Default", 0x02:"Programming", 0x03:"Extended", 0x04:"Safety" };
      var NRC_NAME = {
        0x10:"generalReject",0x11:"serviceNotSupported",0x12:"subFunctionNotSupported",
        0x13:"incorrectMessageLengthOrInvalidFormat",0x22:"conditionsNotCorrect",0x24:"requestSequenceError",
        0x31:"requestOutOfRange",0x33:"securityAccessDenied",0x35:"invalidKey",0x36:"exceedNumberOfAttempts",
        0x37:"requiredTimeDelayNotExpired",0x78:"responsePending",0x7E:"subFunctionNotSupportedInActiveSession",
        0x7F:"serviceNotSupportedInActiveSession"
      };
      var DID_NAME = { 0xF190:"VIN",0xF186:"ActiveSession",0xF187:"SparePartNo",0xF189:"SW Version",0xF18C:"Serial No",0xF1A0:"Config (ghi được)" };

      // services allowed only in extended/programming
      function needsExtended(sid){ return sid===0x2E || sid===0x27 || sid===0x31; }
      // DTC group codes recognised by 0x14 (ISO 14229 / ISO 15031-6)
      var DTC_GROUPS = {
        0xFFFFFF: "tất cả DTC",
        0x000000: "Powertrain (P)",
        0x400000: "Chassis (C)",
        0x800000: "Body (B)",
        0xC00000: "Network (U)"
      };

      // ---------------- request handler ----------------
      function handle(req) {
        if (!req.length) return neg(0x00, 0x13, "Request rỗng — không có SID.");
        var sid = req[0];

        // session gate
        if (needsExtended(sid) && ECU.session === 0x01) {
          return neg(sid, 0x7F, "Dịch vụ này chỉ chạy trong Extended/Programming session. Gửi 10 03 trước.");
        }

        switch (sid) {
          case 0x10: return svcSession(req);
          case 0x11: return svcReset(req);
          case 0x3E: return svcTesterPresent(req);
          case 0x22: return svcReadDID(req);
          case 0x2E: return svcWriteDID(req);
          case 0x27: return svcSecurity(req);
          case 0x19: return svcReadDTC(req);
          case 0x14: return svcClearDTC(req);
          case 0x31: return svcRoutine(req);
          default: return neg(sid, 0x11, "ECU ảo này không cài đặt SID 0x"+hx(sid)+".");
        }
      }
      function neg(sid, nrc, why){ return { neg:true, resp:[0x7F, sid, nrc], nrc:nrc, why:why||"" }; }

      function subInfo(sub){ return { suppress: (sub & 0x80) !== 0, val: sub & 0x7f }; }

      function svcSession(req){
        if (req.length !== 2) return neg(0x10, 0x13, "0x10 cần đúng 2 byte: SID + sub-function.");
        var s = subInfo(req[1]);
        if (!SESSION_NAME[s.val]) return neg(0x10, 0x12, "Sub-function 0x"+hx(s.val)+" không phải session hợp lệ.");
        // Programming session is not reachable straight from Default — a real
        // ECU wants you already in Extended and unlocked before it will let you
        // into the flashing session.
        if (s.val === 0x02 && !(ECU.session === 0x03 && ECU.unlocked)) {
          return neg(0x10, 0x22, "Vào Programming session cần đang ở Extended VÀ đã mở khóa Security. Trình tự: 10 03 → 27 01 → 27 02 → 10 02.");
        }
        var prev = ECU.session;
        ECU.session = s.val;
        // Any session transition drops Security Access (ISO 14229-1 §9.4.1).
        var relocked = ECU.unlocked && s.val !== prev;
        ECU.unlocked = false; ECU.seed = null;
        var note = "Chuyển sang " + SESSION_NAME[s.val] + " session"
                 + (relocked ? " · Security bị khóa lại (mọi lần đổi session đều relock)" : "");
        if (s.suppress) return { neg:false, resp:null, note:note+" (suppress positive response)" };
        // 50 <sub> P2(2) P2*(2) — encoded in ms and 10 ms units respectively
        return { neg:false, resp:[0x50, s.val, 0x00,0x32, 0x01,0xF4], note:note+". Kèm P2=50 ms, P2*=5000 ms" };
      }
      function svcReset(req){
        if (req.length !== 2) return neg(0x11, 0x13, "0x11 cần đúng 2 byte: SID + sub-function.");
        var s = subInfo(req[1]);
        var kinds={1:"hardReset",2:"keyOffOnReset",3:"softReset"};
        if (!kinds[s.val]) return neg(0x11, 0x12, "Sub-function 0x"+hx(s.val)+" không được hỗ trợ.");
        resetVolatile();
        var note = "ECU reset ("+kinds[s.val]+") → về Default session, Security khóa lại. "
                 + "DTC và DID đã ghi KHÔNG mất — chúng nằm trong bộ nhớ không bay hơi ("+ECU.dtcs.length+" DTC còn lại).";
        if (s.suppress) return { neg:false, resp:null, note:note+" (suppressed)" };
        return { neg:false, resp:[0x51, s.val], note:note };
      }
      function svcTesterPresent(req){
        if (req.length !== 2) return neg(0x3E, 0x13, "0x3E cần đúng 2 byte.");
        var s = subInfo(req[1]);
        if (s.val !== 0x00) return neg(0x3E, 0x12, "0x3E chỉ có sub-function 0x00 (zeroSubFunction).");
        var left = (S3_MS/1000).toFixed(0);
        if (s.suppress) return { neg:false, resp:null, note:"Nạp lại S3 timer ("+left+" s) — suppress positive response, đây là cách dùng phổ biến nhất" };
        return { neg:false, resp:[0x7E, 0x00], note:"Nạp lại S3 timer ("+left+" s)" };
      }
      function svcReadDID(req){
        // 0x22 accepts a list of DIDs, so the length must be SID + n×2.
        if (req.length < 3 || (req.length - 1) % 2 !== 0) {
          return neg(0x22, 0x13, "0x22 cần SID + danh sách DID, mỗi DID 2 byte. Request có "+(req.length-1)+" byte sau SID — không chia hết cho 2.");
        }
        var resp = [0x62], notes = [], found = 0;
        for (var i = 1; i < req.length; i += 2) {
          var did = (req[i]<<8)|req[i+1];
          var data = did === 0xF186 ? [ECU.session] : ECU.dids[did];
          if (!data) { notes.push("DID "+hex4(did)+" · không hỗ trợ → bỏ qua"); continue; }
          found++;
          resp = resp.concat([(did>>8)&0xff, did&0xff], data);
          notes.push("DID "+hex4(did)+" ("+(DID_NAME[did]||"?")+") = "+valStr(data));
        }
        // Only reject outright when nothing at all could be read.
        if (!found) return neg(0x22, 0x31, "Không DID nào trong request được ECU hỗ trợ.");
        return { neg:false, resp:resp, note: notes.join("\n") };
      }
      function svcWriteDID(req){
        // ISO 14229-1 order: length → security → range → data length.
        if (req.length < 4) return neg(0x2E, 0x13, "0x2E cần SID + 2 byte DID + ít nhất 1 byte dữ liệu.");
        if (!ECU.unlocked) return neg(0x2E, 0x33, "Ghi dữ liệu cần Security Access. Làm 27 01 (seed) rồi 27 02 (key) trước.");
        var did = (req[1]<<8)|req[2];
        if (did !== 0xF1A0) return neg(0x2E, 0x31, "DID "+hex4(did)+" chỉ đọc. Trong ECU ảo này chỉ F1A0 ghi được.");
        var data = req.slice(3);
        if (data.length !== 2) return neg(0x2E, 0x13, "DID F1A0 dài đúng 2 byte, request mang "+data.length+" byte.");
        ECU.dids[0xF1A0] = data;
        return { neg:false, resp:[0x6E, req[1], req[2]], note:"Đã ghi DID F1A0 = "+toHex(data)+" (giữ nguyên qua ECUReset)" };
      }
      function svcSecurity(req){
        if (req.length < 2) return neg(0x27, 0x13, "0x27 cần ít nhất SID + sub-function.");
        // A lockout from too many bad keys must actually block further tries,
        // otherwise NRC 0x36 is just a label with no consequence.
        var left = ECU.delayUntil - Date.now();
        if (left > 0) {
          return neg(0x27, 0x37, "Đang bị khóa do sai key quá "+MAX_ATTEMPTS+" lần. Còn "+(left/1000).toFixed(1)+" s nữa mới thử lại được.");
        }
        if (ECU.delayUntil) { ECU.delayUntil = 0; ECU.attempts = 0; }  // lockout expired
        var s = subInfo(req[1]);
        var lvl = s.val;
        if (lvl === 0x01) { // request seed
          if (req.length !== 2) return neg(0x27, 0x13, "27 01 (requestSeed) chỉ có 2 byte.");
          if (ECU.unlocked) return { neg:false, resp:[0x67, 0x01, 0,0,0,0], note:"Đã mở khóa sẵn → ECU trả seed = 0 (quy ước báo 'không cần làm gì nữa')" };
          var seed = (Math.floor(Math.random()*0xffffffff))>>>0;
          ECU.seed = seed;
          var sb=[(seed>>>24)&0xff,(seed>>>16)&0xff,(seed>>>8)&0xff,seed&0xff];
          return { neg:false, resp:[0x67,0x01].concat(sb), note:"Seed = 0x"+seed.toString(16).toUpperCase().padStart(8,"0")+" · key đúng = 0x"+computeKey(seed).toString(16).toUpperCase().padStart(8,"0")+" (ECU thật không bao giờ tiết lộ key)" };
        } else if (lvl === 0x02) { // send key
          if (ECU.seed === null) return neg(0x27, 0x24, "Chưa xin seed (hoặc seed đã bị hủy). Phải gửi 27 01 ngay trước 27 02.");
          if (req.length !== 6) return neg(0x27, 0x13, "27 02 cần đúng 6 byte: SID + sub + 4 byte key.");
          var key = ((req[2]<<24)|(req[3]<<16)|(req[4]<<8)|req[5])>>>0;
          var expected = computeKey(ECU.seed);
          if (key === expected) {
            ECU.unlocked = true; ECU.seed = null; ECU.attempts = 0;
            return { neg:false, resp:[0x67, 0x02], note:"Key đúng → ĐÃ MỞ KHÓA (security unlocked)" };
          }
          ECU.attempts++;
          ECU.seed = null;  // a seed is single-use: a failed key invalidates it
          if (ECU.attempts >= MAX_ATTEMPTS) {
            ECU.delayUntil = Date.now() + DELAY_MS;
            return neg(0x27, 0x36, "Sai key lần thứ "+ECU.attempts+". ECU khóa Security Access trong "+(DELAY_MS/1000)+" s — thử tiếp sẽ nhận NRC 0x37.");
          }
          return neg(0x27, 0x35, "Key sai (lần "+ECU.attempts+"/"+MAX_ATTEMPTS+"). Seed cũ đã bị hủy — phải xin seed mới bằng 27 01.");
        }
        return neg(0x27, 0x12, "ECU ảo chỉ hỗ trợ level 01/02. Level lẻ = requestSeed, level chẵn = sendKey.");
      }
      function svcReadDTC(req){
        if (req.length < 2) return neg(0x19, 0x13, "0x19 cần ít nhất SID + sub-function.");
        // 0x19 has no suppressPosRspMsgIndicationBit — bit 7 is part of the
        // sub-function value here, so it is read raw on purpose.
        var sub = req[1];
        if (sub === 0x01) { // number of DTC by status mask
          if (req.length !== 3) return neg(0x19, 0x13, "19 01 cần đúng 3 byte: SID + sub + status mask.");
          var mask = req[2];
          var count = ECU.dtcs.filter(function(d){return d.status & mask;}).length;
          return { neg:false, resp:[0x59,0x01,0xFF,0x01,(count>>8)&0xff,count&0xff], note:"Số DTC khớp mask 0x"+hx(mask)+" = "+count };
        } else if (sub === 0x02) { // report DTC by status mask
          if (req.length !== 3) return neg(0x19, 0x13, "19 02 cần đúng 3 byte: SID + sub + status mask.");
          var mask2 = req[2];
          var list = ECU.dtcs.filter(function(d){return d.status & mask2;});
          var body=[0x59,0x02,0xFF];
          var lines=[];
          list.forEach(function(d){ body=body.concat(d.b,[d.status]); lines.push(toHex(d.b)+" ("+d.label+") status="+hx(d.status)); });
          return { neg:false, resp:body, note: list.length? "DTC khớp:\n   "+lines.join("\n   ") : "Không có DTC nào khớp mask 0x"+hx(mask2) };
        } else if (sub === 0x0A) { // supported DTC
          if (req.length !== 2) return neg(0x19, 0x13, "19 0A chỉ có 2 byte (không nhận status mask).");
          var body2=[0x59,0x0A,0xFF];
          ECU.dtcs.forEach(function(d){ body2=body2.concat(d.b,[d.status]); });
          return { neg:false, resp:body2, note:"Liệt kê tất cả "+ECU.dtcs.length+" DTC được hỗ trợ" };
        }
        return neg(0x19, 0x12, "ECU ảo chỉ cài sub-function 01, 02 và 0A.");
      }
      function svcClearDTC(req){
        if (req.length !== 4) return neg(0x14, 0x13, "0x14 cần đúng 4 byte: SID + 3 byte groupOfDTC.");
        var grp = ((req[1]<<16)|(req[2]<<8)|req[3])>>>0;
        if (!DTC_GROUPS.hasOwnProperty(grp)) {
          return neg(0x14, 0x31, "Group 0x"+hx(req[1])+hx(req[2])+hx(req[3])+" không hợp lệ. Dùng FFFFFF (tất cả), 000000 (P), 400000 (C), 800000 (B) hoặc C00000 (U).");
        }
        var before = ECU.dtcs.length, kept;
        if (grp === 0xFFFFFF) kept = [];
        else {
          var g = (grp >>> 22) & 0x3;                 // top 2 bits = P/C/B/U
          kept = ECU.dtcs.filter(function (d) { return ((d.b[0] >>> 6) & 0x3) !== g; });
        }
        ECU.dtcs = kept;
        var removed = before - kept.length;
        return { neg:false, resp:[0x54], note:"Group "+DTC_GROUPS[grp]+" → xóa "+removed+" DTC, còn lại "+kept.length+"." };
      }
      function svcRoutine(req){
        if (req.length < 4) return neg(0x31, 0x13, "0x31 cần SID + sub-function + 2 byte Routine ID.");
        var s = subInfo(req[1]);
        if (s.val<1||s.val>3) return neg(0x31, 0x12, "Sub-function chỉ 01 (start), 02 (stop), 03 (requestResults).");
        var rid = (req[2]<<8)|req[3];
        // routine 0x0203 (erase memory) requires security
        if (rid === 0x0203 && !ECU.unlocked) return neg(0x31, 0x33, "Routine 0203 (eraseMemory) cần Security Access.");
        var subName={1:"start",2:"stop",3:"requestResults"}[s.val];
        var result = s.val===3 ? [0x00] : [];  // routineStatusRecord
        var resp = [0x71, s.val, req[2], req[3]].concat(result);
        var note = "Routine 0x"+hx(req[2])+hx(req[3])+" · "+subName+(s.val===3?" → status 00 (completed)":" OK");
        if (s.suppress) return { neg:false, resp:null, note:note+" (suppress positive response — ECU im lặng, không có cả 0x78)" };
        // Erasing memory takes real time, so the ECU buys itself more by
        // answering 0x78 first and sending the real response afterwards.
        if (rid === 0x0203 && s.val === 1) {
          return { neg:false, resp:resp, note:note+" (sau khi xóa xong)", pending:true };
        }
        return { neg:false, resp:resp, note:note };
      }

      // ---------------- logging ----------------
      var logEl = $("#uds-log");
      var CLS = { TX:"tx", RX:"rx", ERR:"err", PND:"pnd" };
      function log(dir, hex, note, extraHtml) {
        var noteHtml = note ? '<div class="log-note">↳ '+APP.esc(note).replace(/\n/g,"<br>")+'</div>' : "";
        var msg = (hex ? '<span class="log-hex">'+APP.esc(hex)+'</span>' : "") + noteHtml + (extraHtml||"");
        var line = document.createElement("div");
        line.className = "log-line " + (CLS[dir] || "sys");
        line.innerHTML = '<span class="log-dir">'+dir+'</span><span class="log-msg">'+msg+'</span>';
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
      }

      // A UDS PDU does not travel on the bus as-is — ISO-TP segments it into
      // 8-byte CAN frames. Showing that layer under each line is the whole
      // point of the exercise, so it is rendered but collapsible.
      function framesHtml(payload, isReq) {
        var id   = isReq ? TX_ID : RX_ID;
        var fcId = isReq ? RX_ID : TX_ID;
        var rows = [];
        isotp(payload).forEach(function (f) {
          rows.push({ id:id, t:f.t, b:f.b });
          // The receiver answers a First Frame with Flow Control before any CF.
          if (f.t === "FF") rows.push({ id:fcId, t:"FC", b: padTo8([0x30,0x00,0x00]) });
        });
        return '<div class="log-frames">' + rows.map(function (r) {
          return '<div class="lf-row"><span class="lf-id">'+hex4(r.id)+'</span>' +
                 '<span class="lf-t">'+r.t+'</span>' +
                 '<span class="lf-b">'+toHex(r.b)+'</span>' +
                 '<span class="lf-n">'+FRAME_NOTE[r.t]+'</span></div>';
        }).join("") + '</div>';
      }
      function logPdu(dir, bytes, note) {
        log(dir, toHex(bytes), note, framesHtml(bytes, dir === "TX"));
      }
      function negNote(r) {
        return "Negative Response · SID 0x"+hx(r.resp[1])+" bị từ chối · NRC 0x"+hx(r.nrc)+" = "+(NRC_NAME[r.nrc]||"?")
             + (r.why ? "\n" + r.why : "");
      }

      // ---------------- send ----------------
      var pendTimer = null, busy = false;
      function setBusy(b) {
        busy = b;
        $("#uds-send").disabled = b;
        $("#uds-sendraw").disabled = b;
      }
      function send(req) {
        if (busy) { log("SYS", "", "ECU đang bận (vừa trả 0x78 responsePending) — chờ response cuối cùng."); return; }
        if (!req.length) { log("SYS", "", "Request rỗng, bỏ qua."); return; }
        logPdu("TX", req, describeReq(req));
        var r = handle(req);
        // Reload S3 *after* handling: a 10 03 only starts the timer because the
        // session it switches into is non-default, and that is not known yet
        // when the request arrives.
        kickS3();

        if (r.pending) {
          logPdu("PND", [0x7F, req[0], 0x78],
            "NRC 0x78 responsePending — ECU báo \"đang xử lý, đừng timeout\". Tester chuyển từ P2 (50 ms) sang P2* (5000 ms) và chờ tiếp.");
          setBusy(true);
          pendTimer = setTimeout(function () {
            pendTimer = null; setBusy(false);
            logPdu("RX", r.resp, r.note);
            kickS3(); renderStatus();
          }, PENDING_MS);
          renderStatus();
          return;
        }
        if (r.resp === null)    log("SYS", "", r.note || "(ECU không gửi response — suppressed)");
        else if (r.neg)         logPdu("ERR", r.resp, negNote(r));
        else                    logPdu("RX", r.resp, r.note);
        renderStatus();
      }

      // ---------------- S3 session timer ----------------
      // Without this, TesterPresent has no observable effect and the session
      // looks like it lasts forever — the opposite of how a real ECU behaves.
      var s3Deadline = 0;
      function kickS3(){ s3Deadline = ECU.session === 0x01 ? 0 : Date.now() + S3_MS; }
      function onS3Expire() {
        s3Deadline = 0;
        resetVolatile();
        log("SYS", "", "S3 timeout: "+(S3_MS/1000)+" s không có request nào → ECU tự về Default session và khóa lại Security. Đây chính là lý do tester phải gửi 3E 80 định kỳ.");
        renderStatus();
      }
      var ticker = setInterval(function () {
        var chip = $("#uds-s3");
        if (!s3Deadline) { if (chip) chip.textContent = "—"; return; }
        var left = s3Deadline - Date.now();
        if (left <= 0) { onS3Expire(); return; }
        if (chip) chip.textContent = (left/1000).toFixed(1) + " s";
      }, 250);

      function describeReq(req){
        var sid=req[0];
        var names={0x10:"DiagnosticSessionControl",0x11:"ECUReset",0x27:"SecurityAccess",0x22:"ReadDataByIdentifier",0x2E:"WriteDataByIdentifier",0x19:"ReadDTCInformation",0x14:"ClearDiagnosticInformation",0x31:"RoutineControl",0x3E:"TesterPresent"};
        return "SID 0x"+hx(sid)+" · "+(names[sid]||"Unknown service");
      }

      // ---------------- status strip ----------------
      function renderStatus() {
        var locked = !ECU.unlocked;
        var ic = function(n){ return '<span data-icon>'+I(n)+'</span>'; };
        var lockTxt = locked ? "LOCKED" : "UNLOCKED";
        if (locked && ECU.delayUntil > Date.now()) lockTxt = "LOCKED (delay 0x37)";
        else if (locked && ECU.attempts > 0) lockTxt = "LOCKED · sai key "+ECU.attempts+"/"+MAX_ATTEMPTS;
        $("#uds-status").innerHTML =
          '<div class="status-chip">'+ic("database")+
            '<div><div class="sc-label">Session</div><div class="sc-value">0x'+hx(ECU.session)+' '+SESSION_NAME[ECU.session]+'</div></div></div>' +
          '<div class="status-chip '+(locked?"locked":"unlocked")+'">'+ic("lock")+
            '<div><div class="sc-label">Security</div><div class="sc-value">'+lockTxt+'</div></div></div>' +
          '<div class="status-chip">'+ic("clock")+
            '<div><div class="sc-label">S3 còn lại</div><div class="sc-value" id="uds-s3">—</div></div></div>' +
          '<div class="status-chip">'+ic("alert")+
            '<div><div class="sc-label">DTC đang lưu</div><div class="sc-value">'+ECU.dtcs.length+'</div></div></div>';
      }

      // ---------------- params UI ----------------
      var svc = $("#uds-svc"), params = $("#uds-params"), preview = $("#uds-preview");

      function renderParams() {
        var s = svc.value;
        var html = "";
        if (s === "10") html = sel("p-sub",[["01","01 · Default"],["02","02 · Programming"],["03","03 · Extended"],["04","04 · Safety"]],"Sub-function (session)","03") + suppressChk();
        else if (s === "11") html = sel("p-sub",[["01","01 · hardReset"],["02","02 · keyOffOnReset"],["03","03 · softReset"]],"Sub-function (reset)","01") + suppressChk();
        else if (s === "3E") html = suppressChk(true);
        else if (s === "22") html = didField("F190", "Có thể nhập nhiều DID: F190 F187");
        else if (s === "2E") html = didField("F1A0") + txt("p-data","Dữ liệu ghi (hex, đúng 2 byte)","AA BB");
        else if (s === "27") html = sel("p-sub",[["01","01 · requestSeed"],["02","02 · sendKey"]],"Sub-function","01") +
            '<div id="p-keywrap" style="display:none">'+txt("p-key","Key (hex, 4 byte)","")+'<button class="btn sm" id="p-fillkey" type="button" style="margin-top:-6px">'+I("key")+'Tự điền key đúng</button></div>';
        else if (s === "19") html = sel("p-sub",[["02","02 · reportDTCByStatusMask"],["01","01 · reportNumberOfDTCByStatusMask"],["0A","0A · reportSupportedDTC"]],"Sub-function","02") + txt("p-mask","Status mask (hex)","FF");
        else if (s === "14") html = txt("p-group","DTC group (3 byte hex)","FF FF FF");
        else if (s === "31") html = sel("p-sub",[["01","01 · startRoutine"],["02","02 · stopRoutine"],["03","03 · requestResults"]],"Sub-function","01") + txt("p-rid","Routine ID (2 byte hex)","02 03") + suppressChk();
        params.innerHTML = html;

        // wire dynamic
        params.querySelectorAll("input,select").forEach(function(el){
          el.addEventListener("input", updatePreview);
          el.addEventListener("change", updatePreview);
        });
        if (s === "27") {
          var subSel = $("#p-sub"), keyWrap = $("#p-keywrap");
          var toggleKey = function(){ keyWrap.style.display = subSel.value==="02" ? "block":"none"; updatePreview(); };
          subSel.addEventListener("change", toggleKey); toggleKey();
          var fill = $("#p-fillkey");
          if (fill) fill.addEventListener("click", function(){
            if (ECU.seed === null) { log("SYS","","Chưa có seed — hãy gửi 27 01 (requestSeed) trước."); return; }
            var k = computeKey(ECU.seed);
            $("#p-key").value = [k>>>24&0xff,k>>>16&0xff,k>>>8&0xff,k&0xff].map(hx).join(" ");
            updatePreview();
          });
        }
        updatePreview();
      }

      function assembleReq() {
        var s = svc.value;
        var sid = parseInt(s,16);
        var out=[sid];
        var g=function(id){var e=$("#"+id);return e?e.value:"";};
        var sup = function(base){ var c=$("#p-sup"); return (c&&c.checked)? (base|0x80):base; };
        if (s==="10"||s==="11"){ out.push(sup(parseInt(g("p-sub"),16)||0)); }
        else if (s==="3E"){ out.push(sup(0x00)); }
        else if (s==="22"){ var ids=parseHex(g("p-did")); if(ids.length%2) ids=ids.slice(0,-1); out=out.concat(ids); }
        else if (s==="2E"){ out=out.concat(parseHex(g("p-did")).slice(0,2)).concat(parseHex(g("p-data"))); }
        else if (s==="27"){ var sub=parseInt(g("p-sub"),16)||1; out.push(sub); if(sub===2) out=out.concat(parseHex(g("p-key")).slice(0,4)); }
        else if (s==="19"){ var sub2=parseInt(g("p-sub"),16); out.push(sub2); if(sub2!==0x0A) out=out.concat(parseHex(g("p-mask")).slice(0,1)); }
        else if (s==="14"){ var grp=parseHex(g("p-group")); while(grp.length<3)grp.push(0xff); out=out.concat(grp.slice(0,3)); }
        else if (s==="31"){ out.push(sup(parseInt(g("p-sub"),16)||1)); out=out.concat(parseHex(g("p-rid")).slice(0,2)); }
        return out;
      }
      function updatePreview(){ preview.textContent = toHex(assembleReq()); }

      // param builders
      function sel(id, opts, label, def){
        return '<div class="field"><label>'+label+'</label><select class="select" id="'+id+'">'+
          opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===def?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';
      }
      function txt(id,label,ph){ return '<div class="field"><label>'+label+'</label><input class="input" id="'+id+'" value="'+ph+'" spellcheck="false"></div>'; }
      function didField(def, hint){
        var opts=Object.keys(DID_NAME).map(function(k){var v=parseInt(k);return '<option value="'+v.toString(16).toUpperCase()+'">'+v.toString(16).toUpperCase()+' · '+DID_NAME[v]+'</option>';}).join('');
        return '<div class="field"><label>DID <span class="hint">('+(hint||"hex")+')</span></label>'+
          '<input class="input" id="p-did" value="'+def+'" list="uds-didlist" spellcheck="false">'+
          '<datalist id="uds-didlist">'+opts+'</datalist></div>';
      }
      function suppressChk(checked){ return '<div class="switch-row"><label class="switch"><input type="checkbox" id="p-sup"'+(checked?" checked":"")+'><span class="slider"></span></label><span class="switch-label">Suppress positive response <small>đặt bit 0x80 vào sub-function</small></span></div>'; }

      // ---------------- events ----------------
      svc.addEventListener("change", renderParams);
      $("#uds-send").addEventListener("click", function(){ send(assembleReq()); });
      $("#uds-sendraw").addEventListener("click", function(){ send(parseHex($("#uds-raw").value)); });
      $("#uds-raw").addEventListener("keydown", function(e){ if(e.key==="Enter") send(parseHex($("#uds-raw").value)); });
      $("#uds-clear").addEventListener("click", function(){ logEl.innerHTML=""; });
      $("#uds-reset").addEventListener("click", function(){
        if (pendTimer) { clearTimeout(pendTimer); pendTimer = null; }
        setBusy(false);
        ECU = freshECU(); s3Deadline = 0; renderStatus();
        log("SYS","","Toàn bộ ECU dựng lại từ đầu (Default session, locked, 3 DTC, DID gốc). Khác với 0x11 ECUReset — cái đó chỉ xóa trạng thái bay hơi.");
      });
      // Toggling a class on the console is retroactive: lines already logged
      // hide too, which they would not if the sub-block were built conditionally.
      $("#uds-frames").addEventListener("change", function(){
        logEl.classList.toggle("hide-frames", !this.checked);
      });

      // ---------------- boot ----------------
      ECU = freshECU();
      renderStatus();
      renderParams();
      log("SYS","","ECU ảo sẵn sàng. Session=Default, Security=LOCKED. Thử gửi 22 F1 90 để đọc VIN.");

      // Timers must die with the page — route() calls this before rendering the
      // next lab, otherwise the S3 ticker keeps firing against a detached DOM.
      return function () {
        clearInterval(ticker);
        if (pendTimer) clearTimeout(pendTimer);
      };
    }
  });
})();
