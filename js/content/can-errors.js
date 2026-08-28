/* Page: CAN — Xử lý lỗi */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("can-errors", {
    title: "Xử lý lỗi",
    icon: "shield",
    keywords: "error loi bit stuff crc form ack tec rec error active passive bus off counter fault confinement",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("shield") + 'CAN Bus · Phần 5</span>' +
'<h1 class="page-title">Phát hiện &amp; xử lý lỗi</h1>' +
'<p class="page-lead">CAN có một trong những cơ chế phát hiện lỗi mạnh nhất trong các bus nối tiếp, cùng cơ chế "cô lập lỗi" (fault confinement) tự động ngắt một node hỏng ra khỏi bus để bảo vệ hệ thống.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Năm cơ chế phát hiện lỗi</h2>' +
'<p>Mỗi node CAN kiểm tra khung theo 5 cách. Chỉ cần một cách phát hiện bất thường, node sẽ phát Error Frame để hủy khung và yêu cầu gửi lại.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Loại lỗi</th><th>Cách phát hiện</th></tr></thead><tbody>' +
'<tr><td><strong>1. Bit Error</strong></td><td>Node đang gửi đọc lại bus và thấy mức bit <em>khác</em> mức nó vừa phát (ngoài vùng arbitration và ACK slot, nơi việc bị đè là hợp lệ).</td></tr>' +
'<tr><td><strong>2. Stuff Error</strong></td><td>Xuất hiện 6 bit liên tiếp cùng mức trong vùng áp dụng bit-stuffing — vi phạm quy tắc "tối đa 5 bit giống nhau".</td></tr>' +
'<tr><td><strong>3. CRC Error</strong></td><td>Node nhận tự tính CRC trên dữ liệu nhận được và thấy <em>không khớp</em> với CRC trong khung.</td></tr>' +
'<tr><td><strong>4. Form Error</strong></td><td>Một trường có định dạng cố định (CRC delimiter, ACK delimiter, EOF…) chứa mức bit sai (ví dụ đáng lẽ recessive lại là dominant).</td></tr>' +
'<tr><td><strong>5. ACK Error</strong></td><td>Node gửi phát ACK slot recessive nhưng không node nào kéo xuống dominant → không ai xác nhận đã nhận.</td></tr>' +
'</tbody></table></div>' +
'<div class="callout spec">' + co("shield") +
'<div class="callout-body"><p>Nhờ 5 lớp kiểm tra kết hợp, xác suất một khung lỗi mà <em>không</em> bị phát hiện (residual error probability) là cực kỳ nhỏ. Đây là lý do CAN được tin dùng trong các hệ thống an toàn.</p></div></div>' +

'<h2><span class="h2-num">2</span>Error Frame &amp; cách hủy khung lỗi</h2>' +
'<p>Khi phát hiện lỗi, node phát ngay một <strong>Error Flag</strong>: 6 bit cùng mức. Việc này <em>cố ý vi phạm</em> bit-stuffing, nên mọi node khác cũng lập tức nhận ra lỗi và cùng phát Error Flag của mình (hiệu ứng lan truyền). Khung đang truyền bị hủy toàn bộ, và node gửi sẽ tự động truyền lại khi bus rảnh — <strong>việc gửi lại là tự động ở tầng phần cứng</strong>, phần mềm ứng dụng không cần can thiệp.</p>' +

'<h2><span class="h2-num">3</span>Bộ đếm lỗi: TEC &amp; REC</h2>' +
'<p>Để tránh một node hỏng "phá" cả bus (ví dụ liên tục báo lỗi giả), mỗi node duy trì hai bộ đếm:</p>' +
'<div class="def-grid">' +
'<div class="def-item"><h4><span class="def-icon">' + I("activity") + '</span>TEC</h4><p>Transmit Error Counter — đếm lỗi khi node <em>gửi</em>.</p></div>' +
'<div class="def-item"><h4><span class="def-icon">' + I("activity") + '</span>REC</h4><p>Receive Error Counter — đếm lỗi khi node <em>nhận</em>.</p></div>' +
'</div>' +
'<p>Nguyên tắc chung: gặp lỗi thì bộ đếm <strong>tăng</strong> (thường +8 cho lỗi khi gửi, +1 cho lỗi khi nhận); truyền/nhận thành công thì <strong>giảm</strong> (−1). Node gây lỗi sẽ tăng nhanh hơn node chỉ là nạn nhân — nhờ đó bus "khoanh vùng" được thủ phạm.</p>' +

'<h2><span class="h2-num">4</span>Ba trạng thái lỗi (Fault Confinement)</h2>' +
'<p>Dựa trên giá trị TEC/REC, mỗi node ở một trong ba trạng thái:</p>' +
stateDiagram() +
'<div class="table-wrap"><table class="data"><thead><tr><th>Trạng thái</th><th>Điều kiện (điển hình)</th><th>Hành vi</th></tr></thead><tbody>' +
'<tr><td><span class="badge green">Error Active</span></td><td>TEC và REC ≤ 127</td><td>Hoạt động bình thường. Khi báo lỗi thì phát <em>Active Error Flag</em> (6 bit dominant) — có thể chủ động "phá" khung lỗi trên bus.</td></tr>' +
'<tr><td><span class="badge amber">Error Passive</span></td><td>TEC hoặc REC &gt; 127</td><td>Vẫn gửi/nhận được, nhưng khi báo lỗi chỉ phát <em>Passive Error Flag</em> (6 bit recessive) — không phá được khung của node khác. Ngoài ra phải chờ thêm (suspend transmission) trước khi gửi tiếp.</td></tr>' +
'<tr><td><span class="badge red">Bus Off</span></td><td>TEC &gt; 255</td><td>Node tự <strong>ngắt hoàn toàn</strong> khỏi bus, không gửi/nhận nữa để bảo vệ hệ thống. Chỉ trở lại sau khi được khởi động lại / khôi phục theo điều kiện quy định.</td></tr>' +
'</tbody></table></div>' +

'<div class="callout warn">' + co("alert") +
'<div class="callout-body"><div class="callout-title">Ý nghĩa thực tế</div>' +
'<p>Khi chẩn đoán xe, trạng thái <strong>Bus Off</strong> của một ECU là dấu hiệu phần cứng/bus có vấn đề nghiêm trọng (đứt dây, chập, sai termination, transceiver hỏng). Nhiều công cụ hiển thị số đếm lỗi và trạng thái này để hỗ trợ tìm nguyên nhân.</p></div></div>' +

'<h2><span class="h2-num">5</span>Tóm tắt vì sao CAN đáng tin</h2>' +
'<ul>' +
'<li>5 cơ chế phát hiện lỗi độc lập → xác suất bỏ sót lỗi cực thấp.</li>' +
'<li>Tự động gửi lại khung lỗi ở tầng phần cứng.</li>' +
'<li>Bộ đếm lỗi + 3 trạng thái → tự cô lập node hỏng, không để nó kéo sập cả mạng.</li>' +
'</ul>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Bạn đã nắm trọn Classical CAN! Giờ hãy xem <a href="#canfd">CAN FD</a> nâng cấp nó thế nào để chở nhiều dữ liệu hơn và nhanh hơn.</p></div></div>' +

'</div>'
      );
    }
  });

  function stateDiagram() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 170" width="100%" style="max-width:600px;margin:0 auto" role="img" aria-label="Sơ đồ chuyển trạng thái Error Active, Error Passive, Bus Off">' +
  '<style>svg .box{rx:12;stroke-width:2}svg .st{font:700 14px var(--font-sans)}svg .sub{font:500 11px var(--font-mono)}svg .arr{stroke:var(--text-muted);stroke-width:2;fill:none;marker-end:url(#ah)}svg .al{fill:var(--text-muted);font:500 11px var(--font-sans)}</style>' +
  '<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="var(--text-muted)"/></marker></defs>' +
  // Active
  '<rect x="20" y="55" width="160" height="60" rx="12" fill="var(--c-green-soft)" stroke="var(--c-green)"/>' +
  '<text class="st" x="100" y="80" text-anchor="middle" fill="var(--c-green)">Error Active</text>' +
  '<text class="sub" x="100" y="100" text-anchor="middle" fill="var(--text-soft)">TEC,REC ≤ 127</text>' +
  // Passive
  '<rect x="240" y="55" width="160" height="60" rx="12" fill="var(--c-amber-soft)" stroke="var(--c-amber)"/>' +
  '<text class="st" x="320" y="80" text-anchor="middle" fill="var(--c-amber)">Error Passive</text>' +
  '<text class="sub" x="320" y="100" text-anchor="middle" fill="var(--text-soft)">&gt; 127</text>' +
  // Bus off
  '<rect x="460" y="55" width="160" height="60" rx="12" fill="var(--c-red-soft)" stroke="var(--c-red)"/>' +
  '<text class="st" x="540" y="80" text-anchor="middle" fill="var(--c-red)">Bus Off</text>' +
  '<text class="sub" x="540" y="100" text-anchor="middle" fill="var(--text-soft)">TEC &gt; 255</text>' +
  // arrows forward
  '<path class="arr" d="M180,72 L240,72"/><text class="al" x="210" y="64" text-anchor="middle">lỗi ↑</text>' +
  '<path class="arr" d="M400,72 L460,72"/><text class="al" x="430" y="64" text-anchor="middle">lỗi ↑</text>' +
  // arrows backward (recover)
  '<path class="arr" d="M240,98 L180,98"/><text class="al" x="210" y="112" text-anchor="middle">hồi phục ↓</text>' +
  '<path class="arr" d="M540,120 C540,150 100,150 100,120" /><text class="al" x="320" y="147" text-anchor="middle">reset / khôi phục</text>' +
'</svg></figure>'
    );
  }
})();
