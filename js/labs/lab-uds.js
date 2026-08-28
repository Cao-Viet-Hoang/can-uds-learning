/* Lab: UDS Simulator — ECU ảo trả lời request UDS đúng theo session & security */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  // ---------- helper: hex ----------
  function hx(b){return (b&0xff).toString(16).toUpperCase().padStart(2,"0");}
  function toHex(arr){return arr.map(hx).join(" ");}
  function parseHex(s){var m=(s||"").match(/[0-9a-fA-F]{1,2}/g)||[];return m.map(function(x){return parseInt(x,16)&0xff;});}
  function ascii(s){return s.split("").map(function(c){return c.charCodeAt(0);});}
  function fromAscii(arr){return arr.map(function(b){return (b>=32&&b<127)?String.fromCharCode(b):".";}).join("");}

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
'<button class="btn sm ghost" id="uds-clear" style="margin-left:auto">'+I("x")+'Xóa log</button>' +
'<button class="btn sm ghost" id="uds-reset">'+I("refresh")+'Reset ECU</button></div>' +
'<div class="lab-panel-body"><div class="console" id="uds-log"></div></div></div>' +

'</div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p><span class="log-dir" style="color:var(--c-blue)">TX</span> = request từ Tester, <span class="log-dir" style="color:var(--c-green)">RX</span> = response từ ECU, <span class="log-dir" style="color:var(--c-red)">ERR</span> = negative response. Mỗi dòng có phần giải nghĩa để bạn hiểu ý nghĩa byte.</p></div></div>' +

'<div class="callout warn">' + co("key") +
'<div class="callout-body"><div class="callout-title">Gợi ý luyện tập</div><p>1) Thử đọc VIN ngay (0x22, DID F190). 2) Thử ghi dữ liệu (0x2E) khi đang ở Default session → sẽ bị từ chối. 3) Chuyển sang Extended (0x10 03), làm Security Access (0x27), rồi ghi lại. Quan sát các NRC 0x7F, 0x33, 0x35.</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p><a href="#uds-format">Định dạng message</a> · <a href="#uds-services">Services &amp; Sessions</a> · <a href="#uds-security">Security Access</a></p></div></div>' +

'</div>'
      );
    },

    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };

      // ---------------- ECU model ----------------
      var ECU;
      function freshECU() {
        return {
          session: 0x01,               // default
          unlocked: false,
          seed: null,                  // current issued seed (32-bit)
          attempts: 0,
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
            { b: [0xC1,0x23,0x00], status: 0x2F, label: "C0123 · Chassis-specific fault" }
          ]
        };
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

      // ---------------- request handler ----------------
      function handle(req) {
        if (!req.length) return neg(0x00, 0x13);
        var sid = req[0];

        // session gate
        if (needsExtended(sid) && ECU.session === 0x01) return neg(sid, 0x7F);

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
          default: return neg(sid, 0x11);
        }
        function neg(s,c){return { neg:true, resp:[0x7F,s,c], nrc:c }; }
      }
      function neg(sid, nrc){ return { neg:true, resp:[0x7F, sid, nrc], nrc:nrc }; }
      function pos(arr){ return { neg:false, resp:arr }; }

      function subInfo(sub){ return { suppress: (sub & 0x80) !== 0, val: sub & 0x7f }; }

      function svcSession(req){
        if (req.length < 2) return neg(0x10, 0x13);
        var s = subInfo(req[1]);
        if (!SESSION_NAME[s.val]) return neg(0x10, 0x12);
        ECU.session = s.val;
        if (s.val === 0x01) { ECU.unlocked = false; ECU.seed = null; } // leaving to default relocks
        var note = "Chuyển sang " + SESSION_NAME[s.val] + " session";
        if (s.suppress) return { neg:false, resp:null, note:note+" (suppress positive response)" };
        // 50 <sub> P2(2) P2*(2)
        return { neg:false, resp:[0x50, s.val, 0x00,0x32, 0x01,0xF4], note:note+". Kèm P2=50ms, P2*=5000ms" };
      }
      function svcReset(req){
        if (req.length < 2) return neg(0x11, 0x13);
        var s = subInfo(req[1]);
        var kinds={1:"hardReset",2:"keyOffOnReset",3:"softReset"};
        if (!kinds[s.val]) return neg(0x11, 0x12);
        var note = "ECU reset ("+kinds[s.val]+") → về Default session, khóa lại";
        ECU = freshECU();
        if (s.suppress) return { neg:false, resp:null, note:note+" (suppressed)" };
        return { neg:false, resp:[0x51, s.val], note:note };
      }
      function svcTesterPresent(req){
        if (req.length < 2) return neg(0x3E, 0x13);
        var s = subInfo(req[1]);
        if (s.val !== 0x00) return neg(0x3E, 0x12);
        if (s.suppress) return { neg:false, resp:null, note:"Giữ phiên (suppress positive response) — thường dùng kiểu này" };
        return { neg:false, resp:[0x7E, 0x00], note:"Giữ phiên sống" };
      }
      function svcReadDID(req){
        if (req.length < 3) return neg(0x22, 0x13);
        var did = (req[1]<<8)|req[2];
        var data;
        if (did === 0xF186) data = [ECU.session];
        else if (ECU.dids[did]) data = ECU.dids[did];
        else return neg(0x22, 0x31);
        var resp = [0x62, req[1], req[2]].concat(data);
        var note = "DID "+hx(req[1])+hx(req[2])+" ("+(DID_NAME[did]||"?")+") = \""+fromAscii(data)+"\"";
        return { neg:false, resp:resp, note:note };
      }
      function svcWriteDID(req){
        if (req.length < 4) return neg(0x2E, 0x13);
        var did = (req[1]<<8)|req[2];
        if (did !== 0xF1A0) return neg(0x2E, 0x31);       // only F1A0 writable
        if (!ECU.unlocked) return neg(0x2E, 0x33);        // needs security
        ECU.dids[0xF1A0] = req.slice(3);
        return { neg:false, resp:[0x6E, req[1], req[2]], note:"Đã ghi DID F1A0 = "+toHex(req.slice(3)) };
      }
      function svcSecurity(req){
        if (req.length < 2) return neg(0x27, 0x13);
        var s = subInfo(req[1]);
        var lvl = s.val;
        if (lvl === 0x01) { // request seed
          if (ECU.unlocked) return { neg:false, resp:[0x67, 0x01, 0,0,0,0], note:"Đã mở khóa sẵn → seed = 0" };
          var seed = (Math.floor(Math.random()*0xffffffff))>>>0;
          ECU.seed = seed;
          var sb=[(seed>>>24)&0xff,(seed>>>16)&0xff,(seed>>>8)&0xff,seed&0xff];
          return { neg:false, resp:[0x67,0x01].concat(sb), note:"Seed = 0x"+seed.toString(16).toUpperCase().padStart(8,"0")+" · key đúng = 0x"+computeKey(seed).toString(16).toUpperCase().padStart(8,"0") };
        } else if (lvl === 0x02) { // send key
          if (ECU.seed === null) return neg(0x27, 0x24); // no seed requested
          if (req.length < 6) return neg(0x27, 0x13);
          var key = ((req[2]<<24)|(req[3]<<16)|(req[4]<<8)|req[5])>>>0;
          var expected = computeKey(ECU.seed);
          if (key === expected) {
            ECU.unlocked = true; ECU.seed = null; ECU.attempts = 0;
            return { neg:false, resp:[0x67, 0x02], note:"Key đúng → ĐÃ MỞ KHÓA (security unlocked)" };
          } else {
            ECU.attempts++;
            if (ECU.attempts >= 3) { ECU.seed = null; return neg(0x27, 0x36); }
            return neg(0x27, 0x35);
          }
        }
        return neg(0x27, 0x12);
      }
      function svcReadDTC(req){
        if (req.length < 2) return neg(0x19, 0x13);
        var sub = req[1];
        if (sub === 0x01) { // number of DTC by status mask
          if (req.length < 3) return neg(0x19, 0x13);
          var mask = req[2];
          var count = ECU.dtcs.filter(function(d){return d.status & mask;}).length;
          return { neg:false, resp:[0x59,0x01,0xFF,0x01,(count>>8)&0xff,count&0xff], note:"Số DTC khớp mask 0x"+hx(mask)+" = "+count };
        } else if (sub === 0x02) { // report DTC by status mask
          if (req.length < 3) return neg(0x19, 0x13);
          var mask2 = req[2];
          var list = ECU.dtcs.filter(function(d){return d.status & mask2;});
          var body=[0x59,0x02,0xFF];
          var lines=[];
          list.forEach(function(d){ body=body.concat(d.b,[d.status]); lines.push(toHex(d.b)+" ("+d.label+") status="+hx(d.status)); });
          return { neg:false, resp:body, note: list.length? "DTC khớp:\n   "+lines.join("\n   ") : "Không có DTC khớp mask" };
        } else if (sub === 0x0A) { // supported DTC
          var body2=[0x59,0x0A,0xFF];
          ECU.dtcs.forEach(function(d){ body2=body2.concat(d.b,[d.status]); });
          return { neg:false, resp:body2, note:"Liệt kê tất cả "+ECU.dtcs.length+" DTC được hỗ trợ" };
        }
        return neg(0x19, 0x12);
      }
      function svcClearDTC(req){
        if (req.length < 4) return neg(0x14, 0x13);
        var n = ECU.dtcs.length;
        ECU.dtcs = [];
        return { neg:false, resp:[0x54], note:"Đã xóa "+n+" DTC (group 0x"+hx(req[1])+hx(req[2])+hx(req[3])+")" };
      }
      function svcRoutine(req){
        if (req.length < 4) return neg(0x31, 0x13);
        var sub = req[1];
        if (sub<1||sub>3) return neg(0x31, 0x12);
        var rid = (req[2]<<8)|req[3];
        // routine 0x0203 (erase memory) requires security
        if (rid === 0x0203 && !ECU.unlocked) return neg(0x31, 0x33);
        var subName={1:"start",2:"stop",3:"requestResults"}[sub];
        var result = sub===3 ? [0x00] : [];  // routineStatusRecord
        return { neg:false, resp:[0x71, sub, req[2], req[3]].concat(result), note:"Routine 0x"+hx(req[2])+hx(req[3])+" · "+subName+(sub===3?" → status 00 (completed)":" OK") };
      }

      // ---------------- logging ----------------
      var logEl = $("#uds-log");
      function log(dir, hex, note) {
        var cls = dir === "TX" ? "tx" : dir === "RX" ? "rx" : dir === "ERR" ? "err" : "sys";
        var noteHtml = note ? '<div class="log-note">↳ '+APP.esc(note).replace(/\n/g,"<br>")+'</div>' : "";
        var msg = hex ? '<span class="log-hex">'+APP.esc(hex)+'</span>'+noteHtml : noteHtml;
        var line = document.createElement("div");
        line.className = "log-line " + cls;
        line.innerHTML = '<span class="log-dir">'+dir+'</span><span class="log-msg">'+msg+'</span>';
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
      }

      // ---------------- send ----------------
      function send(req) {
        if (!req.length) { log("SYS", "", "Request rỗng, bỏ qua."); return; }
        log("TX", toHex(req), describeReq(req));
        var r = handle(req);
        if (r.resp === null) {
          log("SYS", "", r.note || "(ECU không gửi response — suppressed)");
        } else if (r.neg) {
          log("ERR", toHex(r.resp), "Negative Response · SID 0x"+hx(r.resp[1])+" bị từ chối · NRC 0x"+hx(r.nrc)+" = "+(NRC_NAME[r.nrc]||"?"));
        } else {
          log("RX", toHex(r.resp), r.note);
        }
        renderStatus();
      }

      function describeReq(req){
        var sid=req[0];
        var names={0x10:"DiagnosticSessionControl",0x11:"ECUReset",0x27:"SecurityAccess",0x22:"ReadDataByIdentifier",0x2E:"WriteDataByIdentifier",0x19:"ReadDTCInformation",0x14:"ClearDiagnosticInformation",0x31:"RoutineControl",0x3E:"TesterPresent"};
        return "SID 0x"+hx(sid)+" · "+(names[sid]||"Unknown service");
      }

      // ---------------- status strip ----------------
      function renderStatus() {
        var locked = !ECU.unlocked;
        var ic = function(n){ return '<span data-icon>'+I(n)+'</span>'; };
        $("#uds-status").innerHTML =
          '<div class="status-chip">'+ic("database")+
            '<div><div class="sc-label">Session</div><div class="sc-value">0x'+hx(ECU.session)+' '+SESSION_NAME[ECU.session]+'</div></div></div>' +
          '<div class="status-chip '+(locked?"locked":"unlocked")+'">'+ic("lock")+
            '<div><div class="sc-label">Security</div><div class="sc-value">'+(locked?"LOCKED":"UNLOCKED")+'</div></div></div>' +
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
        else if (s === "22") html = didField("F190");
        else if (s === "2E") html = didField("F1A0") + txt("p-data","Dữ liệu ghi (hex)","AA BB");
        else if (s === "27") html = sel("p-sub",[["01","01 · requestSeed"],["02","02 · sendKey"]],"Sub-function","01") +
            '<div id="p-keywrap" style="display:none">'+txt("p-key","Key (hex, 4 byte)","")+'<button class="btn sm" id="p-fillkey" type="button" style="margin-top:-6px">'+I("key")+'Tự điền key đúng</button></div>';
        else if (s === "19") html = sel("p-sub",[["02","02 · reportDTCByStatusMask"],["01","01 · reportNumberOfDTCByStatusMask"],["0A","0A · reportSupportedDTC"]],"Sub-function","02") + txt("p-mask","Status mask (hex)","FF");
        else if (s === "14") html = txt("p-group","DTC group (3 byte hex)","FF FF FF");
        else if (s === "31") html = sel("p-sub",[["01","01 · startRoutine"],["02","02 · stopRoutine"],["03","03 · requestResults"]],"Sub-function","01") + txt("p-rid","Routine ID (2 byte hex)","02 03");
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
        else if (s==="22"){ out=out.concat(parseHex(g("p-did")).slice(0,2)); }
        else if (s==="2E"){ out=out.concat(parseHex(g("p-did")).slice(0,2)).concat(parseHex(g("p-data"))); }
        else if (s==="27"){ var sub=parseInt(g("p-sub"),16)||1; out.push(sub); if(sub===2) out=out.concat(parseHex(g("p-key")).slice(0,4)); }
        else if (s==="19"){ var sub2=parseInt(g("p-sub"),16); out.push(sub2); if(sub2!==0x0A) out=out.concat(parseHex(g("p-mask")).slice(0,1)); }
        else if (s==="14"){ var grp=parseHex(g("p-group")); while(grp.length<3)grp.push(0xff); out=out.concat(grp.slice(0,3)); }
        else if (s==="31"){ out.push(parseInt(g("p-sub"),16)||1); out=out.concat(parseHex(g("p-rid")).slice(0,2)); }
        return out;
      }
      function updatePreview(){ preview.textContent = toHex(assembleReq()); }

      // param builders
      function sel(id, opts, label, def){
        return '<div class="field"><label>'+label+'</label><select class="select" id="'+id+'">'+
          opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===def?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';
      }
      function txt(id,label,ph){ return '<div class="field"><label>'+label+'</label><input class="input" id="'+id+'" value="'+ph+'" spellcheck="false"></div>'; }
      function didField(def){
        var opts=Object.keys(DID_NAME).map(function(k){var v=parseInt(k);return '<option value="'+v.toString(16).toUpperCase()+'">'+v.toString(16).toUpperCase()+' · '+DID_NAME[v]+'</option>';}).join('');
        return '<div class="field"><label>DID <span class="hint">(hex)</span></label>'+
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
      $("#uds-reset").addEventListener("click", function(){ ECU=freshECU(); renderStatus(); log("SYS","","ECU đã reset về trạng thái ban đầu (Default session, locked, 3 DTC)."); });

      // ---------------- boot ----------------
      ECU = freshECU();
      renderStatus();
      renderParams();
      log("SYS","","ECU ảo sẵn sàng. Session=Default, Security=LOCKED. Thử gửi 22 F1 90 để đọc VIN.");
    }
  });
})();
