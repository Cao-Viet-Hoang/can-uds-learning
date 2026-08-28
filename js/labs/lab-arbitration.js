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
'<div class="node-head"><span>Tên</span><span>Identifier (hex)</span></div>' +
'<div id="arb-nodes"></div>' +
'<div class="btn-row" style="margin-top:14px"><button class="btn sm" id="arb-add">' + I("plus") + 'Thêm node</button></div>' +
'<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">' +
'<div class="btn-row">' +
'<button class="btn primary" id="arb-run">' + I("play") + 'Chạy tự động</button>' +
'<button class="btn" id="arb-step">' + I("step") + 'Từng bit</button>' +
'<button class="btn" id="arb-reset">' + I("refresh") + 'Đặt lại</button>' +
'</div>' +
'<div id="arb-result"></div>' +
'</div></div>' +

'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Quy tắc: mỗi cột là 1 bit của trường Arbitration (từ MSB). Bus = AND của tất cả node còn đang phát (dominant 0 thắng recessive 1). Node phát recessive (1) mà bus là dominant (0) sẽ bị loại ngay từ bit đó (ô mờ đi). Node có ID nhỏ nhất thường thắng vì có nhiều bit 0 ở đầu.</p></div></div>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ôn lại lý thuyết</div><p>Xem <a href="#can-arbitration">Arbitration</a> để hiểu nguyên lý phi phá hủy trước khi thử.</p></div></div>' +

'</div>'
      );
    },
    init: function (root) {
      var $ = function (s) { return root.querySelector(s); };
      var nodesWrap = $("#arb-nodes");
      var result = $("#arb-result");
      var WIDTH = 11;
      var nodes = [
        { name: "ECU A", id: "123" },
        { name: "ECU B", id: "1A0" },
        { name: "ECU C", id: "0F5" }
      ];
      var revealed = 0;      // number of bit-columns revealed
      var timer = null;

      function renderNodes() {
        nodesWrap.innerHTML = nodes.map(function (n, i) {
          // Labels live once in .node-head above — repeating "Tên / Identifier"
          // on every row tripled the text for no added meaning.
          return '<div class="node-row">' +
            '<input class="input" data-name="'+i+'" value="'+APP.esc(n.name)+'" style="font-family:var(--font-sans)">' +
            '<input class="input" data-id="'+i+'" value="'+APP.esc(n.id)+'" spellcheck="false">' +
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
          inp.addEventListener("input", function () { nodes[+inp.getAttribute("data-name")].name = inp.value; });
        });
        nodesWrap.querySelectorAll("[data-del]").forEach(function (b) {
          b.addEventListener("click", function () { nodes.splice(+b.getAttribute("data-del"), 1); renderNodes(); reset(); });
        });
      }

      function idBits(hex) {
        var v = parseInt(hex || "0", 16) & 0x7ff;
        var s = v.toString(2); while (s.length < WIDTH) s = "0" + s;
        return s.split("").map(Number);
      }

      function compute() {
        var mats = nodes.map(function (n) { return { name: n.name, bits: idBits(n.id), val: parseInt(n.id||"0",16)&0x7ff, lostAt: -1 }; });
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
        var winners = mats.filter(function (m) { return m.lostAt === -1; });
        return { mats: mats, bus: bus, winner: winners[0] };
      }

      function render() {
        var m = compute();
        var html = '<div class="arb-grid"><table class="arb-table"><thead><tr><th>Node</th>';
        for (var i = 0; i < WIDTH; i++) html += '<th>b'+(WIDTH-i)+'</th>';
        html += '<th>Trạng thái</th></tr></thead><tbody>';
        m.mats.forEach(function (n) {
          var isWinner = m.winner && n.name === m.winner.name && n.lostAt === -1;
          html += '<tr'+(isWinner?' class="winner"':'')+'><th>'+APP.esc(n.name)+'</th>';
          for (var c = 0; c < WIDTH; c++) {
            var shown = c < revealed;
            var cls = n.bits[c] === 0 ? "d" : "r";
            var lost = n.lostAt !== -1 && c >= n.lostAt;
            if (lost) cls += " lost";
            html += '<td class="'+(shown?cls:"")+'" style="'+(shown?"":"opacity:.15")+'">'+(shown?n.bits[c]:"")+'</td>';
          }
          var status = n.lostAt === -1
            ? (revealed >= WIDTH ? '<span class="badge green">Thắng</span>' : '<span class="badge brand">Đang tranh</span>')
            : (n.lostAt < revealed ? '<span class="badge red">Thua @ b'+(WIDTH-n.lostAt)+'</span>' : '<span class="badge">—</span>');
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

        if (revealed >= WIDTH && m.winner) {
          html += '<div class="callout tip">'+co("check")+'<div class="callout-body"><div class="callout-title">'+APP.esc(m.winner.name)+' thắng arbitration</div>' +
            '<p>ID = 0x'+m.winner.val.toString(16).toUpperCase().padStart(3,"0")+' là giá trị nhỏ nhất → ưu tiên cao nhất. Node này tiếp tục truyền trọn khung; các node thua sẽ tự động phát lại khi bus rảnh (phi phá hủy).</p></div></div>';
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
        nodes.push({ name: "ECU " + letter, id: (0x200 + nodes.length * 0x37).toString(16).toUpperCase() });
        renderNodes(); reset();
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
