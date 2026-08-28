/* Lab: Arbitration Simulator — nhiều node tranh bus theo từng bit */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("lab-arbitration", {
    title: "Arbitration Simulator",
    icon: "merge",
    keywords: "lab arbitration simulator phan xu node id priority bitwise thuc hanh",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("flask") + 'Lab tương tác</span>' +
'<h1 class="page-title">Arbitration Simulator</h1>' +
'<p class="page-lead">Nhập Identifier của nhiều node và chạy phân xử từng bit. Xem chính xác thời điểm mỗi node "thua" (phát recessive nhưng bus là dominant) và node nào giành được bus.</p>' +
'<hr class="lead-hr" />' +

'<div class="lab"><div class="lab-panel"><div class="lab-panel-head">' + I("tool") + '<span>Các node tham gia</span>' +
'<span class="lp-sub">ID dạng hex, 11-bit (0x000–0x7FF)</span></div><div class="lab-panel-body">' +
'<div class="node-head"><span>Tên</span><span>Identifier (hex)</span><span>Loại khung</span></div>' +
'<div id="arb-nodes"></div>' +
'<div class="btn-row" style="margin-top:14px">' +
'<button class="btn sm" id="arb-add">' + I("plus") + 'Thêm node</button>' +
'<button class="btn sm" id="arb-demo-rtr">Ví dụ: cùng ID, khác RTR</button>' +
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
'<div class="callout-body"><p>Quy tắc: mỗi cột là 1 bit của trường Arbitration, từ MSB. Với khung Standard, trường này gồm <strong>11 bit Identifier + bit RTR</strong> — tổng 12 bit. Bus = AND của tất cả node còn đang phát (dominant 0 thắng recessive 1). Node phát recessive (1) mà bus là dominant (0) sẽ bị loại ngay từ bit đó (ô mờ đi). Node có ID nhỏ nhất thắng; nếu hai node cùng ID thì bit RTR phân định tiếp — Data Frame (RTR = 0) thắng Remote Frame (RTR = 1).</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#can-arbitration">Arbitration</a> để hiểu nguyên lý phi phá hủy trước khi thử.</p></div></div>' +

'</div>'
      );
    },
    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };
      var nodesWrap = $("#arb-nodes");
      var result = $("#arb-result");
      var ID_BITS = 11;
      var WIDTH = ID_BITS + 1;   // 11 identifier bits + RTR
      var COL_LABEL = [];
      for (var ci = ID_BITS - 1; ci >= 0; ci--) COL_LABEL.push("ID" + ci);
      COL_LABEL.push("RTR");

      var nodes = [
        { name: "ECU A", id: "123", rtr: false },
        { name: "ECU B", id: "1A0", rtr: false },
        { name: "ECU C", id: "0F5", rtr: false }
      ];
      var revealed = 0;      // number of bit-columns revealed
      var timer = null;

      function renderNodes() {
        nodesWrap.innerHTML = nodes.map(function (n, i) {
          // Labels live once in .node-head above — repeating "Tên / Identifier"
          // on every row tripled the text for no added meaning.
          return '<div class="node-row">' +
            '<input class="input" data-name="'+i+'" value="'+APP.esc(n.name)+'" style="font-family:var(--font-sans)">' +
            '<input class="input" data-id="'+i+'" maxlength="3" value="'+APP.esc(n.id)+'" spellcheck="false">' +
            '<select class="select" data-rtr="'+i+'">' +
              '<option value="0"'+(n.rtr?"":" selected")+'>Data (RTR 0)</option>' +
              '<option value="1"'+(n.rtr?" selected":"")+'>Remote (RTR 1)</option>' +
            '</select>' +
            (nodes.length > 2 ? '<button class="btn sm" data-del="'+i+'" title="Xóa node">'+I("x")+'</button>' : '<span></span>') +
          '</div>';
        }).join("");
        nodesWrap.querySelectorAll("[data-id]").forEach(function (inp) {
          inp.addEventListener("input", function () {
            inp.value = inp.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0,3);
            nodes[+inp.getAttribute("data-id")].id = inp.value; reset();
          });
        });
        nodesWrap.querySelectorAll("[data-name]").forEach(function (inp) {
          inp.addEventListener("input", function () { nodes[+inp.getAttribute("data-name")].name = inp.value; render(); });
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

      function arbBits(n) {
        var v = rawId(n.id) & 0x7ff;
        var s = v.toString(2); while (s.length < ID_BITS) s = "0" + s;
        var b = s.split("").map(Number);
        b.push(n.rtr ? 1 : 0);          // RTR is the last bit of the arbitration field
        return b;
      }

      function compute() {
        var mats = nodes.map(function (n, i) {
          var raw = rawId(n.id);
          return {
            idx: i, name: n.name, bits: arbBits(n), rtr: n.rtr,
            val: raw & 0x7ff, raw: raw, overflow: raw > 0x7ff, lostAt: -1
          };
        });
        var bus = [];
        for (var c = 0; c < WIDTH; c++) {
          // bus bit = AND of all still-active nodes at this column
          var b = 1;
          mats.forEach(function (m) { if (m.lostAt === -1 && m.bits[c] === 0) b = 0; });
          bus.push(b);
          // mark losers at this column
          mats.forEach(function (m) {
            if (m.lostAt === -1 && m.bits[c] === 1 && b === 0) m.lostAt = c;
          });
        }
        var survivors = mats.filter(function (m) { return m.lostAt === -1; });
        return {
          mats: mats, bus: bus,
          survivors: survivors,
          winner: survivors.length === 1 ? survivors[0] : null,
          collision: survivors.length > 1 ? survivors : null,
          overflow: mats.filter(function (m) { return m.overflow; })
        };
      }

      function render() {
        var m = compute();
        var html = "";

        if (m.overflow.length) {
          html += '<div class="callout danger">'+co("alert")+'<div class="callout-body">' +
            '<div class="callout-title">Identifier vượt 11 bit</div><p>' +
            m.overflow.map(function (n) {
              return APP.esc(n.name) + ' nhập 0x' + n.raw.toString(16).toUpperCase() +
                     ' > 0x7FF → đang được phân xử như <strong>0x' + n.val.toString(16).toUpperCase().padStart(3,"0") + '</strong>';
            }).join("<br>") +
            '</p><p>Khung Standard chỉ có 11 bit ID (tối đa 0x7FF). Muốn dùng ID lớn hơn phải chuyển sang khung Extended 29-bit.</p></div></div>';
        }

        html += '<div class="arb-grid"><table class="arb-table"><thead><tr><th>Node</th>';
        for (var i = 0; i < WIDTH; i++) html += '<th>'+COL_LABEL[i]+'</th>';
        html += '<th>Trạng thái</th></tr></thead><tbody>';

        m.mats.forEach(function (n) {
          var isWinner = m.winner && m.winner.idx === n.idx;
          html += '<tr'+(isWinner?' class="winner"':'')+'><th>'+APP.esc(n.name)+'</th>';
          for (var c = 0; c < WIDTH; c++) {
            var shown = c < revealed;
            var cls = n.bits[c] === 0 ? "d" : "r";
            var lost = n.lostAt !== -1 && c >= n.lostAt;
            if (lost) cls += " lost";
            html += '<td class="'+(shown?cls:"")+'" style="'+(shown?"":"opacity:.15")+'">'+(shown?n.bits[c]:"")+'</td>';
          }
          var status;
          if (n.lostAt !== -1) {
            status = n.lostAt < revealed
              ? '<span class="badge red">Thua @ '+COL_LABEL[n.lostAt]+'</span>'
              : '<span class="badge">—</span>';
          } else if (revealed < WIDTH) {
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
        for (var c2 = 0; c2 < WIDTH; c2++) {
          var shown2 = c2 < revealed;
          html += '<td class="'+(shown2?(m.bus[c2]===0?"d":"r"):"")+'" style="'+(shown2?"":"opacity:.15")+'">'+(shown2?m.bus[c2]:"")+'</td>';
        }
        html += '<td></td></tr>';
        html += '</tbody></table></div>';

        if (revealed >= WIDTH) {
          if (m.winner) {
            var w = m.winner;
            var tie = m.mats.filter(function (n) { return n.idx !== w.idx && n.val === w.val; });
            html += '<div class="callout tip">'+co("check")+'<div class="callout-body"><div class="callout-title">'+APP.esc(w.name)+' thắng arbitration</div>' +
              '<p>ID = 0x'+w.val.toString(16).toUpperCase().padStart(3,"0")+', RTR = '+(w.rtr?1:0)+'. ' +
              (tie.length
                ? 'Có node khác cùng ID, nhưng node này phát <strong>Data Frame (RTR = 0)</strong> nên thắng ở chính bit RTR — Data Frame luôn ưu tiên hơn Remote Frame cùng ID.'
                : 'Đây là giá trị arbitration nhỏ nhất → ưu tiên cao nhất.') +
              ' Node này tiếp tục truyền trọn khung; các node thua sẽ tự động phát lại khi bus rảnh (phi phá hủy).</p></div></div>';
          } else if (m.collision) {
            html += '<div class="callout danger">'+co("alert")+'<div class="callout-body"><div class="callout-title">Không có node nào thắng — xung đột</div>' +
              '<p>' + m.collision.map(function (n) { return APP.esc(n.name); }).join(" và ") +
              ' có cùng Identifier <strong>0x'+m.collision[0].val.toString(16).toUpperCase().padStart(3,"0")+'</strong> và cùng bit RTR, nên đi hết trường arbitration mà không node nào bị loại — arbitration <em>không</em> phân định được.</p>' +
              '<p>Trên bus thật, cả hai cùng truyền tiếp và sẽ lệch nhau ở bit đầu tiên khác nhau trong Control/Data field. Node đang phát recessive mà đọc lại thấy dominant sẽ báo <strong>Bit Error</strong> → phát Error Frame → cả khung bị hủy và truyền lại. Đây chính là lý do <strong>mỗi Identifier chỉ được phép có duy nhất một node phát</strong> trong thiết kế mạng CAN.</p></div></div>';
          } else {
            html += '<div class="callout warn">'+co("alert")+'<div class="callout-body"><p>Không có node nào tham gia.</p></div></div>';
          }
        }
        result.innerHTML = html;
      }

      function reset() { revealed = 0; if (timer) { clearInterval(timer); timer = null; } render(); }
      function stepOne() { if (revealed < WIDTH) { revealed++; render(); } }
      function run() {
        reset();
        timer = setInterval(function () {
          if (revealed >= WIDTH) { clearInterval(timer); timer = null; return; }
          revealed++; render();
        }, 420);
      }

      $("#arb-add").addEventListener("click", function () {
        if (nodes.length >= 6) return;
        var letter = String.fromCharCode(65 + nodes.length);
        nodes.push({ name: "ECU " + letter, id: (0x200 + nodes.length * 0x37).toString(16).toUpperCase(), rtr: false });
        renderNodes(); reset();
      });
      function preset(list) { nodes = list; renderNodes(); reset(); run(); }
      $("#arb-demo-rtr").addEventListener("click", function () {
        preset([
          { name: "ECU A", id: "2A0", rtr: false },
          { name: "ECU B", id: "2A0", rtr: true },
          { name: "ECU C", id: "3F1", rtr: false }
        ]);
      });
      $("#arb-demo-clash").addEventListener("click", function () {
        preset([
          { name: "ECU A", id: "180", rtr: false },
          { name: "ECU B", id: "180", rtr: false },
          { name: "ECU C", id: "4C2", rtr: false }
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
