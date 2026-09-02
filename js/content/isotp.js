/* Page: ISO-TP */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  function byteCell(cls, idx, desc){
    return '<div class="bf-cell '+cls+'"><div class="bf-bits">Byte '+idx+'</div><div class="bf-name">'+desc+'</div></div>';
  }
  function pciLegend(){
    return '<div class="bit-legend">' +
      '<span><span class="swatch" style="background:var(--c-accent-soft);border:1px solid var(--border-strong)"></span>PCI (điều khiển)</span>' +
      '<span><span class="swatch" style="background:var(--c-green-soft);border:1px solid var(--border-strong)"></span>Dữ liệu thật (payload)</span>' +
      '<span><span class="swatch" style="background:var(--surface-2);border:1px solid var(--border-strong)"></span>Padding / không dùng</span>' +
    '</div>';
  }
  function rows(list){
    var html = "";
    list.forEach(function(r){ html += "<tr>" + r.map(function(c){return "<td>"+c+"</td>";}).join("") + "</tr>"; });
    return html;
  }

  APP.register("isotp", {
    title: "ISO-TP (phân mảnh)",
    icon: "stack",
    keywords: "iso-tp iso 15765-2 transport protocol single frame first frame consecutive frame flow control pci block size stmin ff_dl n_as n_bs n_cr n_ar segmentation phan manh network layer padding sequence number",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("stack") + 'UDS · Phần 5 · Transport Layer</span>' +
'<h1 class="page-title">ISO-TP — gửi dữ liệu dài qua CAN</h1>' +
'<p class="page-lead">Một khung CAN chỉ chở tối đa 8 byte (CAN FD: 64 byte). Nhưng một VIN đã 17 byte, một response DTC có thể hàng trăm byte. ISO-TP (ISO 15765-2) là "tầng vận chuyển" chia nhỏ và ghép lại các message dài. Bài này đi chậm, kèm nhiều ví dụ có số byte cụ thể để bạn có thể tự tay tính lại từng bước.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Vấn đề &amp; giải pháp</h2>' +
'<p>UDS message thường dài hơn 8 byte. Ví dụ response đọc VIN gồm: 1 byte SID (<code>0x62</code>) + 2 byte DID (<code>F1 90</code>) + 17 byte VIN dạng ASCII = <strong>20 byte</strong>. Một khung CAN cổ điển chỉ chở được 8 byte, vậy 12 byte còn lại đi đâu?</p>' +
'<p>ISO-TP (còn gọi ISO 15765-2, hay "Transport Protocol") giải quyết bằng cách <strong>phân mảnh (segmentation)</strong>: bên gửi cắt message dài thành nhiều khung CAN nhỏ, gửi lần lượt; bên nhận nhặt từng khung và <strong>ghép lại (reassembly)</strong> đúng thứ tự. Nó nằm giữa UDS (tầng ứng dụng, không biết gì về giới hạn 8 byte) và CAN (tầng vật lý/liên kết dữ liệu, chỉ biết gửi khung 8 byte) — UDS cứ "ném" message dài bao nhiêu cũng được, ISO-TP lo phần cắt/ghép, CAN chỉ việc chở từng khung.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Lớp</th><th>Biết gì / lo việc gì</th></tr></thead><tbody>' +
'<tr><td><strong>UDS</strong> (application layer)</td><td>Soạn request/response bao nhiêu byte cũng được (SID, DID, dữ liệu…), không quan tâm khung CAN dài bao nhiêu.</td></tr>' +
'<tr><td><strong>ISO-TP</strong> (transport layer)</td><td>Cắt message UDS thành các khung ≤8 byte khi gửi, và ghép ngược lại thành message UDS hoàn chỉnh khi nhận.</td></tr>' +
'<tr><td><strong>CAN</strong> (data link + physical)</td><td>Chỉ biết gửi/nhận từng khung tối đa 8 byte (Classic) hoặc 64 byte (CAN FD) lên dây.</td></tr>' +
'</tbody></table></div>' +
'<div class="callout tip">' + co("book") +
'<div class="callout-body"><div class="callout-title">Ví dễ hình dung: gửi thư bằng bưu thiếp</div>' +
'<p>Hãy tưởng tượng bạn chỉ có bưu thiếp, mỗi tấm chở được đúng 8 ký tự. Muốn gửi một lá thư 20 ký tự, bạn phải: (1) gửi tấm đầu tiên ghi rõ "thư này dài 20 ký tự, đây là 6 ký tự đầu"; (2) người nhận trả lời "OK, gửi tiếp đi"; (3) bạn gửi tiếp các tấm bưu thiếp còn lại, mỗi tấm đánh số thứ tự để người nhận biết ghép theo đúng thứ tự. Đó chính xác là những gì First Frame, Flow Control và Consecutive Frame làm — chỉ khác là "bưu thiếp" ở đây là khung CAN.</p></div></div>' +

'<h2><span class="h2-num">2</span>PCI &amp; bốn loại khung ISO-TP</h2>' +
'<p>ISO-TP dùng những byte đầu của phần dữ liệu CAN làm <strong>PCI (Protocol Control Information)</strong> — cho biết đây là loại khung gì. <em>Nibble</em> (4 bit) cao của byte PCI đầu tiên xác định loại khung:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Loại</th><th>PCI nibble</th><th>Dùng khi</th></tr></thead><tbody>' +
'<tr><td><strong>Single Frame (SF)</strong></td><td><code>0x0</code></td><td>Message đủ ngắn để nhét trong 1 khung (≤7 byte data với CAN cổ điển).</td></tr>' +
'<tr><td><strong>First Frame (FF)</strong></td><td><code>0x1</code></td><td>Khung đầu tiên của một message dài (cần nhiều khung).</td></tr>' +
'<tr><td><strong>Consecutive Frame (CF)</strong></td><td><code>0x2</code></td><td>Các khung tiếp theo chở phần còn lại của message.</td></tr>' +
'<tr><td><strong>Flow Control (FC)</strong></td><td><code>0x3</code></td><td>Bên nhận gửi lại để điều tiết luồng (cho phép/tạm dừng, tốc độ).</td></tr>' +
'</tbody></table></div>' +
'<p class="muted">Mẹo đọc nhanh: nhìn <strong>chữ số hex đầu tiên</strong> của byte đầu tiên trong khung. <code>0</code>→SF, <code>1</code>→FF, <code>2</code>→CF, <code>3</code>→FC. Bốn phần dưới đây mổ xẻ từng loại theo đúng từng byte.</p>' +

'<h3>Single Frame (SF)</h3>' +
'<p>Dùng khi toàn bộ message vừa đủ trong 1 khung. Byte 0 = <code>0x0L</code>, với <code>L</code> = số byte dữ liệu thật (0–7 với CAN cổ điển, vì 1 byte đã dùng cho PCI trong khung 8 byte). Các byte sau là dữ liệu; nếu dữ liệu ít hơn 7 byte, phần dư được <strong>đệm (padding)</strong> — thường bằng <code>0x00</code> hoặc <code>0xCC</code> tùy triển khai.</p>' +
'<pre class="code"><span class="cmt"># Ví dụ 1: request đọc VIN "22 F1 90" (3 byte dữ liệu)</span>\n<span class="n">03</span> 22 F1 90 00 00 00 00\n<span class="cmt"># byte0 = 0x03 → SF, L=3 → 3 byte dữ liệu theo sau: 22 F1 90; 4 byte cuối là padding</span></pre>' +
'<div class="bitfield">' +
  byteCell("ctrl",0,'<span class="mono">0x03</span><br>PCI: SF, L=3') +
  byteCell("data",1,'<span class="mono">0x22</span><br>SID') +
  byteCell("data",2,'<span class="mono">0xF1</span><br>DID hi') +
  byteCell("data",3,'<span class="mono">0x90</span><br>DID lo') +
  byteCell("eof",4,'<span class="mono">0x00</span><br>padding') +
  byteCell("eof",5,'<span class="mono">0x00</span><br>padding') +
  byteCell("eof",6,'<span class="mono">0x00</span><br>padding') +
  byteCell("eof",7,'<span class="mono">0x00</span><br>padding') +
'</div>' + pciLegend() +
'<pre class="code"><span class="cmt"># Ví dụ 2: TesterPresent — chỉ 2 byte dữ liệu (SID + sub-function)</span>\n<span class="n">02</span> 3E 00 00 00 00 00 00\n<span class="cmt"># byte0 = 0x02 → SF, L=2 → dữ liệu: 3E (SID TesterPresent), 00 (sub-function)</span></pre>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Với <strong>CAN FD</strong>, một Single Frame có thể chở tới 62 byte nhờ payload 64 byte. Cách mã hoá hơi khác một chút: nếu nibble thấp của byte0 vẫn là <code>0x0L</code> với L≤7 thì đọc như bình thường; nếu L=0 (byte0=<code>0x00</code>) thì đó là "escape" — byte 1 kế tiếp mới thật sự chứa độ dài (8–62). Cơ chế này chỉ cần khi message dài 8–62 byte và bus là CAN FD.</p></div></div>' +

'<h3>First Frame (FF)</h3>' +
'<p>Dùng cho khung <em>đầu tiên</em> của message dài. Hai byte đầu mã hoá <code>0x1</code> (nibble báo FF) cộng với <strong>FF_DL</strong> — tổng độ dài của <em>toàn bộ</em> message (không phải độ dài còn lại), là một số 12-bit nên tối đa <code>0xFFF</code> = 4095 byte. 6 byte còn lại (byte 2–7) là <strong>6 byte dữ liệu đầu tiên</strong> của message.</p>' +
'<p><strong>Cách tính byte0/byte1 từ độ dài:</strong> viết độ dài dưới dạng 12 bit (3 chữ số hex), rồi: <code>byte0 = 0x1</code> ghép với chữ số hex đầu tiên (4 bit cao); <code>byte1</code> = 2 chữ số hex còn lại (8 bit thấp).</p>' +
'<pre class="code"><span class="cmt"># Ví dụ: message dài 19 byte</span>\n19 (thap phan) = 0x013 (12 bit: 0000 0001 0011)\n<span class="cmt">→ 4 bit cao = 0x0, 8 bit thấp = 0x13</span>\n<span class="cmt">→ byte0 = 0x1 ghép 0x0 = </span><span class="n">0x10</span><span class="cmt">;  byte1 = </span><span class="n">0x13</span></pre>' +
'<p>Áp dụng cho ví dụ VIN (tổng cộng 20 byte = <code>0x014</code>): byte0 = <code>0x10</code>, byte1 = <code>0x14</code>. 6 byte data đầu tiên là <code>62 F1 90</code> (SID+DID) rồi 3 ký tự VIN đầu:</p>' +
'<div class="bitfield">' +
  byteCell("ctrl",0,'<span class="mono">0x10</span><br>Type=1, len cao=0x0') +
  byteCell("ctrl",1,'<span class="mono">0x14</span><br>len thấp (0x014=20)') +
  byteCell("data",2,'<span class="mono">0x62</span><br>SID (0x22+0x40)') +
  byteCell("data",3,'<span class="mono">0xF1</span><br>DID hi') +
  byteCell("data",4,'<span class="mono">0x90</span><br>DID lo') +
  byteCell("data",5,'<span class="mono">0x57</span><br>VIN[0]="W"') +
  byteCell("data",6,'<span class="mono">0x56</span><br>VIN[1]="V"') +
  byteCell("data",7,'<span class="mono">0x57</span><br>VIN[2]="W"') +
'</div>' + pciLegend() +
'<p>Bảng dưới cho thêm vài độ dài khác, để bạn quen mắt với việc "chữ số hex đầu" của byte0 chỉ đổi khi độ dài vượt 255 byte:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Độ dài (thập phân)</th><th>Độ dài (hex, 12-bit)</th><th>Byte0</th><th>Byte1</th></tr></thead><tbody>' +
rows([
  ["8 (ngắn nhất cần FF)","0x008","<span class=\"mono\">0x10</span>","<span class=\"mono\">0x08</span>"],
  ["19","0x013","<span class=\"mono\">0x10</span>","<span class=\"mono\">0x13</span>"],
  ["20 (VIN, ví dụ trên)","0x014","<span class=\"mono\">0x10</span>","<span class=\"mono\">0x14</span>"],
  ["100","0x064","<span class=\"mono\">0x10</span>","<span class=\"mono\">0x64</span>"],
  ["261 (&gt;255 → nibble cao đổi)","0x105","<span class=\"mono\">0x11</span>","<span class=\"mono\">0x05</span>"],
  ["4095 (tối đa cho phép)","0xFFF","<span class=\"mono\">0x1F</span>","<span class=\"mono\">0xFF</span>"]
]) +
'</tbody></table></div>' +
'<div class="callout spec">' + co("zap") +
'<div class="callout-body"><p>Nếu message dài hơn 4095 byte (hiếm, thường chỉ gặp khi flash firmware qua CAN FD), ISO 15765-2:2016 định nghĩa một dạng "escape": FF_DL trong 12 bit đặt bằng <code>0x000</code>, rồi 4 byte tiếp theo (thay vì 6 byte data) chứa độ dài thật dạng 32-bit. Phần data thực sự bắt đầu từ byte thứ 6 trong trường hợp này. Đây là chi tiết nâng cao, không cần nhớ khi mới học.</p></div></div>' +

'<h3>Flow Control (FC)</h3>' +
'<p>Sau khi nhận FF, bên nhận phải chủ động gửi một khung FC để nói "gửi tiếp đi (hoặc khoan đã / hoặc thôi huỷ)". Nếu bên nhận <em>không</em> gửi FC, bên gửi sẽ chờ rồi timeout (xem mục 5). Cấu trúc: byte0 = <code>0x3S</code> (S = Flow Status), byte1 = <strong>Block Size (BS)</strong>, byte2 = <strong>STmin</strong>. 5 byte còn lại không dùng.</p>' +
'<div class="bitfield">' +
  byteCell("ctrl",0,'<span class="mono">0x30</span><br>Type=3, FS=0 (CTS)') +
  byteCell("ctrl",1,'<span class="mono">0x00</span><br>Block Size') +
  byteCell("ctrl",2,'<span class="mono">0x00</span><br>STmin') +
  byteCell("eof",3,"—") + byteCell("eof",4,"—") + byteCell("eof",5,"—") + byteCell("eof",6,"—") + byteCell("eof",7,"—") +
'</div>' + pciLegend() +
'<div class="table-wrap"><table class="data"><thead><tr><th>Tham số</th><th>Ý nghĩa</th></tr></thead><tbody>' +
'<tr><td>Flow Status (S)</td><td><code>0</code> = <strong>Continue To Send (CTS)</strong> — cứ gửi tiếp; <code>1</code> = <strong>Wait</strong> — khoan, tôi chưa sẵn sàng, chờ FC khác; <code>2</code> = <strong>Overflow</strong> — huỷ, tôi không nhận nổi message này (buffer không đủ).</td></tr>' +
'<tr><td>Block Size (BS)</td><td>Số Consecutive Frame bên gửi được phép gửi liên tiếp trước khi <em>bắt buộc</em> phải dừng và chờ một FC mới. <code>0</code> = gửi hết phần còn lại một mạch, không cần FC nào nữa.</td></tr>' +
'<tr><td>STmin (Separation Time min)</td><td>Khoảng thời gian tối thiểu bên gửi phải chờ giữa hai CF liên tiếp — để không làm ngập bộ đệm của bên nhận.</td></tr>' +
'</tbody></table></div>' +
'<p><strong>Đọc giá trị STmin</strong> (byte2 của FC):</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Giá trị byte STmin</th><th>Ý nghĩa</th></tr></thead><tbody>' +
rows([
  ["<span class=\"mono\">0x00</span>","0 ms — không cần chờ, gửi CF kế tiếp ngay."],
  ["<span class=\"mono\">0x01</span> – <span class=\"mono\">0x7F</span>","1–127 ms (đọc thẳng giá trị hex ra số mili-giây thập phân của chính giá trị đó, ví dụ <span class=\"mono\">0x05</span> = 5 ms)."],
  ["<span class=\"mono\">0x80</span> – <span class=\"mono\">0xF0</span>","Dự trữ (reserved) — không hợp lệ."],
  ["<span class=\"mono\">0xF1</span> – <span class=\"mono\">0xF9</span>","100–900 micro-giây (µs), mỗi bước 100µs: <span class=\"mono\">0xF1</span>=100µs, <span class=\"mono\">0xF4</span>=400µs, <span class=\"mono\">0xF9</span>=900µs."],
  ["<span class=\"mono\">0xFA</span> – <span class=\"mono\">0xFF</span>","Dự trữ (reserved) — không hợp lệ."]
]) +
'</tbody></table></div>' +
'<div class="callout warn">' + co("alert") +
'<div class="callout-body"><p>Lỗi hay gặp khi mới đọc log: nhầm dải µs với ms. <code>0xF5</code> nghĩa là <strong>500 micro-giây</strong> (0.5 ms), không phải 500 ms hay 0xF5=245 ms như nếu đọc nhầm theo quy tắc dải đầu.</p></div></div>' +
'<p>Ví dụ hai khung FC khác Flow Status:</p>' +
'<pre class="code"><span class="cmt"># Wait — bên nhận báo "khoan đã, chưa sẵn sàng"</span>\n<span class="n">31</span> 00 00 00 00 00 00 00\n<span class="cmt"># Overflow — bên nhận huỷ, không đủ chỗ chứa message này</span>\n<span class="n">32</span> 00 00 00 00 00 00 00</pre>' +

'<h3>Consecutive Frame (CF)</h3>' +
'<p>Chở phần dữ liệu còn lại sau First Frame, mỗi khung 7 byte data. Byte 0 = <code>0x2N</code> với <code>N</code> = <strong>số thứ tự (sequence number)</strong>, 4 bit nên chạy 0–15. Theo ISO 15765-2, <strong>CF đầu tiên luôn có N=1</strong> (không phải 0!), sau đó tăng dần 1→2→…→15→0→1→… và lặp lại vòng nếu message rất dài (&gt;105 byte data trong CF). Bên nhận dùng N để phát hiện mất khung hoặc khung tới sai thứ tự.</p>' +
'<div class="bitfield">' +
  byteCell("ctrl",0,'<span class="mono">0x21</span><br>Type=2, SN=1') +
  byteCell("data",1,'<span class="mono">0x5A</span><br>VIN[3]') +
  byteCell("data",2,'<span class="mono">0x5A</span><br>VIN[4]') +
  byteCell("data",3,'<span class="mono">0x5A</span><br>VIN[5]') +
  byteCell("data",4,'<span class="mono">0x31</span><br>VIN[6]') +
  byteCell("data",5,'<span class="mono">0x4A</span><br>VIN[7]') +
  byteCell("data",6,'<span class="mono">0x5A</span><br>VIN[8]') +
  byteCell("data",7,'<span class="mono">0x58</span><br>VIN[9]') +
'</div>' + pciLegend() +
'<p><strong>Vòng lặp sequence number</strong> — với một message rất dài cần nhiều CF, số thứ tự cứ đếm rồi quay vòng:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>CF thứ #</th><th>1</th><th>2</th><th>…</th><th>15</th><th>16</th><th>17</th><th>…</th></tr></thead><tbody>' +
'<tr><td>SN (byte0 low nibble)</td><td class="mono">1</td><td class="mono">2</td><td>…</td><td class="mono">F (15)</td><td class="mono">0</td><td class="mono">1</td><td>…</td></tr>' +
'</tbody></table></div>' +
'<div class="callout danger">' + co("alert") +
'<div class="callout-body"><div class="callout-title">Ví dụ phát hiện mất khung</div>' +
'<p>Giả sử bên nhận đã nhận CF với SN = 1, 2, 3 — số tiếp theo <em>phải</em> là 4. Nếu khung kế tiếp lại đến với SN = 5 (do CF số 4 bị mất trên bus, nhiễu, hoặc lỗi phần cứng), bên nhận nhận ra ngay số thứ tự không khớp kỳ vọng → coi là <strong>lỗi trình tự (Wrong Sequence Number)</strong>, huỷ toàn bộ quá trình ghép nhận đang dang dở thay vì tạo ra một message bị thiếu/sai dữ liệu một cách âm thầm. Đây chính là lý do sequence number tồn tại.</p></div></div>' +

'<h2><span class="h2-num">3</span>Ví dụ đầy đủ, từng byte (luyện đọc)</h2>' +
'<p>Phần này ráp toàn bộ 4 loại khung ở mục 2 thành nhiều giao dịch thật, mỗi ví dụ dùng một dịch vụ UDS khác nhau và một "hình dạng" số byte khác nhau (khớp khít, dư ra cần đệm, multi-frame ở request thay vì response…). Đọc hết cả 4 ví dụ rồi tự làm bài luyện tập ở cuối mục — đó là cách nhanh nhất để quen tay đọc log ISO-TP thật.</p>' +

'<h3>Ví dụ 1: message multi-frame ngắn nhất có thể (FF + đúng 1 Consecutive Frame)</h3>' +
'<p>Tester đọc DID <code>0x0100</code>, ECU trả về 5 byte dữ liệu. Tổng response = 1(SID) + 2(DID) + 5(data) = <strong>8 byte</strong> — đúng bằng ngưỡng tối thiểu phải dùng First Frame (7 byte là còn nhét vừa Single Frame, xem bảng ở mục 2).</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Hướng</th><th>Bytes (hex)</th><th>Giải nghĩa</th></tr></thead><tbody>' +
rows([
  ["1","Tester → ECU","<span class=\"mono\">03 22 01 00 00 00 00 00</span>","Single Frame: request đọc DID 0x0100."],
  ["2","ECU → Tester","<span class=\"mono\">10 08 62 01 00 01 02 03</span>","First Frame: FF_DL=0x008=8 byte. Data đầu: SID 0x62, DID 01 00, rồi 3 byte dữ liệu đầu 01 02 03."],
  ["3","Tester → ECU","<span class=\"mono\">30 00 00 00 00 00 00 00</span>","Flow Control: CTS, BS=0, STmin=0."],
  ["4","ECU → Tester","<span class=\"mono\">21 04 05 00 00 00 00 00</span>","Consecutive Frame SN=1: chỉ còn 2 byte dữ liệu thật (04, 05) — 5 byte cuối là padding. Đây cũng là CF <em>duy nhất</em> cần dùng."]
]) +
'</tbody></table></div>' +
'<p class="muted">Ghép lại: <span class="mono">62 01 00</span> (từ FF) + <span class="mono">01 02 03</span> (từ FF) + <span class="mono">04 05</span> (2 byte thật từ CF, bỏ qua phần đệm) = <span class="mono">62 01 00 01 02 03 04 05</span> — đủ 8/8 byte. Phần lớn nội dung của khung CF này là byte đệm, nhưng vẫn bắt buộc phải có cả khung FF lẫn FC lẫn CF — không có đường tắt nào khi độ dài đã vượt quá 7 byte.</p>' +

'<h3>Ví dụ 2: đọc VIN — khớp khít tuyệt đối, không cần đệm (ReadDataByIdentifier)</h3>' +
'<p>Tester đọc VIN (DID <code>0xF190</code>) từ ECU, ECU trả về VIN <code>"WVWZZZ1JZXW000001"</code> — chuỗi 17 ký tự ASCII. Tổng response = 1(SID) + 2(DID) + 17(VIN) = 20 byte, đúng bằng ví dụ FF ở mục 2.</p>' +
diagramFlow() +
'<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Hướng</th><th>Bytes (hex)</th><th>Giải nghĩa</th></tr></thead><tbody>' +
rows([
  ["1","Tester → ECU","<span class=\"mono\">03 22 F1 90 00 00 00 00</span>","Single Frame: request đọc DID F190 (VIN)."],
  ["2","ECU → Tester","<span class=\"mono\">10 14 62 F1 90 57 56 57</span>","First Frame: FF_DL=0x014=20 byte; data đầu: SID 0x62, DID F1 90, rồi \"W\",\"V\",\"W\"."],
  ["3","Tester → ECU","<span class=\"mono\">30 00 00 00 00 00 00 00</span>","Flow Control: CTS, BS=0 (gửi hết luôn), STmin=0 (không cần chờ)."],
  ["4","ECU → Tester","<span class=\"mono\">21 5A 5A 5A 31 4A 5A 58</span>","Consecutive Frame #1 (SN=1): 7 ký tự tiếp \"Z\",\"Z\",\"Z\",\"1\",\"J\",\"Z\",\"X\"."],
  ["5","ECU → Tester","<span class=\"mono\">22 57 30 30 30 30 30 31</span>","Consecutive Frame #2 (SN=2): 7 ký tự cuối \"W\",\"0\",\"0\",\"0\",\"0\",\"0\",\"1\" — vừa khít, không cần khung nào nữa."]
]) +
'</tbody></table></div>' +
'<p><strong>Ghép lại (reassembly)</strong> — bên nhận nối dữ liệu theo đúng thứ tự khung tới:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Sau khi nhận</th><th>Buffer tích luỹ (hex)</th><th>Đã có / cần (byte)</th></tr></thead><tbody>' +
rows([
  ["First Frame","<span class=\"mono\">62 F1 90 57 56 57</span>","6 / 20"],
  ["+ Consecutive Frame #1","<span class=\"mono\">62 F1 90 57 56 57 5A 5A 5A 31 4A 5A 58</span>","13 / 20"],
  ["+ Consecutive Frame #2 (đủ)","<span class=\"mono\">62 F1 90 57 56 57 5A 5A 5A 31 4A 5A 58 57 30 30 30 30 30 31</span>","20 / 20 ✓"]
]) +
'</tbody></table></div>' +
'<p>Đủ 20/20 byte, bên nhận cắt bỏ 3 byte đầu (SID + DID để xác nhận đúng response), phần còn lại giải mã ASCII: <code>57 56 57 5A 5A 5A 31 4A 5A 58 57 30 30 30 30 30 31</code> → <strong>"WVWZZZ1JZXW000001"</strong> — đúng chuỗi VIN ban đầu. Toàn bộ quá trình phân mảnh/ghép nối diễn ra trong suốt lớp ISO-TP; lớp UDS phía trên chỉ thấy một response 20 byte duy nhất.</p>' +

'<h3>Ví dụ 3: multi-frame nằm ở REQUEST, không phải response (WriteDataByIdentifier)</h3>' +
'<p>Hai ví dụ trên đều multi-frame ở chiều response. Nhưng phân mảnh áp dụng cho <em>bất kỳ hướng nào</em> khi dữ liệu đủ dài — kể cả request. Tester ghi 10 byte hiệu chỉnh vào DID <code>0x0110</code>: request = 1(SID) + 2(DID) + 10(data) = <strong>13 byte</strong>, còn response (xác nhận ghi) chỉ vỏn vẹn 3 byte nên vẫn là Single Frame.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Hướng</th><th>Bytes (hex)</th><th>Giải nghĩa</th></tr></thead><tbody>' +
rows([
  ["1","Tester → ECU","<span class=\"mono\">10 0D 2E 01 10 0A 14 1E</span>","First Frame: FF_DL=0x00D=13 byte. Data đầu: SID 0x2E (WriteDataByIdentifier), DID 01 10, rồi 3 byte dữ liệu đầu 0A 14 1E."],
  ["2","ECU → Tester","<span class=\"mono\">30 00 00 00 00 00 00 00</span>","Flow Control: CTS, BS=0, STmin=0. Lần này chính <strong>ECU</strong> là bên đang \"nhận\" nên ECU là bên phát ra FC."],
  ["3","Tester → ECU","<span class=\"mono\">21 28 32 3C 46 50 5A 64</span>","Consecutive Frame SN=1: 7 byte dữ liệu còn lại — vừa khít 13/13 byte, không cần khung nào nữa."],
  ["4","ECU → Tester","<span class=\"mono\">03 6E 01 10 00 00 00 00</span>","Positive response (Single Frame): SID 0x6E (=0x2E+0x40), DID 01 10 lặp lại để xác nhận đã ghi thành công. Response ngắn nên không cần multi-frame."]
]) +
'</tbody></table></div>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Quy tắc chung: hướng nào cần multi-frame không quan trọng — <strong>bên nào đang gửi dữ liệu dài thì bên đó phát FF rồi CF, bên đang nhận thì phát FC</strong>, bất kể đó là Tester hay ECU. ISO-TP hoàn toàn đối xứng giữa hai chiều.</p></div></div>' +

'<h3>Ví dụ 4: response có byte đệm ở khung cuối (trường hợp phổ biến nhất thực tế)</h3>' +
'<p>Hai ví dụ 2 và 3 đều "khớp khít" (không byte đệm nào ở CF) — nhưng đó là sự trùng hợp về số học, không phải quy luật. Thực tế đa số message <em>không</em> chia hết cho 7, nên khung CF cuối cùng gần như luôn có đệm. Tester đọc DID <code>0x1A2B</code> (dữ liệu cảm biến thô, không phải text), ECU trả về 15 byte thô: tổng = 1+2+15 = <strong>18 byte</strong>.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Hướng</th><th>Bytes (hex)</th><th>Giải nghĩa</th></tr></thead><tbody>' +
rows([
  ["1","Tester → ECU","<span class=\"mono\">03 22 1A 2B 00 00 00 00</span>","Single Frame: request đọc DID 0x1A2B."],
  ["2","ECU → Tester","<span class=\"mono\">10 12 62 1A 2B A1 A2 A3</span>","First Frame: FF_DL=0x012=18 byte. Data đầu: SID 0x62, DID 1A 2B, rồi 3 byte dữ liệu thô đầu A1 A2 A3."],
  ["3","Tester → ECU","<span class=\"mono\">30 00 00 00 00 00 00 00</span>","Flow Control: CTS, BS=0, STmin=0."],
  ["4","ECU → Tester","<span class=\"mono\">21 A4 A5 A6 A7 A8 A9 AA</span>","Consecutive Frame SN=1: 7 byte dữ liệu tiếp theo — lấp đầy hoàn toàn, chưa cần đệm."],
  ["5","ECU → Tester","<span class=\"mono\">22 AB AC AD AE AF CC CC</span>","Consecutive Frame SN=2: chỉ còn 5 byte dữ liệu thật (AB…AF); 2 byte cuối là padding (0xCC) vì đã đủ 18/18 byte."]
]) +
'</tbody></table></div>' +
'<p class="muted">Bên nhận biết chính xác lúc nào phải dừng và bỏ qua phần đệm: nó đếm số byte dữ liệu thật đã nhận (không đếm số khung), và dừng ngay khi chạm đúng FF_DL=18 đã được báo trước ở First Frame — 2 byte <span class="mono">CC CC</span> cuối cùng bị bỏ qua hoàn toàn, không phải một phần của message.</p>' +

'<div class="callout tip">' + co("flask") +
'<div class="callout-body"><div class="callout-title">Tự luyện tập</div>' +
'<p>ECU trả lời request đọc DID <code>0x0405</code> bằng <strong>11 byte dữ liệu</strong> (chưa tính SID và DID). Đừng đọc đáp án vội — hãy tự tính trên giấy: (a) SID của response là gì? (b) Tổng độ dài response (FF_DL) là bao nhiêu, viết dưới dạng hex? Byte0 và byte1 của First Frame là gì? (c) Cần tất cả bao nhiêu Consecutive Frame? Khung CF cuối có cần đệm không, nếu có thì bao nhiêu byte?</p>' +
'<p class="muted"><strong>Đáp án:</strong> SID response = <span class="mono">0x62</span> (0x22+0x40). Tổng = 1+2+11 = 14 byte = <span class="mono">0x00E</span> → byte0 = <span class="mono">0x10</span>, byte1 = <span class="mono">0x0E</span>. First Frame chở 6 byte đầu (SID, DID, 3 byte data) → còn lại 14-6=8 byte data cần gửi tiếp bằng CF. Cần <strong>2 Consecutive Frame</strong>: CF1 (SN=1) chở đủ 7 byte, CF2 (SN=2) chỉ còn 1 byte dữ liệu thật + 6 byte đệm.</p></div></div>' +

'<h2><span class="h2-num">4</span>Ví dụ nâng cao: Block Size &gt; 0 (nhiều đợt Flow Control)</h2>' +
'<p>Ví dụ ở mục 3 dùng BS=0 nên ECU gửi hết một mạch. Trong thực tế, nhiều tool/ECU đặt BS khác 0 để giới hạn số CF gửi liên tiếp — buộc bên gửi phải dừng lại và chờ FC mới sau mỗi "block". Ví dụ dưới đây: Tester đọc danh sách DTC (dịch vụ <code>0x19</code>, sub-function <code>0x02</code>), ECU trả về response dài <strong>51 byte</strong> (3 byte header + 48 byte dữ liệu DTC). Để dễ theo dõi, 48 byte dữ liệu được đánh số liên tục <code>0x01…0x30</code> — nhìn vào giá trị byte là biết ngay nó là byte thứ mấy của phần dữ liệu.</p>' +
diagramBlockFlow() +
'<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Hướng</th><th>Bytes (hex)</th><th>Giải nghĩa</th></tr></thead><tbody>' +
rows([
  ["1","Tester → ECU","<span class=\"mono\">03 19 02 FF 00 00 00 00</span>","SF: request ReadDTCInformation, sub-function 0x02, status mask 0xFF."],
  ["2","ECU → Tester","<span class=\"mono\">10 33 59 02 FF 01 02 03</span>","FF: FF_DL=0x033=51 byte. Data đầu: SID 0x59, sub-function echo 0x02, mask 0xFF, rồi byte dữ liệu 01, 02, 03."],
  ["3","Tester → ECU","<span class=\"mono\">30 03 05 00 00 00 00 00</span>","FC #1: CTS, <strong>BS=3</strong> (chỉ được gửi 3 CF rồi phải dừng), STmin=0x05=5 ms."],
  ["4","ECU → Tester","<span class=\"mono\">21 04 05 06 07 08 09 0A</span>","CF SN=1 — byte dữ liệu 04–0A. (Đây là CF thứ 1 trong block.)"],
  ["5","ECU → Tester","<span class=\"mono\">22 0B 0C 0D 0E 0F 10 11</span>","CF SN=2 — byte dữ liệu 0B–11. (CF thứ 2 trong block.)"],
  ["6","ECU → Tester","<span class=\"mono\">23 12 13 14 15 16 17 18</span>","CF SN=3 — byte dữ liệu 12–18. <strong>Đủ 3 CF (BS=3)</strong> → ECU bắt buộc dừng, chờ FC mới."],
  ["7","Tester → ECU","<span class=\"mono\">30 03 05 00 00 00 00 00</span>","FC #2: CTS, lại BS=3, STmin=5 ms — cho phép gửi tiếp 3 CF nữa."],
  ["8","ECU → Tester","<span class=\"mono\">24 19 1A 1B 1C 1D 1E 1F</span>","CF SN=4 — byte dữ liệu 19–1F."],
  ["9","ECU → Tester","<span class=\"mono\">25 20 21 22 23 24 25 26</span>","CF SN=5 — byte dữ liệu 20–26."],
  ["10","ECU → Tester","<span class=\"mono\">26 27 28 29 2A 2B 2C 2D</span>","CF SN=6 — byte dữ liệu 27–2D. Đủ block 2 → lại dừng, chờ FC."],
  ["11","Tester → ECU","<span class=\"mono\">30 00 05 00 00 00 00 00</span>","FC #3: CTS, lần này <strong>BS=0</strong> — \"còn bao nhiêu gửi hết luôn, khỏi chờ FC nữa\"."],
  ["12","ECU → Tester","<span class=\"mono\">27 2E 2F 30 CC CC CC CC</span>","CF SN=7 — chỉ còn 3 byte dữ liệu thật (2E, 2F, 30), 4 byte cuối là padding (0xCC). Đủ 51/51 byte."]
]) +
'</tbody></table></div>' +
'<p class="muted">Cộng lại: FF đóng góp 6 byte data (59 02 FF 01 02 03) + 6 CF đầy (7×6=42 byte) + 1 CF cuối chỉ có 3 byte thật = 6+42+3 = <strong>51 byte</strong>, khớp đúng FF_DL đã báo trước ở khung First Frame. Đây là cách bên nhận biết khi nào dừng: nó không đếm số khung, mà đếm số byte dữ liệu đã nhận, dừng khi đủ FF_DL.</p>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Nhận xét quan trọng: <strong>Block Size có thể thay đổi giữa các lần FC</strong> (ở ví dụ trên: 3 → 3 → 0). Bên gửi luôn tuân theo giá trị BS/STmin trong FC <em>gần nhất</em> nó nhận được, không dùng lại giá trị cũ.</p></div></div>' +

'<h2><span class="h2-num">5</span>Tham số thời gian (timeout)</h2>' +
'<p>ISO-TP định nghĩa 4 bộ đếm thời gian để tránh treo vô thời hạn khi một phía không phản hồi. Tên gọi theo quy ước: <code>N_A</code> = tại lớp Network liên quan tới việc gửi xuống CAN (Application/Network layer handshake với Data Link layer); <code>N_B</code>/<code>N_C</code> = chờ đối phương ở tầng Network.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Timer</th><th>Ai chờ ai</th><th>Hết hạn thì sao</th></tr></thead><tbody>' +
rows([
  ["<strong>N_As</strong>","Bên gửi chờ CAN layer xác nhận đã truyền xong 1 khung (SF/FF/CF) nó vừa đưa xuống bus.","Coi là lỗi truyền vật lý (bus off, không có ai ACK…) → huỷ giao dịch."],
  ["<strong>N_Ar</strong>","Giống N_As nhưng áp dụng khi bên nhận gửi khung Flow Control.","Huỷ giao dịch phía nhận."],
  ["<strong>N_Bs</strong>","Bên gửi chờ Flow Control (sau khi gửi FF, hoặc sau khi vừa gửi đủ một block CF).","Bên gửi coi như bên nhận không phản hồi → huỷ, không gửi tiếp CF nữa."],
  ["<strong>N_Cr</strong>","Bên nhận chờ Consecutive Frame kế tiếp (sau FC, hoặc sau CF trước đó).","Bên nhận huỷ toàn bộ buffer đang ghép dở, coi như message thất bại."]
]) +
'</tbody></table></div>' +
'<p class="muted">ISO 15765-2 quy định giá trị hiệu năng đề xuất (performance requirement) cho cả 4 timer là <strong>1000 ms</strong> — đây là mức trần, không phải giá trị "nên dùng". Trong thực tế, tool chẩn đoán và ECU thường cấu hình ngắn hơn nhiều (phổ biến 50–150 ms cho N_Bs/N_Cr) để phát hiện lỗi nhanh, tránh người dùng phải chờ cả giây mới biết kết nối có vấn đề.</p>' +

'<h2><span class="h2-num">6</span>Địa chỉ CAN cho ISO-TP</h2>' +
'<p>Trên CAN, request và response dùng hai CAN ID khác nhau — nhờ vậy phần mềm phân tích log tách được "ai đang nói" mà không cần đọc nội dung. Một quy ước phổ biến (OBD-II, 11-bit) là:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Hướng</th><th>CAN ID (ví dụ)</th></tr></thead><tbody>' +
'<tr><td>Tester → ECU (request, physical)</td><td><code>0x7E0</code></td></tr>' +
'<tr><td>ECU → Tester (response)</td><td><code>0x7E8</code></td></tr>' +
'<tr><td>Functional (broadcast tới nhiều ECU)</td><td><code>0x7DF</code></td></tr>' +
'</tbody></table></div>' +
'<p><strong>Physical addressing</strong> (1 tester ↔ 1 ECU cụ thể) dùng cho hầu hết giao dịch, kể cả toàn bộ luồng multi-frame ở mục 3–4. <strong>Functional addressing</strong> (broadcast, ví dụ <code>0x7DF</code>) chỉ dùng để "hỏi cả bus xem ai trả lời" — theo ISO 15765-2, chỉ Single Frame mới được gửi tới ID functional; khi cần multi-frame, ECU trả lời sẽ chuyển sang CAN ID physical riêng của nó cho các khung còn lại.</p>' +
'<p class="muted">Các hệ thống 29-bit dùng định địa chỉ mở rộng (normal fixed / extended addressing) theo ISO 15765-2 — về bản chất vẫn là 4 loại khung như trên, chỉ khác cách nhúng thêm 1 byte "địa chỉ đích" vào đầu mỗi khung.</p>' +

'<h2><span class="h2-num">7</span>Lỗi thường gặp khi mới học ISO-TP</h2>' +
'<ul>' +
'<li><strong>Quên gửi Flow Control:</strong> sau khi nhận First Frame, nếu bên nhận không gửi FC, bên gửi sẽ đợi hết N_Bs rồi huỷ. Khi tự dựng tool/lab, đây là lỗi phổ biến nhất khiến multi-frame "im re" không thấy CF nào.</li>' +
'<li><strong>Nhầm sequence number bắt đầu từ 0:</strong> CF đầu tiên luôn là SN=1, không phải 0. Một số người mới viết code sai ngay từ đây khiến bên nhận (đúng chuẩn) từ chối toàn bộ message.</li>' +
'<li><strong>Đọc sai đơn vị STmin:</strong> nhầm dải <code>0xF1–0xF9</code> (micro-giây) với dải <code>0x01–0x7F</code> (mili-giây) — chênh nhau 1000 lần.</li>' +
'<li><strong>Không tôn trọng Block Size:</strong> bên gửi cứ phun hết CF mà không dừng lại chờ FC mới sau khi đủ số lượng BS đã thoả thuận — vi phạm giao thức, dễ làm tràn buffer bên nhận.</li>' +
'<li><strong>Giá trị padding không thống nhất:</strong> không phải lỗi giao thức (ISO-TP không quan tâm giá trị padding), nhưng ISO 15765-2:2016 khuyến nghị dùng <code>0xCC</code>; nhiều thiết bị cũ dùng <code>0x00</code>. Khi so sánh log giữa hai công cụ khác nhau, đừng ngạc nhiên nếu byte đệm khác nhau.</li>' +
'<li><strong>Dùng chung một CAN ID cho cả request và response:</strong> khiến công cụ phân tích không tách được luồng (ai gửi, ai nhận) khi có nhiều multi-frame xen kẽ trên cùng một bus.</li>' +
'<li><strong>Quên giới hạn 4095 byte của FF_DL 12-bit:</strong> muốn gửi message dài hơn phải dùng escape length (mục 2) — nếu không xử lý, phần mềm sẽ tính sai độ dài hoặc tràn số.</li>' +
'</ul>' +

'<h2><span class="h2-num">8</span>Bảng tra cứu nhanh (cheat sheet)</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Loại</th><th>Byte 0</th><th>Byte 1</th><th>Byte 2+</th></tr></thead><tbody>' +
rows([
  ["<strong>SF</strong>","<span class=\"mono\">0x0L</span> — L = số byte data (0–7)","dữ liệu","dữ liệu (tổng L byte)"],
  ["<strong>FF</strong>","<span class=\"mono\">0x1_</span> — 4 bit cao của FF_DL","8 bit thấp của FF_DL","6 byte data đầu tiên"],
  ["<strong>CF</strong>","<span class=\"mono\">0x2N</span> — N = sequence number, bắt đầu từ 1","dữ liệu","dữ liệu (tối đa 7 byte/khung)"],
  ["<strong>FC</strong>","<span class=\"mono\">0x3S</span> — S = Flow Status (0 CTS / 1 Wait / 2 Overflow)","Block Size (BS)","STmin, rồi padding"]
]) +
'</tbody></table></div>' +

'<div class="callout tip">' + co("check") +
'<div class="callout-body"><div class="callout-title">Với người mới: quy trình 4 bước cần nhớ</div>' +
'<p>1) Message ngắn (≤7 byte) → 1 <strong>Single Frame</strong>, xong luôn. 2) Message dài → bên gửi phát <strong>First Frame</strong> báo trước tổng độ dài. 3) Bên nhận phải chủ động trả lời bằng <strong>Flow Control</strong> để "bật đèn xanh" (CTS), có thể kèm giới hạn tốc độ (BS, STmin). 4) Bên gửi phát các <strong>Consecutive Frame</strong> đánh số 1, 2, 3… cho tới khi đủ số byte đã báo ở First Frame; bên nhận ghép lại theo đúng thứ tự và kiểm tra số thứ tự để phát hiện mất khung. Chỉ cần nắm chắc 4 bước này và bảng cheat sheet ở mục 8 là đủ đọc hiểu mọi log UDS dài.</p></div></div>' +

'<div class="callout spec">' + co("zap") +
'<div class="callout-body"><div class="callout-title">Nâng cao (ghi chú để mở rộng)</div>' +
'<p>Trên <strong>CAN FD</strong>, một Single Frame có thể chứa tới 62 byte (vì payload 64 byte), nên nhiều message UDS không cần phân mảnh nữa; First Frame cũng có escape length riêng cho message &gt;4095 byte (mục 2). Các cơ chế nâng cao khác đã nhắc tới ở trên: timeout N_As/N_Bs/N_Cr/N_Ar (mục 5), Flow Status "Wait"/"Overflow" (mục 2), và extended/mixed addressing (mục 6). Tất cả đều là biến thể của đúng 4 loại khung PCI cốt lõi — nắm chắc phần cốt lõi trước khi đào sâu các biến thể này.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Bạn đã hiểu đúng luật chơi ISO-TP ở mức byte. Nhưng trong một ECU thật, ai là người thực thi những quy tắc đó? Xem <a href="#autosar-routing">AUTOSAR — Routing message</a> để biết CanTp, PduR, Dcm, CanIf… phối hợp với nhau ra sao, rồi mở nhóm <a href="#lab-can">Labs</a> để tự tay thực hành.</p></div></div>' +

'</div>'
      );
    }
  });

  function diagramFlow() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 220" width="100%" style="max-width:620px;margin:0 auto" role="img" aria-label="Sơ đồ luồng ISO-TP đọc VIN: First Frame, Flow Control, hai Consecutive Frame">' +
  '<style>svg .t{font:700 13px var(--font-sans)}svg .m{font:600 11px var(--font-mono)}svg .n{font:500 10px var(--font-sans);fill:var(--text-muted)}</style>' +
  '<defs><marker id="af1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-blue)"/></marker>'+
  '<marker id="af2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-green)"/></marker></defs>' +
  '<rect x="20" y="16" width="130" height="40" rx="10" fill="var(--c-accent-soft)" stroke="var(--c-accent)"/><text class="t" x="85" y="41" text-anchor="middle" fill="var(--c-accent)">ECU (gửi)</text>' +
  '<rect x="490" y="16" width="130" height="40" rx="10" fill="var(--c-brand-soft)" stroke="var(--c-brand)"/><text class="t" x="555" y="41" text-anchor="middle" fill="var(--c-brand-strong)">Tester (nhận)</text>' +
  '<line x1="85" y1="56" x2="85" y2="210" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  '<line x1="555" y1="56" x2="555" y2="210" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  arrow(80,255,"10 14 62 F1 90 57 56 57","First Frame (FF_DL=20)","var(--c-blue)","af1",true) +
  arrow(120,555,"30 00 00","Flow Control (CTS, BS=0)","var(--c-green)","af2",false) +
  arrow(160,255,"21 5A 5A 5A 31 4A 5A 58","Consecutive Frame #1 (SN=1)","var(--c-blue)","af1",true) +
  arrow(195,255,"22 57 30 30 30 30 30 31","Consecutive Frame #2 (SN=2) — đủ 20 byte","var(--c-blue)","af1",true) +
'</svg></figure>'
    );
  }
  function diagramBlockFlow() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 470" width="100%" style="max-width:620px;margin:0 auto" role="img" aria-label="Sơ đồ ISO-TP với Block Size lớn hơn 0: ba đợt Flow Control xen kẽ các nhóm Consecutive Frame">' +
  '<style>svg .t{font:700 13px var(--font-sans)}svg .m{font:600 11px var(--font-mono)}svg .n{font:500 10px var(--font-sans);fill:var(--text-muted)}</style>' +
  '<defs><marker id="bf1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-blue)"/></marker>'+
  '<marker id="bf2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--c-green)"/></marker></defs>' +
  '<rect x="20" y="16" width="130" height="40" rx="10" fill="var(--c-accent-soft)" stroke="var(--c-accent)"/><text class="t" x="85" y="41" text-anchor="middle" fill="var(--c-accent)">ECU (gửi)</text>' +
  '<rect x="490" y="16" width="130" height="40" rx="10" fill="var(--c-brand-soft)" stroke="var(--c-brand)"/><text class="t" x="555" y="41" text-anchor="middle" fill="var(--c-brand-strong)">Tester (nhận)</text>' +
  '<line x1="85" y1="56" x2="85" y2="460" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  '<line x1="555" y1="56" x2="555" y2="460" stroke="var(--border-strong)" stroke-dasharray="3 3"/>' +
  arrow(80,255,"10 33 59 02 FF ..","First Frame (FF_DL=51)","var(--c-blue)","bf1",true) +
  arrow(115,555,"30 03 05","Flow Control #1 (BS=3)","var(--c-green)","bf2",false) +
  arrow(150,255,"21 ..","CF #1 (SN=1)","var(--c-blue)","bf1",true) +
  arrow(185,255,"22 ..","CF #2 (SN=2)","var(--c-blue)","bf1",true) +
  arrow(220,255,"23 ..","CF #3 (SN=3) — đủ block 1","var(--c-blue)","bf1",true) +
  arrow(255,555,"30 03 05","Flow Control #2 (BS=3)","var(--c-green)","bf2",false) +
  arrow(290,255,"24 ..","CF #4 (SN=4)","var(--c-blue)","bf1",true) +
  arrow(325,255,"25 ..","CF #5 (SN=5)","var(--c-blue)","bf1",true) +
  arrow(360,255,"26 ..","CF #6 (SN=6) — đủ block 2","var(--c-blue)","bf1",true) +
  arrow(395,555,"30 00 05","Flow Control #3 (BS=0)","var(--c-green)","bf2",false) +
  arrow(430,255,"27 2E 2F 30 CC ..","CF #7 (SN=7) — đủ 51 byte","var(--c-blue)","bf1",true) +
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
