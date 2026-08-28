/* Page: UDS — Security Access */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("uds-security", {
    title: "Security Access",
    icon: "lock",
    keywords: "security access 0x27 seed key requestseed sendkey level odd even 0x33 0x35 0x36 0x37 unlock khoa bao mat",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("lock") + 'UDS · Phần 4</span>' +
'<h1 class="page-title">Security Access (0x27) — seed &amp; key</h1>' +
'<p class="page-lead">Nhiều thao tác nhạy cảm (ghi dữ liệu, flashing) chỉ được phép sau khi client chứng minh mình "có quyền". UDS làm điều này bằng cơ chế thách thức–đáp (challenge–response) gọi là seed &amp; key.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Ý tưởng: thách thức &amp; đáp</h2>' +
'<p>Thay vì gửi mật khẩu trực tiếp (dễ bị nghe lén trên bus), UDS dùng cơ chế 2 bước:</p>' +
'<ol class="steps">' +
'<li><strong>Request Seed:</strong> Client hỏi ECU "cho tôi một con số ngẫu nhiên" (seed). ECU trả về seed.</li>' +
'<li><strong>Send Key:</strong> Client dùng một <em>thuật toán bí mật</em> biến đổi seed thành key, rồi gửi key lên. ECU cũng tự tính key từ seed đó; nếu khớp → mở khóa.</li>' +
'</ol>' +
'<p>Vì key phụ thuộc seed (thay đổi mỗi lần), kẻ nghe lén không thể "phát lại" (replay) key cũ. Chỉ ai biết thuật toán mới tính đúng key.</p>' +

diagramSeedKey() +

'<h2><span class="h2-num">2</span>Sub-function: level lẻ &amp; chẵn</h2>' +
'<p>Dịch vụ <code>0x27</code> dùng sub-function theo cặp cho mỗi "mức" (security level):</p>' +
'<ul>' +
'<li><strong>Số lẻ</strong> (<code>0x01, 0x03, 0x05…</code>) = <em>requestSeed</em>.</li>' +
'<li><strong>Số chẵn</strong> kế tiếp (<code>0x02, 0x04, 0x06…</code>) = <em>sendKey</em>.</li>' +
'</ul>' +
'<p>Ví dụ cặp <code>0x01/0x02</code> là level 1. Một ECU có thể có nhiều level với quyền khác nhau (ví dụ level cho ghi dữ liệu, level cao hơn cho flashing).</p>' +

'<div class="table-wrap"><table class="data"><thead><tr><th>Bước</th><th>Request</th><th>Response (thành công)</th></tr></thead><tbody>' +
'<tr><td>Request seed (level 1)</td><td class="mono">27 01</td><td class="mono">67 01 &lt;seed…&gt;</td></tr>' +
'<tr><td>Send key (level 1)</td><td class="mono">27 02 &lt;key…&gt;</td><td class="mono">67 02</td></tr>' +
'</tbody></table></div>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Nhớ quy tắc +0x40: response của <code>0x27</code> là <code>0x67</code>. Khi request seed mà ECU đã mở khóa sẵn, ECU thường trả seed = 0 (báo "đã mở, không cần key").</p></div></div>' +

'<h2><span class="h2-num">3</span>Các NRC đặc trưng của Security Access</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>NRC</th><th>Tên</th><th>Khi nào gặp</th></tr></thead><tbody>' +
'<tr><td><code>0x33</code></td><td>securityAccessDenied</td><td>Cố dùng dịch vụ cần quyền khi chưa mở khóa; hoặc gửi key khi chưa request seed.</td></tr>' +
'<tr><td><code>0x35</code></td><td>invalidKey</td><td>Key gửi lên không khớp với key ECU tính ra.</td></tr>' +
'<tr><td><code>0x36</code></td><td>exceedNumberOfAttempts</td><td>Gửi sai key quá số lần cho phép → ECU tạm khóa.</td></tr>' +
'<tr><td><code>0x37</code></td><td>requiredTimeDelayNotExpired</td><td>Sau khi bị khóa vì sai nhiều lần, phải chờ hết thời gian trễ mới được thử lại.</td></tr>' +
'</tbody></table></div>' +

'<div class="callout danger">' + co("shield") +
'<div class="callout-body"><div class="callout-title">Cơ chế chống dò key (brute-force)</div>' +
'<p>Sự kết hợp <code>0x36</code> + <code>0x37</code> là "chốt chặn": sau vài lần sai key, ECU khóa và bắt chờ (delay timer). Điều này khiến việc thử vét cạn key trở nên bất khả thi trong thực tế. Một số ECU còn tăng thời gian chờ theo cấp số nhân sau mỗi lần thất bại.</p></div></div>' +

'<h2><span class="h2-num">4</span>Thuật toán seed→key</h2>' +
'<p>Tiêu chuẩn ISO 14229 <em>không</em> quy định thuật toán cụ thể — mỗi hãng/ECU tự định nghĩa và giữ bí mật. Thuật toán có thể đơn giản (phép XOR, cộng hằng số, dịch bit) hoặc phức tạp (mật mã như AES với khóa bí mật).</p>' +
'<div class="callout warn">' + co("key") +
'<div class="callout-body"><div class="callout-title">Trong lab của chúng ta</div>' +
'<p>Vì không có thuật toán thật, <a href="#lab-uds">UDS Simulator</a> dùng một thuật toán demo <em>công khai</em> để bạn thực hành trọn vẹn quy trình: <code>key = ((seed XOR 0xA5A5A5A5) + 0x5A5A5A5A) rồi xoay bit</code>. Lab sẽ hiện gợi ý key đúng để bạn thấy luồng seed→key→unlock hoạt động. Đây chỉ nhằm mục đích học tập, không phản ánh thuật toán của bất kỳ hãng nào.</p></div></div>' +

'<h2><span class="h2-num">5</span>Vì sao có Security Access?</h2>' +
'<ul>' +
'<li><strong>An toàn:</strong> ngăn thao tác nguy hiểm (tắt hệ thống an toàn, ghi sai cấu hình) bởi người/thiết bị không đủ quyền.</li>' +
'<li><strong>Chống can thiệp trái phép:</strong> bảo vệ firmware và cấu hình khỏi bị chỉnh sửa (chống tuning/độ trái phép, chống gian lận odometer…).</li>' +
'<li><strong>Bảo mật (cybersecurity):</strong> là một lớp phòng thủ trong kiến trúc an ninh của xe.</li>' +
'</ul>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Còn một mảnh ghép cuối: làm sao gửi các message UDS dài hơn 8 byte qua CAN? Câu trả lời là <a href="#isotp">ISO-TP</a>.</p></div></div>' +

'</div>'
      );
    }
  });

  function diagramSeedKey() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 200" width="100%" style="max-width:620px;margin:0 auto" role="img" aria-label="Sơ đồ trao đổi seed và key giữa Tester và ECU">' +
  '<style>svg .t{font:700 13px var(--font-sans)}svg .m{font:600 12px var(--font-mono)}svg .n{font:500 11px var(--font-sans);fill:var(--text-muted)}</style>' +
  '<defs><marker id="ak1" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="var(--c-blue)"/></marker>'+
  '<marker id="ak2" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="var(--c-green)"/></marker></defs>' +
  '<rect x="20" y="20" width="140" height="44" rx="10" fill="var(--c-brand-soft)" stroke="var(--c-brand)"/><text class="t" x="90" y="47" text-anchor="middle" fill="var(--c-brand-strong)">Tester</text>' +
  '<rect x="480" y="20" width="140" height="44" rx="10" fill="var(--c-accent-soft)" stroke="var(--c-accent)"/><text class="t" x="550" y="47" text-anchor="middle" fill="var(--c-accent)">ECU</text>' +
  '<line x1="90" y1="64" x2="90" y2="190" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  '<line x1="550" y1="64" x2="550" y2="190" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  '<path d="M92,88 L548,88" stroke="var(--c-blue)" stroke-width="2" marker-end="url(#ak1)"/><text class="m" x="320" y="82" text-anchor="middle" fill="var(--c-blue)">27 01 (request seed)</text>' +
  '<path d="M548,116 L92,116" stroke="var(--c-green)" stroke-width="2" marker-end="url(#ak2)"/><text class="m" x="320" y="110" text-anchor="middle" fill="var(--c-green)">67 01 &lt;seed&gt;</text>' +
  '<text class="n" x="90" y="140" text-anchor="middle">key = f(seed)</text>' +
  '<path d="M92,160 L548,160" stroke="var(--c-blue)" stroke-width="2" marker-end="url(#ak1)"/><text class="m" x="320" y="154" text-anchor="middle" fill="var(--c-blue)">27 02 &lt;key&gt;</text>' +
  '<text class="n" x="550" y="184" text-anchor="middle">so khớp → 67 02</text>' +
'</svg></figure>'
    );
  }
})();
