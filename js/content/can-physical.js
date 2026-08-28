/* Page: CAN — Lớp vật lý */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("can-physical", {
    title: "Lớp vật lý",
    icon: "wave",
    keywords: "physical layer lop vat ly dominant recessive differential can_h can_l dien ap termination 120 ohm twisted pair nrz bit timing",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("wave") + 'CAN Bus · Phần 2</span>' +
'<h1 class="page-title">Lớp vật lý: dominant &amp; recessive</h1>' +
'<p class="page-lead">Đây là khái niệm nền tảng nhất của CAN. Hiểu được dominant/recessive, bạn sẽ hiểu vì sao arbitration hoạt động, vì sao ACK hoạt động, và vì sao CAN chống lỗi tốt.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Cặp dây &amp; tín hiệu vi sai</h2>' +
'<p>High-speed CAN dùng <strong>hai dây</strong> xoắn vào nhau (twisted pair): <strong>CAN_H</strong> (CAN High) và <strong>CAN_L</strong> (CAN Low). Thông tin không nằm ở điện áp tuyệt đối của từng dây, mà ở <strong>hiệu điện thế giữa hai dây</strong> (V<sub>diff</sub> = V<sub>CAN_H</sub> − V<sub>CAN_L</sub>). Đây gọi là <strong>tín hiệu vi sai (differential signaling)</strong>.</p>' +
'<p>Ưu điểm: khi có nhiễu điện từ, nó tác động gần như bằng nhau lên cả hai dây, nên <em>hiệu</em> giữa chúng gần như không đổi. Nhờ vậy CAN rất chống nhiễu — lý tưởng cho môi trường "bẩn" về điện như khoang động cơ ô tô.</p>' +

diagramDiff() +

'<h2><span class="h2-num">2</span>Dominant vs Recessive — trái tim của CAN</h2>' +
'<p>CAN định nghĩa hai trạng thái bus, và đây là điểm mấu chốt khiến CAN khác biệt:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Trạng thái bus</th><th>Mức logic</th><th>Điện áp (High-speed CAN, điển hình)</th><th>V<sub>diff</sub></th></tr></thead><tbody>' +
'<tr><td><strong>Dominant</strong> (trội)</td><td>Logic <code>0</code></td><td>CAN_H ≈ 3.5 V, CAN_L ≈ 1.5 V</td><td>≈ <strong>2 V</strong> (khác biệt rõ)</td></tr>' +
'<tr><td><strong>Recessive</strong> (lặn)</td><td>Logic <code>1</code></td><td>CAN_H ≈ CAN_L ≈ 2.5 V</td><td>≈ <strong>0 V</strong></td></tr>' +
'</tbody></table></div>' +

'<div class="callout warn">' + co("alert") +
'<div class="callout-body"><div class="callout-title">Quy tắc "wired-AND" — ghi nhớ suốt đời</div>' +
'<p>Bus là một mạch kiểu <strong>wired-AND</strong>: nếu <em>bất kỳ</em> node nào phát mức <strong>dominant (0)</strong>, thì toàn bus sẽ là dominant, bất kể các node khác phát gì. Bus chỉ ở mức <strong>recessive (1)</strong> khi <em>tất cả</em> node đều phát recessive.</p>' +
'<p><strong>Dominant luôn "đè" được recessive.</strong> Chính đặc tính này làm cho arbitration, ACK và báo lỗi của CAN hoạt động. Hãy nhớ: 0 thắng 1.</p></div></div>' +

'<h2><span class="h2-num">3</span>Vì sao gọi là 0 "trội" và 1 "lặn"?</h2>' +
'<p>Hãy tưởng tượng bus như một căn phòng, mọi người mặc định giữ im lặng (recessive = 1). Chỉ cần một người lên tiếng (dominant = 0) thì cả phòng "nghe thấy" tiếng nói đó — tiếng nói (0) áp đảo sự im lặng (1). Muốn phòng im lặng trở lại, mọi người phải cùng im. Đó chính là logic wired-AND.</p>' +

'<h2><span class="h2-num">4</span>Điện trở đầu cuối (termination) 120 Ω</h2>' +
'<p>Bus CAN là một đường truyền (transmission line). Nếu để hở hai đầu, tín hiệu tốc độ cao sẽ bị <strong>phản xạ</strong> dội ngược lại gây méo dạng. Để chống hiện tượng này, người ta gắn <strong>điện trở đầu cuối 120 Ω</strong> ở <em>mỗi đầu</em> của bus (tổng trở song song ≈ 60 Ω).</p>' +
diagramBus() +
'<div class="callout danger">' + co("alert") +
'<div class="callout-body"><div class="callout-title">Lỗi thực tế thường gặp</div>' +
'<p>Thiếu điện trở đầu cuối, hoặc gắn sai vị trí (giữa bus thay vì hai đầu), hoặc chỉ có một điện trở — đều gây lỗi truyền thông chập chờn rất khó chẩn đoán. Khi đo điện trở giữa CAN_H và CAN_L (khi tắt nguồn), giá trị đúng phải xấp xỉ <strong>60 Ω</strong>.</p></div></div>' +

'<h2><span class="h2-num">5</span>Mã hóa bit: NRZ &amp; đồng bộ</h2>' +
'<p>CAN mã hóa bit theo kiểu <strong>NRZ (Non-Return-to-Zero)</strong>: mức tín hiệu giữ nguyên trong suốt thời gian một bit; không có xung "trở về 0" giữa các bit. NRZ tiết kiệm băng thông nhưng có nhược điểm: nếu truyền nhiều bit giống nhau liên tiếp thì không có cạnh (edge) chuyển mức để bên nhận đồng bộ đồng hồ.</p>' +
'<p>CAN giải quyết bằng <strong>bit-stuffing</strong>: cứ sau 5 bit giống nhau liên tiếp, bên gửi tự chèn 1 bit ngược lại để tạo cạnh đồng bộ (sẽ nói kỹ ở phần khung &amp; lab). CAN không có dây clock riêng — các node <strong>tự đồng bộ</strong> dựa trên các cạnh tín hiệu trên bus (self-clocking).</p>' +

'<div class="callout spec">' + co("clock") +
'<div class="callout-body"><div class="callout-title">Bit time gồm nhiều "time quanta"</div>' +
'<p>Thời lượng một bit được chia thành các đoạn: <em>Sync_Seg</em>, <em>Prop_Seg</em>, <em>Phase_Seg1</em>, <em>Phase_Seg2</em>. Điểm lấy mẫu (sample point) nằm giữa Phase_Seg1 và Phase_Seg2, thường đặt ở ~75–87.5% của bit. Việc cấu hình các đoạn này quyết định tốc độ baud và khả năng chịu sai lệch clock giữa các node. Đây là phần nâng cao — chỉ cần biết khái niệm ở mức này là đủ cho người mới.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Giờ ta đã có "bảng chữ cái" (bit 0/1). Phần <a href="#can-frame">Cấu trúc khung</a> sẽ ghép các bit này thành một bản tin CAN hoàn chỉnh.</p></div></div>' +

'</div>'
      );
    }
  });

  /* ---- Inline SVG diagrams (theme-aware via currentColor & CSS vars) ---- */
  function diagramDiff() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 240" width="100%" style="max-width:640px;margin:0 auto" role="img" aria-label="Biểu đồ điện áp CAN_H và CAN_L cho trạng thái recessive và dominant">' +
  '<style>svg .axis{stroke:var(--border-strong);stroke-width:1.5}svg .gl{stroke:var(--border);stroke-width:1;stroke-dasharray:3 3}svg .txt{fill:var(--text-soft);font:500 12px var(--font-sans)}svg .lbl{fill:var(--text);font:700 13px var(--font-sans)}svg .h{stroke:#dc2626;stroke-width:3;fill:none}svg .l{stroke:#2563eb;stroke-width:3;fill:none}svg .reg{fill:var(--surface-2)}</style>' +
  // axes
  '<line class="axis" x1="70" y1="20" x2="70" y2="190"/>' +
  '<line class="axis" x1="70" y1="190" x2="610" y2="190"/>' +
  // voltage gridlines
  '<line class="gl" x1="70" y1="60" x2="610" y2="60"/><text class="txt" x="30" y="64">3.5V</text>' +
  '<line class="gl" x1="70" y1="105" x2="610" y2="105"/><text class="txt" x="30" y="109">2.5V</text>' +
  '<line class="gl" x1="70" y1="150" x2="610" y2="150"/><text class="txt" x="30" y="154">1.5V</text>' +
  // region shading for dominant
  '<rect class="reg" x="250" y="20" width="150" height="170" opacity="0.5"/>' +
  '<rect class="reg" x="480" y="20" width="130" height="170" opacity="0.5"/>' +
  // CAN_H line
  '<path class="h" d="M70,105 L250,105 L250,60 L400,60 L400,105 L480,105 L480,60 L610,60"/>' +
  // CAN_L line
  '<path class="l" d="M70,105 L250,105 L250,150 L400,150 L400,105 L480,105 L480,150 L610,150"/>' +
  // state labels
  '<text class="lbl" x="130" y="215" text-anchor="middle">Recessive (1)</text>' +
  '<text class="lbl" x="325" y="215" text-anchor="middle">Dominant (0)</text>' +
  '<text class="lbl" x="440" y="215" text-anchor="middle">Recessive (1)</text>' +
  '<text class="lbl" x="545" y="215" text-anchor="middle">Dominant (0)</text>' +
  // legend
  '<circle cx="470" cy="30" r="5" fill="#dc2626"/><text class="txt" x="480" y="34">CAN_H</text>' +
  '<circle cx="545" cy="30" r="5" fill="#2563eb"/><text class="txt" x="555" y="34">CAN_L</text>' +
'</svg><figcaption>Ở trạng thái dominant, hai dây tách xa nhau (V<sub>diff</sub>≈2V). Ở recessive, hai dây về cùng ~2.5V (V<sub>diff</sub>≈0V).</figcaption></figure>'
    );
  }
  function diagramBus() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 200" width="100%" style="max-width:640px;margin:0 auto" role="img" aria-label="Sơ đồ bus CAN tuyến tính với hai điện trở đầu cuối 120 ohm">' +
  '<style>svg .wire{stroke:var(--text-soft);stroke-width:2.5;fill:none}svg .wireL{stroke:var(--c-blue);stroke-width:2.5;fill:none}svg .wireH{stroke:var(--c-red);stroke-width:2.5;fill:none}svg .node{fill:var(--bg-elev);stroke:var(--c-brand);stroke-width:2}svg .ntxt{fill:var(--text);font:600 12px var(--font-sans)}svg .res{fill:none;stroke:var(--c-amber);stroke-width:2.5}svg .rtxt{fill:var(--c-amber);font:700 12px var(--font-mono)}svg .stub{stroke:var(--border-strong);stroke-width:2}</style>' +
  // main bus lines
  '<line class="wireH" x1="60" y1="80" x2="580" y2="80"/>' +
  '<line class="wireL" x1="60" y1="110" x2="580" y2="110"/>' +
  '<text class="rtxt" x="60" y="70" fill="var(--c-red)">CAN_H</text>' +
  '<text class="rtxt" x="60" y="128" fill="var(--c-blue)">CAN_L</text>' +
  // terminators (zig-zag resistor) left
  '<path class="res" d="M60,80 v6 M60,86 l6,-4 -12,-6 12,-6 -12,-6 6,-4 v-6 M60,110 v-6"/>' +
  '<line class="res" x1="60" y1="80" x2="60" y2="86"/><line class="res" x1="60" y1="104" x2="60" y2="110"/>' +
  '<rect x="52" y="86" width="16" height="18" class="res"/><text class="rtxt" x="8" y="99">120Ω</text>' +
  // terminator right
  '<line class="res" x1="580" y1="80" x2="580" y2="86"/><line class="res" x1="580" y1="104" x2="580" y2="110"/>' +
  '<rect x="572" y="86" width="16" height="18" class="res"/><text class="rtxt" x="594" y="99">120Ω</text>' +
  // nodes with short stubs
  node(160,"ECU 1") + node(300,"ECU 2") + node(440,"ECU 3") +
'</svg><figcaption>Topology tuyến tính (bus/backbone). Điện trở 120Ω gắn ở HAI đầu, các node nối vào bằng nhánh (stub) ngắn.</figcaption></figure>'
    );
  }
  function node(x, label) {
    return (
      '<line class="stub" x1="' + x + '" y1="80" x2="' + x + '" y2="150"/>' +
      '<line class="stub" x1="' + (x+14) + '" y1="110" x2="' + (x+14) + '" y2="150"/>' +
      '<rect class="node" x="' + (x-26) + '" y="150" width="66" height="34" rx="6"/>' +
      '<text class="ntxt" x="' + (x+7) + '" y="171" text-anchor="middle">' + label + '</text>'
    );
  }
})();
