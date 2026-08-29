/* Lab: Arbitration Simulator — nhiều node tranh bus theo từng bit */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("lab-arbitration", {
    title: "Arbitration Simulator",
    icon: "merge",
    keywords: "lab arbitration simulator phan xu node id priority bitwise standard extended 29-bit thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">Arbitration Simulator</h1>' +
'<p class="page-lead">Nhập Identifier của nhiều node — khung Standard 11-bit, Extended 29-bit hoặc trộn lẫn cả hai — rồi chạy phân xử từng bit. Xem chính xác thời điểm mỗi node "thua" (phát recessive nhưng bus là dominant) và node nào giành được bus.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab"><div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Các node tham gia</span>' +
'<span class="lp-sub">ID hex — Standard 0x000–0x7FF, Extended 0x0–0x1FFFFFFF</span></div><div class="lab-panel-body">' +
'<div class="node-head"><span>Tên</span><span>Identifier (hex)</span><span>Khung</span><span>Loại</span></div>' +
'<div id="arb-nodes"></div>' +
'<div class="btn-row" style="margin-top:14px">' +
'<button class="btn sm" id="arb-add">' + I("plus") + 'Thêm node</button>' +
'<button class="btn sm" id="arb-demo-rtr">Ví dụ: cùng ID, khác RTR</button>' +
'<button class="btn sm" id="arb-demo-ext">Ví dụ: Standard vs Extended</button>' +
'<button class="btn sm" id="arb-demo-clash">Ví dụ: xung đột ID</button>' +
'</div>' +
'<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">' +
'<div class="btn-row">' +
'<button class="btn primary" id="arb-run">' + I("play") + 'Chạy tự động</button>' +
'<button class="btn" id="arb-step">' + I("step") + 'Từng bit</button>' +
'<button class="btn" id="arb-reset">' + I("refresh") + 'Đặt lại</button>' +
'</div>' +
'<div id="arb-result"></div>' +
'</div></div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Quy tắc: mỗi cột là 1 bit phát ra trong trường Arbitration, tính từ MSB. Bus = AND của tất cả node còn đang phát (dominant 0 thắng recessive 1). Node phát recessive (1) mà bus là dominant (0) bị loại ngay từ bit đó (ô mờ đi).</p>' +
'<p><strong>Standard</strong> phát 11 bit ID → <strong>RTR</strong> → <strong>IDE = 0</strong>. <strong>Extended</strong> phát 11 bit base ID (ID28…ID18) → <strong>SRR = 1</strong> → <strong>IDE = 1</strong> → 18 bit ID mở rộng (E17…E0) → <strong>RTR</strong>. Vì hai loại khung xếp thẳng hàng ở 11 cột đầu, khi trộn trên cùng một bus thì <em>khung Standard luôn thắng khung Extended có cùng base ID</em> — Extended thua ở bit SRR (nếu Standard là Data Frame) hoặc muộn nhất ở bit IDE.</p>' +
'<p>Khi một khung Standard thắng, nó đã ra khỏi trường arbitration nên các cột phía sau hiển thị "·".</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#can-arbitration">Arbitration</a> và <a href="#can-frame">Cấu trúc khung</a> để hiểu nguyên lý phi phá hủy cùng vị trí bit SRR/IDE trước khi thử.</p></div></div>' +

'</div>'
      );
    },
    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };
      var nodesWrap = $("#arb-nodes");
      var result = $("#arb-result");
      var BASE_BITS = 11;            // ID10..ID0 (Standard) == ID28..ID18 (base của Extended)
      var STD_WIDTH = BASE_BITS + 1; // 11 ID bits + RTR — bề rộng lưới khi không có node Extended
      var MAX_STD = 0x7ff, MAX_EXT = 0x1fffffff;

      var nodes = [
        { name: "ECU A", id: "123", ext: false, rtr: false },
        { name: "ECU B", id: "1A0", ext: false, rtr: false },
        { name: "ECU C", id: "0F5", ext: false, rtr: false }
      ];
      var revealed = 0;      // number of bit-columns revealed
      var timer = null;

      function renderNodes() {
        nodesWrap.innerHTML = nodes.map(function (n, i) {
          // Labels live once in .node-head above — repeating "Tên / Identifier"
          // on every row tripled the text for no added meaning.
          return '<div class="node-row">' +
            '<input class="input" data-name="'+i+'" value="'+APP.esc(n.name)+'" style="font-family:var(--font-sans)">' +
            '<input class="input" data-id="'+i+'" maxlength="'+(n.ext?8:3)+'" value="'+APP.esc(n.id)+'" spellcheck="false">' +
            '<select class="select" data-ext="'+i+'">' +
              '<option value="0"'+(n.ext?"":" selected")+'>Standard 11-bit</option>' +
              '<option value="1"'+(n.ext?" selected":"")+'>Extended 29-bit</option>' +
            '</select>' +
            '<select class="select" data-rtr="'+i+'">' +
              '<option value="0"'+(n.rtr?"":" selected")+'>Data (RTR 0)</option>' +
              '<option value="1"'+(n.rtr?" selected":"")+'>Remote (RTR 1)</option>' +
            '</select>' +
            (nodes.length > 2 ? '<button class="btn sm" data-del="'+i+'" title="Xóa node">'+I("x")+'</button>' : '<span></span>') +
          '</div>';
        }).join("");
        nodesWrap.querySelectorAll("[data-id]").forEach(function (inp) {
          inp.addEventListener("input", function () {
            var i = +inp.getAttribute("data-id");
            inp.value = inp.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0, nodes[i].ext ? 8 : 3);
            nodes[i].id = inp.value; reset();
          });
        });
        nodesWrap.querySelectorAll("[data-name]").forEach(function (inp) {
          inp.addEventListener("input", function () { nodes[+inp.getAttribute("data-name")].name = inp.value; render(); });
        });
        nodesWrap.querySelectorAll("[data-ext]").forEach(function (selEl) {
          selEl.addEventListener("change", function () {
            // Keep whatever the user typed: switching an out-of-range ID back to
            // Standard is exactly the mistake the overflow callout explains.
            nodes[+selEl.getAttribute("data-ext")].ext = selEl.value === "1";
            renderNodes(); reset();   // re-render so the ID field's maxlength follows the frame type
          });
        });
        nodesWrap.querySelectorAll("[data-rtr]").forEach(function (selEl) {
          selEl.addEventListener("change", function () {
            nodes[+selEl.getAttribute("data-rtr")].rtr = selEl.value === "1"; reset();
          });
        });
        nodesWrap.querySelectorAll("[data-del]").forEach(function (b) {
          b.addEventListener("click", function () { nodes.splice(+b.getAttribute("data-del"), 1); renderNodes(); reset(); });
        });
      }

      function rawId(hex) { return parseInt(hex || "0", 16) || 0; }
      function toBits(v, n) {
        var s = (v >>> 0).toString(2); while (s.length < n) s = "0" + s;
        return s.slice(s.length - n).split("").map(Number);
      }
      function hex(v, w) { return "0x" + v.toString(16).toUpperCase().padStart(w, "0"); }

      // Bits a node actually drives onto the bus, in transmit order. A Standard
      // frame stops after IDE (13 bits) — everything past that is its Control
      // field, i.e. it has already won and is no longer arbitrating.
      function arbBits(n) {
        if (n.ext) {
          var v = rawId(n.id) & MAX_EXT;
          return toBits((v >>> 18) & MAX_STD, BASE_BITS)   // ID28..ID18
            .concat([1, 1])                                // SRR (luôn recessive), IDE = 1
            .concat(toBits(v & 0x3ffff, 18))               // ID17..ID0
            .concat([n.rtr ? 1 : 0]);                      // RTR
        }
        return toBits(rawId(n.id) & MAX_STD, BASE_BITS)
          .concat([n.rtr ? 1 : 0, 0]);                     // RTR, IDE = 0
      }

      function colLabels(anyStd, anyExt) {
        var L = [];
        for (var i = BASE_BITS - 1; i >= 0; i--) L.push("ID" + (anyExt ? i + 18 : i));
        if (!anyExt) { L.push("RTR"); return L; }
        L.push(anyStd ? "SRR/RTR" : "SRR");
        L.push("IDE");
        for (var e = 17; e >= 0; e--) L.push("E" + e);
        L.push("RTR");
        return L;
      }

      function compute() {
        var anyExt = nodes.some(function (n) { return n.ext; });
        var anyStd = nodes.some(function (n) { return !n.ext; });
        var full = anyExt ? 32 : STD_WIDTH;
        var mats = nodes.map(function (n, i) {
          var raw = rawId(n.id), max = n.ext ? MAX_EXT : MAX_STD;
          return {
            idx: i, name: n.name, ext: n.ext, rtr: n.rtr, bits: arbBits(n),
            val: raw & max, raw: raw, max: max, overflow: raw > max, lostAt: -1
          };
        });

        var bus = [];
        for (var c = 0; c < full; c++) {
          // Only nodes still in the race AND still holding an arbitration bit
          // drive the bus at this column.
          var live = mats.filter(function (m) { return m.lostAt === -1 && c < m.bits.length; });
          if (!live.length) { bus.push(null); continue; }
          var b = 1;
          live.forEach(function (m) { if (m.bits[c] === 0) b = 0; });
          bus.push(b);
          live.forEach(function (m) { if (m.bits[c] === 1 && b === 0) m.lostAt = c; });
        }
        // A Standard winner leaves the arbitration field at bit 13; the trailing
        // Extended-only columns are then nobody's, so don't draw or animate them.
        while (bus.length > STD_WIDTH && bus[bus.length - 1] === null) bus.pop();

        var survivors = mats.filter(function (m) { return m.lostAt === -1; });
        return {
          mats: mats, bus: bus, width: bus.length, labels: colLabels(anyStd, anyExt),
          anyExt: anyExt, survivors: survivors,
          winner: survivors.length === 1 ? survivors[0] : null,
          collision: survivors.length > 1 ? survivors : null,
          overflow: mats.filter(function (m) { return m.overflow; })
        };
      }

      function winnerNote(m) {
        var w = m.winner, parts = [];
        // Losers knocked out at SRR (col 11) or IDE (col 12) by a Standard
        // winner — the rule people get wrong when both formats share a bus.
        var byFormat = w.ext ? [] : m.mats.filter(function (n) {
          return n.ext && (n.lostAt === BASE_BITS || n.lostAt === BASE_BITS + 1);
        });
        var tie = m.mats.filter(function (n) {
          return n.idx !== w.idx && n.ext === w.ext && n.val === w.val && n.rtr !== w.rtr;
        });

        if (byFormat.length) {
          parts.push(byFormat.map(function (n) { return APP.esc(n.name); }).join(", ") +
            ' (Extended) có cùng base ID, nhưng khung Standard ' +
            (w.rtr
              ? 'này là Remote Frame nên hòa ở cột SRR/RTR (cả hai đều recessive) rồi thắng ngay ở <strong>bit IDE</strong>: Standard phát IDE = 0 (dominant), Extended phát IDE = 1 (recessive).'
              : 'này phát <strong>RTR = 0 (dominant)</strong> đúng chỗ Extended buộc phải phát <strong>SRR = 1 (recessive)</strong>, nên Extended thua ngay tại cột đó.') +
            ' Khung 11-bit luôn ưu tiên hơn khung 29-bit cùng base ID, bất kể 18 bit mở rộng nhỏ đến đâu.');
        }
        if (tie.length) {
          parts.push('Có node khác cùng Identifier và cùng loại khung, nhưng node này phát <strong>Data Frame (RTR = 0)</strong> nên thắng ở chính bit RTR — Data Frame luôn ưu tiên hơn Remote Frame cùng ID.');
        }
        if (!parts.length) parts.push('Đây là giá trị arbitration nhỏ nhất → ưu tiên cao nhất.');
        return parts.join(" ");
      }

      function render() {
        var m = compute();
        var W = m.width;
        if (revealed > W) revealed = W;
        var html = "";

        if (m.overflow.length) {
          html += '<div class="callout danger">'+co("alert")+'<div class="callout-body">' +
            '<div class="callout-title">Identifier vượt số bit của khung</div><p>' +
            m.overflow.map(function (n) {
              return APP.esc(n.name) + ' (' + (n.ext ? "Extended 29-bit" : "Standard 11-bit") + ') nhập ' +
                     hex(n.raw, 1) + ' > ' + hex(n.max, 1) +
                     ' → đang được phân xử như <strong>' + hex(n.val, n.ext ? 8 : 3) + '</strong>';
            }).join("<br>") +
            '</p><p>Khung Standard chỉ có 11 bit ID (tối đa 0x7FF). Muốn dùng ID lớn hơn, đổi cột <strong>Khung</strong> của node đó sang <strong>Extended 29-bit</strong> (tối đa 0x1FFFFFFF).</p></div></div>';
        }

        html += '<div class="arb-grid"><table class="arb-table'+(m.anyExt?" wide":"")+'"><thead><tr><th>Node</th>';
        for (var i = 0; i < W; i++) html += '<th>'+m.labels[i]+'</th>';
        html += '<th>Trạng thái</th></tr></thead><tbody>';

        m.mats.forEach(function (n) {
          var isWinner = m.winner && m.winner.idx === n.idx;
          html += '<tr'+(isWinner?' class="winner"':'')+'><th>'+APP.esc(n.name)+
            '<span class="arb-fmt">'+(n.ext?"29-bit":"11-bit")+'</span></th>';
          for (var c = 0; c < W; c++) {
            var shown = c < revealed;
            if (c >= n.bits.length) {      // Standard frame already out of the arbitration field
              html += '<td class="na">'+(shown?"·":"")+'</td>';
              continue;
            }
            var cls = n.bits[c] === 0 ? "d" : "r";
            var lost = n.lostAt !== -1 && c >= n.lostAt;
            if (lost) cls += " lost";
            html += '<td class="'+(shown?cls:"")+'" style="'+(shown?"":"opacity:.15")+'">'+(shown?n.bits[c]:"")+'</td>';
          }
          var status;
          if (n.lostAt !== -1) {
            status = n.lostAt < revealed
              ? '<span class="badge red">Thua @ '+m.labels[n.lostAt]+'</span>'
              : '<span class="badge">—</span>';
          } else if (revealed < W) {
            status = '<span class="badge brand">Đang tranh</span>';
          } else if (m.collision) {
            status = '<span class="badge amber">Xung đột</span>';
          } else {
            status = '<span class="badge green">Thắng</span>';
          }
          html += '<td>'+status+'</td></tr>';
        });

        // bus row
        html += '<tr><th style="color:var(--c-brand)">Bus (AND)</th>';
        for (var c2 = 0; c2 < W; c2++) {
          var shown2 = c2 < revealed;
          if (m.bus[c2] === null) { html += '<td class="na">'+(shown2?"·":"")+'</td>'; continue; }
          html += '<td class="'+(shown2?(m.bus[c2]===0?"d":"r"):"")+'" style="'+(shown2?"":"opacity:.15")+'">'+(shown2?m.bus[c2]:"")+'</td>';
        }
        html += '<td></td></tr>';
        html += '</tbody></table></div>';

        if (revealed >= W) {
          if (m.winner) {
            var w = m.winner;
            html += '<div class="callout tip">'+co("check")+'<div class="callout-body"><div class="callout-title">'+APP.esc(w.name)+' thắng arbitration</div>' +
              '<p>Khung <strong>'+(w.ext?"Extended 29-bit":"Standard 11-bit")+'</strong>, ID = '+hex(w.val, w.ext?8:3)+
              (w.ext ? ' (base '+hex((w.val >>> 18) & MAX_STD, 3)+' + ext '+hex(w.val & 0x3ffff, 5)+')' : '') +
              ', RTR = '+(w.rtr?1:0)+'. ' + winnerNote(m) +
              ' Node này tiếp tục truyền trọn khung; các node thua sẽ tự động phát lại khi bus rảnh (phi phá hủy).</p></div></div>';
          } else if (m.collision) {
            html += '<div class="callout danger">'+co("alert")+'<div class="callout-body"><div class="callout-title">Không có node nào thắng — xung đột</div>' +
              '<p>' + m.collision.map(function (n) { return APP.esc(n.name); }).join(" và ") +
              ' cùng loại khung <strong>'+(m.collision[0].ext?"Extended 29-bit":"Standard 11-bit")+'</strong>, cùng Identifier <strong>'+
              hex(m.collision[0].val, m.collision[0].ext?8:3)+'</strong> và cùng bit RTR, nên đi hết trường arbitration mà không node nào bị loại — arbitration <em>không</em> phân định được.</p>' +
              '<p>Trên bus thật, cả hai cùng truyền tiếp và sẽ lệch nhau ở bit đầu tiên khác nhau trong Control/Data field. Node đang phát recessive mà đọc lại thấy dominant sẽ báo <strong>Bit Error</strong> → phát Error Frame → cả khung bị hủy và truyền lại. Đây chính là lý do <strong>mỗi Identifier chỉ được phép có duy nhất một node phát</strong> trong thiết kế mạng CAN.</p></div></div>';
          } else {
            html += '<div class="callout warn">'+co("alert")+'<div class="callout-body"><p>Không có node nào tham gia.</p></div></div>';
          }
        }
        result.innerHTML = html;
      }

      function totalCols() { return compute().width; }
      function reset() { revealed = 0; if (timer) { clearInterval(timer); timer = null; } render(); }
      function stepOne() { if (revealed < totalCols()) { revealed++; render(); } }
      function run() {
        reset();
        // An Extended run is 32 columns instead of 12 — step faster so the whole
        // arbitration still plays out in roughly the same wall-clock time.
        var W = totalCols(), delay = W > 16 ? 190 : 420;
        timer = setInterval(function () {
          if (revealed >= W) { clearInterval(timer); timer = null; return; }
          revealed++; render();
        }, delay);
      }

      $("#arb-add").addEventListener("click", function () {
        if (nodes.length >= 6) return;
        var letter = String.fromCharCode(65 + nodes.length);
        nodes.push({ name: "ECU " + letter, id: (0x200 + nodes.length * 0x37).toString(16).toUpperCase(), ext: false, rtr: false });
        renderNodes(); reset();
      });
      function preset(list) { nodes = list; renderNodes(); reset(); run(); }
      $("#arb-demo-rtr").addEventListener("click", function () {
        preset([
          { name: "ECU A", id: "2A0", ext: false, rtr: false },
          { name: "ECU B", id: "2A0", ext: false, rtr: true },
          { name: "ECU C", id: "3F1", ext: false, rtr: false }
        ]);
      });
      $("#arb-demo-ext").addEventListener("click", function () {
        // 0x63C0000 >> 18 === 0x18F: both Extended nodes share ECU A's base ID,
        // so they tie for 11 columns and then lose on frame format alone.
        preset([
          { name: "ECU A", id: "18F", ext: false, rtr: true },
          { name: "ECU B", id: "63C0000", ext: true, rtr: false },
          { name: "ECU C", id: "63C0FFF", ext: true, rtr: false }
        ]);
      });
      $("#arb-demo-clash").addEventListener("click", function () {
        preset([
          { name: "ECU A", id: "180", ext: false, rtr: false },
          { name: "ECU B", id: "180", ext: false, rtr: false },
          { name: "ECU C", id: "4C2", ext: false, rtr: false }
        ]);
      });
      $("#arb-run").addEventListener("click", run);
      $("#arb-step").addEventListener("click", function () { if (timer) { clearInterval(timer); timer = null; } stepOne(); });
      $("#arb-reset").addEventListener("click", reset);

      renderNodes();
      reset();

      // cleanup on leaving page
      return function () { if (timer) clearInterval(timer); };
    }
  });
})();
