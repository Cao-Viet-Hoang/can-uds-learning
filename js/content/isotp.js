/* Page: ISO-TP */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("isotp", {
    title: "ISO-TP (phân mảnh)",
    icon: "stack",
    keywords: "iso-tp iso 15765-2 transport protocol single frame first frame consecutive frame flow control pci block size stmin segmentation phan manh network layer",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("stack") + 'UDS · Phần 5 · Transport Layer</span>' +
'<h1 class="page-title">ISO-TP — gửi dữ liệu dài qua CAN</h1>' +
'<p class="page-lead">Một khung CAN chỉ chở tối đa 8 byte (CAN FD: 64 byte). Nhưng một VIN đã 17 byte, một response DTC có thể hàng trăm byte. ISO-TP (ISO 15765-2) là "tầng vận chuyển" chia nhỏ và ghép lại các message dài.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Vấn đề &amp; giải pháp</h2>' +
'<p>UDS message thường dài hơn 8 byte. ISO-TP (còn gọi ISO 15765-2, hay "Transport Protocol") giải quyết bằng cách <strong>phân mảnh (segmentation)</strong>: bên gửi cắt message thành nhiều khung CAN, bên nhận ghép lại. Nó nằm giữa UDS (tầng trên) và CAN (tầng dưới).</p>' +

'<h2><span class="h2-num">2</span>PCI &amp; bốn loại khung ISO-TP</h2>' +
'<p>ISO-TP dùng những byte đầu của phần dữ liệu CAN làm <strong>PCI (Protocol Control Information)</strong> — cho biết đây là loại khung gì. <em>Nibble</em> (4 bit) cao của byte PCI đầu tiên xác định loại:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Loại</th><th>PCI nibble</th><th>Dùng khi</th></tr></thead><tbody>' +
'<tr><td><strong>Single Frame (SF)</strong></td><td><code>0x0</code></td><td>Message đủ ngắn để nhét trong 1 khung.</td></tr>' +
'<tr><td><strong>First Frame (FF)</strong></td><td><code>0x1</code></td><td>Khung đầu tiên của một message dài (cần nhiều khung).</td></tr>' +
'<tr><td><strong>Consecutive Frame (CF)</strong></td><td><code>0x2</code></td><td>Các khung tiếp theo chở phần còn lại của message.</td></tr>' +
'<tr><td><strong>Flow Control (FC)</strong></td><td><code>0x3</code></td><td>Bên nhận gửi lại để điều tiết luồng (cho phép/tạm dừng, tốc độ).</td></tr>' +
'</tbody></table></div>' +

'<h3>Single Frame (SF)</h3>' +
'<p>Byte 0 = <code>0x0L</code> với <code>L</code> = số byte dữ liệu (≤ 7 với CAN cổ điển). Các byte sau là dữ liệu.</p>' +
'<pre class="code"><span class="cmt"># Ví dụ: request đọc VIN "22 F1 90" (3 byte)</span>\n<span class="n">03</span> 22 F1 90 00 00 00 00\n<span class="cmt"># 03 = SF, độ dài 3; theo sau là 22 F1 90; phần dư đệm 00 (padding)</span></pre>' +

'<h3>First Frame (FF)</h3>' +
'<p>Byte 0–1 = <code>0x1LLL</code>: nibble 1 báo FF, 12 bit còn lại là <strong>tổng độ dài</strong> message (tới 4095 byte). 6 byte còn lại là phần dữ liệu đầu tiên.</p>' +
'<pre class="code"><span class="cmt"># Ví dụ: message dài 0x013 = 19 byte</span>\n<span class="n">10 13</span> 62 F1 90 57 30 4C\n<span class="cmt"># 1=FF, 013=19 byte tổng; rồi 6 byte data đầu tiên</span></pre>' +

'<h3>Flow Control (FC)</h3>' +
'<p>Sau khi nhận FF, bên nhận gửi FC để nói "gửi tiếp đi": byte 0 = <code>0x3S</code> (S = Flow Status), byte 1 = <strong>Block Size (BS)</strong>, byte 2 = <strong>STmin</strong>.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Tham số</th><th>Ý nghĩa</th></tr></thead><tbody>' +
'<tr><td>Flow Status</td><td><code>0</code>=Continue To Send (CTS), <code>1</code>=Wait, <code>2</code>=Overflow/abort.</td></tr>' +
'<tr><td>Block Size (BS)</td><td>Số CF được gửi liên tiếp trước khi cần một FC mới. <code>0</code> = gửi hết không cần chờ.</td></tr>' +
'<tr><td>STmin</td><td>Khoảng thời gian tối thiểu giữa hai CF (0x00–0x7F = 0–127 ms; 0xF1–0xF9 = 100–900 µs).</td></tr>' +
'</tbody></table></div>' +

'<h3>Consecutive Frame (CF)</h3>' +
'<p>Byte 0 = <code>0x2N</code> với <code>N</code> = <strong>số thứ tự (sequence number)</strong>, bắt đầu từ 1 và chạy vòng 1→15→0→1... (ISO 15765-2 quy định CF đầu tiên luôn có N=1, không phải 0). Bên nhận dùng N để phát hiện mất/lộn khung. 7 byte còn lại là dữ liệu.</p>' +
'<pre class="code"><span class="cmt"># Các consecutive frame nối tiếp nhau</span>\n<span class="n">21</span> 30 39 42 4E ...   <span class="cmt"># CF số 1</span>\n<span class="n">22</span> 34 35 36 ...      <span class="cmt"># CF số 2</span></pre>' +

'<h2><span class="h2-num">3</span>Toàn bộ luồng một message dài</h2>' +
diagramFlow() +

'<h2><span class="h2-num">4</span>Địa chỉ CAN cho ISO-TP</h2>' +
'<p>Trên CAN, request và response dùng hai CAN ID khác nhau. Một quy ước phổ biến (OBD-II, 11-bit) là:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Hướng</th><th>CAN ID (ví dụ)</th></tr></thead><tbody>' +
'<tr><td>Tester → ECU (request, physical)</td><td><code>0x7E0</code></td></tr>' +
'<tr><td>ECU → Tester (response)</td><td><code>0x7E8</code></td></tr>' +
'<tr><td>Functional (broadcast tới nhiều ECU)</td><td><code>0x7DF</code></td></tr>' +
'</tbody></table></div>' +
'<p class="muted">Các hệ thống 29-bit dùng định địa chỉ mở rộng (normal fixed / extended addressing) theo ISO 15765-2.</p>' +

'<div class="callout tip">' + co("check") +
'<div class="callout-body"><div class="callout-title">Với người mới: cần nhớ gì?</div>' +
'<p>1) Message ngắn → 1 Single Frame. 2) Message dài → First Frame, rồi bên nhận gửi Flow Control, rồi các Consecutive Frame nối tiếp. 3) Bên nhận ghép lại theo sequence number. Chỉ cần nắm ý này là đủ hiểu log UDS dài.</p></div></div>' +

'<div class="callout spec">' + co("zap") +
'<div class="callout-body"><div class="callout-title">Nâng cao (ghi chú để mở rộng)</div>' +
'<p>Trên <strong>CAN FD</strong>, một Single Frame có thể chứa tới 62 byte (vì payload 64 byte), nên nhiều message UDS không cần phân mảnh nữa. ISO-TP trên CAN FD dùng thêm escape byte cho độ dài SF/FF lớn. Các cơ chế nâng cao khác: timeout N_As/N_Bs/N_Cr, xử lý FC "Wait", extended/mixed addressing.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Hoàn thành phần lý thuyết!</span>' +
'<p>Bạn đã đi hết chặng đường từ bit trên dây (CAN) đến câu lệnh chẩn đoán (UDS). Giờ là lúc thực hành: hãy mở nhóm <a href="#lab-can">Labs</a> để tự tay dựng khung, chạy arbitration và gửi request tới ECU ảo.</p></div></div>' +

'</div>'
      );
    }
  });

  function diagramFlow() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 250" width="100%" style="max-width:620px;margin:0 auto" role="img" aria-label="Sơ đồ luồng ISO-TP multi frame với First Frame, Flow Control và Consecutive Frame">' +
  '<style>svg .t{font:700 13px var(--font-sans)}svg .m{font:600 11px var(--font-mono)}svg .n{font:500 10px var(--font-sans);fill:var(--text-muted)}</style>' +
  '<defs><marker id="af1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-blue)"/></marker>'+
  '<marker id="af2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-green)"/></marker></defs>' +
  '<rect x="20" y="16" width="130" height="40" rx="10" fill="var(--c-brand-soft)" stroke="var(--c-brand)"/><text class="t" x="85" y="41" text-anchor="middle" fill="var(--c-brand-strong)">Sender</text>' +
  '<rect x="490" y="16" width="130" height="40" rx="10" fill="var(--c-accent-soft)" stroke="var(--c-accent)"/><text class="t" x="555" y="41" text-anchor="middle" fill="var(--c-accent)">Receiver</text>' +
  '<line x1="85" y1="56" x2="85" y2="240" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  '<line x1="555" y1="56" x2="555" y2="240" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  arrow(80,255,"10 13 62 F1 90 ..","First Frame","var(--c-blue)","af1",true) +
  arrow(120,555,"30 00 00","Flow Control (CTS, BS=0)","var(--c-green)","af2",false) +
  arrow(160,255,"21 30 39 42 ..","Consecutive Frame #1","var(--c-blue)","af1",true) +
  arrow(195,255,"22 34 35 36 ..","Consecutive Frame #2","var(--c-blue)","af1",true) +
  arrow(230,255,"23 ...","Consecutive Frame #3","var(--c-blue)","af1",true) +
'</svg></figure>'
    );
  }
  function arrow(y, endx, hex, label, color, marker, ltr) {
    var x1 = ltr ? 87 : 553, x2 = ltr ? 553 : 87;
    var tx = 320;
    return '<path d="M'+x1+','+y+' L'+x2+','+y+'" stroke="'+color+'" stroke-width="2" marker-end="url(#'+marker+')"/>' +
      '<text class="m" x="'+tx+'" y="'+(y-4)+'" text-anchor="middle" fill="'+color+'">'+hex+'</text>' +
      '<text class="n" x="'+tx+'" y="'+(y+10)+'" text-anchor="middle">'+label+'</text>';
  }
})();
