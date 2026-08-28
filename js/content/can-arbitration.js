/* Page: CAN — Arbitration */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("can-arbitration", {
    title: "Arbitration",
    icon: "merge",
    keywords: "arbitration phan xu priority uu tien csma cr non destructive bitwise identifier collision node tranh bus",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("merge") + 'CAN Bus · Phần 4</span>' +
'<h1 class="page-title">Arbitration — phân xử khi nhiều node cùng gửi</h1>' +
'<p class="page-lead">Đây là "phép màu" của CAN: nhiều node có thể bắt đầu gửi cùng lúc, nhưng chỉ một khung thắng và được truyền trọn vẹn — không mất dữ liệu, không phải gửi lại từ đầu.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Vấn đề</h2>' +
'<p>Bus là tài nguyên dùng chung. Nếu ECU 1 và ECU 2 cùng thấy bus rảnh và cùng bắt đầu phát khung tại một thời điểm, sẽ có xung đột. Ethernet cổ điển xử lý bằng cách phát hiện va chạm rồi <em>hủy cả hai</em> và thử lại sau một khoảng ngẫu nhiên (lãng phí băng thông, thời gian không xác định). CAN làm khác — và hay hơn nhiều.</p>' +

'<h2><span class="h2-num">2</span>Nguyên lý: phân xử theo từng bit (bitwise)</h2>' +
'<p>Nhớ lại hai điều từ các phần trước:</p>' +
'<ul>' +
'<li>Bus là <strong>wired-AND</strong>: dominant (0) luôn đè recessive (1).</li>' +
'<li>Trong khi gửi, mỗi node <strong>vừa phát vừa đọc lại</strong> bus (monitoring).</li>' +
'</ul>' +
'<p>Quy tắc phân xử diễn ra trong <strong>trường Arbitration</strong> (Identifier + RTR):</p>' +
'<ol class="steps">' +
'<li>Mỗi node phát Identifier của mình, từ bit cao nhất (MSB) đến thấp nhất, đồng thời đọc lại bus.</li>' +
'<li>Nếu node phát <strong>recessive (1)</strong> nhưng đọc lại thấy <strong>dominant (0)</strong> → nghĩa là có node khác ID nhỏ hơn (ưu tiên cao hơn) đang phát. Node này <strong>thua</strong>, lập tức ngừng phát và chuyển sang chế độ nghe.</li>' +
'<li>Node nào phát bit và đọc lại đúng như mình phát thì tiếp tục.</li>' +
'<li>Đến cuối trường arbitration, chỉ còn <strong>một</strong> node "sống sót" — nó tiếp tục gửi phần còn lại của khung như thể chưa có gì xảy ra.</li>' +
'</ol>' +

'<div class="callout tip">' + co("check") +
'<div class="callout-body"><div class="callout-title">Phi phá hủy (non-destructive)</div>' +
'<p>Node thắng <em>không hề biết</em> đã có tranh chấp — khung của nó đi liền mạch. Node thua giữ nguyên khung và sẽ tự động thử lại ngay khi bus rảnh. Không byte nào bị hỏng. Đây gọi là arbitration <strong>phi phá hủy</strong>.</p></div></div>' +

'<h2><span class="h2-num">3</span>ID nhỏ = ưu tiên cao</h2>' +
'<p>Vì bit 0 là dominant và thắng bit 1, node có Identifier với <strong>giá trị số nhỏ hơn</strong> (tức nhiều bit 0 ở các vị trí cao) sẽ thắng. Do đó:</p>' +
'<div class="callout spec">' + co("target") +
'<div class="callout-body"><p><strong>Identifier vừa là "tên" của bản tin, vừa là "độ ưu tiên".</strong> ID = 0x000 là ưu tiên cao nhất có thể. Trong thiết kế hệ thống, các bản tin quan trọng/khẩn (ví dụ điều khiển động cơ, phanh) được gán ID nhỏ để luôn được ưu tiên trên bus.</p></div></div>' +

'<h2><span class="h2-num">4</span>Ví dụ minh họa</h2>' +
'<p>Ba node cùng bắt đầu gửi. Ta so sánh các bit Identifier (ví dụ 11-bit, viết ở dạng nhị phân). Ô <span style="color:#fff;background:var(--dominant);padding:1px 6px;border-radius:4px">0</span> là dominant, ô <span style="background:var(--recessive);padding:1px 6px;border-radius:4px">1</span> là recessive:</p>' +
exampleTable() +
'<p>Tại bit thứ 4, Node B và C phát recessive (1) nhưng bus đã là dominant (0) do Node A → B và C thua ngay tại đó (thực ra ở ví dụ này A có ID nhỏ nhất nên thắng). Node A tiếp tục gửi trọn khung; B và C tự động phát lại sau.</p>' +

'<div class="callout info">' + co("flask") +
'<div class="callout-body"><p><strong>Xem trực quan:</strong> <a href="#lab-arbitration">Lab: Arbitration Simulator</a> cho bạn nhập ID của nhiều node và chạy phân xử từng bit, tô sáng đúng thời điểm mỗi node thua và node nào thắng.</p></div></div>' +

'<h2><span class="h2-num">5</span>Hệ quả &amp; lưu ý</h2>' +
'<ul>' +
'<li><strong>Xác định được (deterministic):</strong> bản tin ưu tiên cao nhất luôn có độ trễ bus tối đa dự đoán được — rất quan trọng cho hệ thống thời gian thực.</li>' +
'<li><strong>Priority inversion / starvation:</strong> nếu bus quá bận với các bản tin ưu tiên cao, bản tin ưu tiên thấp có thể bị trì hoãn lâu. Thiết kế ID và tải bus phải cân nhắc điều này.</li>' +
'<li><strong>ID phải là duy nhất cho mỗi bản tin:</strong> hai node không được phát cùng một Identifier với nội dung khác nhau, vì arbitration sẽ không phân biệt được và có thể gây lỗi.</li>' +
'<li>Arbitration là lý do CAN giới hạn tốc độ theo chiều dài bus: tín hiệu phải kịp lan tới node xa nhất và dội lại <em>trong vòng một bit</em> để mọi node "nhìn thấy" cùng một mức khi lấy mẫu.</li>' +
'</ul>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>CAN nổi tiếng vì độ tin cậy. Phần <a href="#can-errors">Xử lý lỗi</a> giải thích 5 loại lỗi, bộ đếm lỗi, và cách CAN tự cô lập một node hỏng khỏi bus.</p></div></div>' +

'</div>'
      );
    }
  });

  function exampleTable() {
    var rows = [
      { name: "Node A", bits: "01000110010", win: true },
      { name: "Node B", bits: "01001100000", win: false },
      { name: "Node C", bits: "01010000000", win: false }
    ];
    var n = rows[0].bits.length;
    var html = '<div class="arb-grid"><table class="arb-table"><thead><tr><th>Node</th>';
    for (var i = 0; i < n; i++) html += "<th>b" + (n - i) + "</th>";
    html += "<th></th></tr></thead><tbody>";
    // compute bus (AND) per column
    var bus = "";
    for (var c = 0; c < n; c++) {
      var b = "1";
      rows.forEach(function (r) { if (r.bits[c] === "0") b = "0"; });
      bus += b;
    }
    rows.forEach(function (r) {
      html += "<tr" + (r.win ? ' class="winner"' : "") + '><th>' + r.name + "</th>";
      var lost = false;
      for (var c = 0; c < n; c++) {
        var mine = r.bits[c];
        if (!lost && mine === "1" && bus[c] === "0") lost = true; // loses starting this bit
        var cls = mine === "0" ? "d" : "r";
        if (lost && !(mine === "1" && bus[c] === "0")) cls += " lost";
        html += '<td class="' + cls + '">' + mine + "</td>";
      }
      html += "<td>" + (r.win ? '<span class="badge green">Thắng</span>' : '<span class="badge">Thua</span>') + "</td></tr>";
    });
    // bus row
    html += '<tr><th style="color:var(--c-brand)">Bus (AND)</th>';
    for (var c2 = 0; c2 < n; c2++) html += '<td class="' + (bus[c2] === "0" ? "d" : "r") + '">' + bus[c2] + "</td>";
    html += "<td></td></tr>";
    html += "</tbody></table></div>";
    return html;
  }
})();
