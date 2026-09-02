/* Page: AUTOSAR — message routing from application to CAN bus */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  function rows(list){
    var html = "";
    list.forEach(function(r){ html += "<tr>" + r.map(function(c){return "<td>"+c+"</td>";}).join("") + "</tr>"; });
    return html;
  }
  function hopTable(list) {
    var html = '<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Module</th><th>Message TRƯỚC khi qua module</th><th>Message SAU khi qua module</th><th>Module làm gì ở bước này</th></tr></thead><tbody>';
    list.forEach(function (r) {
      html += '<tr><td>' + r[0] + '</td><td><strong>' + r[1] + '</strong></td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + r[4] + '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  APP.register("autosar-routing", {
    title: "AUTOSAR — Routing message",
    icon: "layers",
    keywords: "autosar bsw dcm pdur pdu router cantp canif can driver cantrcv rte com sw-c routing module basic software layered architecture diagnostic communication manager",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("layers") + 'UDS · Phần 6 · Kiến trúc AUTOSAR</span>' +
'<h1 class="page-title">AUTOSAR — đường đi chi tiết của một message</h1>' +
'<p class="page-lead">Các bài trước học UDS và ISO-TP như thể các byte đó tự nhiên xuất hiện trên bus. Trong một ECU thật chạy AUTOSAR, mỗi lớp giao thức đó do một <strong>module phần mềm (BSW)</strong> riêng đảm nhiệm, và message phải đi qua đúng một chuỗi module theo thứ tự cố định — đó chính là <strong>routing</strong>. Bài này lần theo một message cụ thể (đọc VIN) qua từng module, xem nó biến đổi ra sao ở mỗi bước.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Kiến trúc phân lớp AUTOSAR (tổng quan)</h2>' +
'<p>AUTOSAR Classic chia phần mềm ECU thành 3 lớp chính, xếp chồng lên nhau và giao tiếp qua các API được chuẩn hoá — nhờ vậy module của hãng A có thể chạy cùng module của hãng B miễn đúng chuẩn:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Lớp</th><th>Module tiêu biểu (liên quan đến chẩn đoán/CAN)</th><th>Vai trò chính</th></tr></thead><tbody>' +
'<tr><td><strong>Application Layer</strong></td><td>SW-C (Software Component) — logic ứng dụng, ví dụ phần xử lý chẩn đoán riêng của hãng</td><td>Chứa logic nghiệp vụ. Không biết gì về CAN, ISO-TP hay thậm chí UDS ở mức byte.</td></tr>' +
'<tr><td><strong>RTE</strong> (Runtime Environment)</td><td>Code sinh tự động lúc build</td><td>"Keo dán" giữa SW-C và BSW — cho phép SW-C gọi hàm mà không cần biết module BSW nào thực sự xử lý.</td></tr>' +
'<tr><td><strong>BSW — Services Layer</strong></td><td><strong>Dcm</strong> (Diagnostic Communication Manager), <strong>Com</strong> (Communication), <strong>PduR</strong> (PDU Router), <strong>CanTp</strong>, NvM, ComM…</td><td>Hiện thực các dịch vụ tầng trên: Dcm hiểu UDS (SID, session, security…); Com đóng gói/tách tín hiệu tuần hoàn; PduR định tuyến PDU giữa Dcm/Com và ECU Abstraction bên dưới; CanTp (thuộc nhóm "Communication Services") cài đặt ISO-TP để phân mảnh/ghép message dài.</td></tr>' +
'<tr><td><strong>BSW — ECU Abstraction</strong></td><td><strong>CanIf</strong> (CAN Interface)</td><td>Gỡ bỏ sự phụ thuộc vào phần cứng CAN cụ thể — module duy nhất của tầng này xuất hiện trong chuỗi định tuyến chẩn đoán ở bài này.</td></tr>' +
'<tr><td><strong>BSW — Microcontroller Abstraction</strong></td><td><strong>Can</strong> (driver), <strong>CanTrcv</strong> (driver)</td><td>Điều khiển trực tiếp thanh ghi của CAN Controller/transceiver — lớp duy nhất biết chi tiết phần cứng vi điều khiển.</td></tr>' +
'<tr><td><strong>Hardware</strong></td><td>CAN Controller + Transceiver</td><td>Arbitration, CRC, ACK, tín hiệu vi sai CAN_H/CAN_L — đúng những gì đã học ở <a href="#can-physical">CAN vật lý</a>, <a href="#can-frame">cấu trúc khung</a> và <a href="#can-arbitration">arbitration</a>.</td></tr>' +
'</tbody></table></div>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Càng xuống thấp, module càng "ngu" theo nghĩa tốt: <strong>CanIf</strong> không biết message là chẩn đoán hay tín hiệu thường; <strong>CanTp</strong> không biết SID nghĩa là gì; <strong>PduR</strong> không xử lý nội dung, chỉ tra bảng rồi chuyển tiếp. Sự tách bạch trách nhiệm này là điều làm nên khả năng tái sử dụng module giữa các dự án/phần cứng khác nhau của AUTOSAR.</p></div></div>' +

'<h2><span class="h2-num">2</span>Vì sao PduR là "trái tim" của routing?</h2>' +
'<p><strong>PduR (PDU Router)</strong> đúng như tên gọi: nó không hiểu giao thức, chỉ tra một <strong>bảng cấu hình tĩnh</strong> (sinh lúc build, không đổi lúc chạy) ánh xạ mỗi <em>PduId</em> tới đúng module đích, rồi gọi hàm chuyển tiếp. Trong ví dụ chẩn đoán ở mục 4, PduR chỉ đứng ở <em>một</em> điểm nối duy nhất — giữa Dcm và CanTp. Từ CanTp trở xuống, CanTp nói chuyện <strong>trực tiếp</strong> với CanIf (gọi thẳng <code>CanIf_Transmit()</code> để gửi, và được CanIf gọi thẳng <code>CanTp_RxIndication()</code> khi có khung mới) — PduR không tham gia ở chặng này.</p>' +
'<p>AUTOSAR có hai luồng message hoàn toàn khác cấu trúc, và chính PduR là nơi quyết định một message đi theo luồng nào:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Luồng</th><th>Sinh ra bởi</th><th>Có qua CanTp không?</th><th>Đường đi (rút gọn)</th></tr></thead><tbody>' +
'<tr><td><strong>Chẩn đoán</strong> (UDS request/response, đúng chủ đề bài này)</td><td><strong>Dcm</strong></td><td><span class="badge brand">Có</span> — Dcm luôn gửi qua CanTp, kể cả khi message đủ ngắn để chỉ cần 1 Single Frame</td><td>Dcm ↔ PduR ↔ CanTp ↔ CanIf ↔ Can</td></tr>' +
'<tr><td><strong>Tín hiệu tuần hoàn/sự kiện</strong> (ví dụ vòng tua động cơ phát quảng bá mỗi 100&nbsp;ms)</td><td><strong>Com</strong>, dữ liệu do SW-C cấp qua RTE</td><td><span class="badge">Không</span> — I-PDU của Com luôn được thiết kế vừa khít 1 khung CAN, không cần phân mảnh</td><td>Com ↔ PduR ↔ CanIf ↔ Can</td></tr>' +
'</tbody></table></div>' +
'<p class="muted">Đây cũng là lý do PduR "định tuyến" chứ không chỉ "chuyển tiếp": cùng đi qua PduR nhưng hai loại PduId khác nhau lại rẽ sang hai module xử lý transport hoàn toàn khác nhau (CanTp so với đi thẳng xuống CanIf).</p>' +

'<h2><span class="h2-num">3</span>Nhiệm vụ từng module (bảng tra cứu)</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Module</th><th>Nhận gì (input)</th><th>Nhiệm vụ chính</th><th>Đưa gì đi tiếp (output)</th></tr></thead><tbody>' +
rows([
  ["<strong>Dcm</strong><br><span class=\"muted\">Diagnostic Communication Manager</span>","N-SDU (mảng byte UDS thuần: SID, sub-function, DID…) từ PduR","Chạy state machine session/security (xem <a href=\"#uds-services\">Services &amp; Sessions</a>, <a href=\"#uds-security\">Security Access</a>); parse SID/DID; gọi callback ứng dụng để lấy/ghi dữ liệu thật; ghép response hoặc NRC","N-SDU response (hoặc NRC <code>7F ..</code>) gửi xuống qua <code>PduR_Transmit()</code>"],
  ["<strong>PduR</strong><br><span class=\"muted\">PDU Router</span>","Bất kỳ PDU nào kèm PduId, từ module trên hoặc dưới nó","Tra bảng cấu hình tĩnh PduId&nbsp;→&nbsp;module đích, gọi đúng hàm chuyển tiếp. Không sửa nội dung, không hiểu giao thức.","Đúng dữ liệu vừa nhận, chuyển cho module đích theo bảng"],
  ["<strong>CanTp</strong><br><span class=\"muted\">Transport Protocol — cài đặt ISO-TP 15765-2</span>","N-SDU (Tx, cần gửi) hoặc chuỗi L-PDU thô (Rx, cần ghép)","Phân mảnh N-SDU thành SF/FF/CF theo đúng <a href=\"#isotp\">quy tắc ISO-TP</a> đã học, chạy state machine Flow Control (BS, STmin, N_Bs/N_Cr); ở chiều nhận thì ghép ngược lại thành N-SDU. Giao tiếp trực tiếp với CanIf ở lớp dưới, và với PduR ở lớp trên.","L-PDU (Tx, từng khung ≤8 byte gọi thẳng xuống CanIf) hoặc N-SDU đã ghép xong (Rx, đưa lên PduR)"],
  ["<strong>CanIf</strong><br><span class=\"muted\">CAN Interface</span>","L-PDU gắn PduId trừu tượng (Tx) hoặc frame vật lý gắn CAN&nbsp;ID (Rx)","Tra bảng cấu hình ánh xạ PduId&nbsp;↔&nbsp;CAN&nbsp;ID + hardware object (HTH/HRH của controller cụ thể). Đây là lớp duy nhất biết CAN ID thật là gì.","Frame gắn CAN ID + DLC thật (Tx, gọi <code>Can_Write()</code>) hoặc L-PDU gắn PduId trừu tượng (Rx, gọi thẳng lên CanTp nếu là PDU chẩn đoán, hoặc lên PduR nếu là PDU thường)"],
  ["<strong>Can</strong> + <strong>CanTrcv</strong><br><span class=\"muted\">Driver — Microcontroller Abstraction</span>","Frame {CAN&nbsp;ID, DLC, data} cần gửi, hoặc ngắt phần cứng báo frame mới tới","Đọc/ghi trực tiếp thanh ghi CAN Controller (mailbox, FIFO) và chân điều khiển transceiver — lớp duy nhất phụ thuộc vendor MCU cụ thể","Frame nạp vào mailbox phần cứng (Tx) hoặc L-PDU thô gọi lên CanIf qua callback (Rx)"],
  ["<strong>CAN Controller + Transceiver</strong><br><span class=\"muted\">Hardware</span>","Frame nhị phân trong mailbox (Tx) hoặc tín hiệu vi sai trên dây (Rx)","Arbitration, nhồi bit, CRC, ACK slot (<a href=\"#can-arbitration\">Arbitration</a>, <a href=\"#can-frame\">cấu trúc khung</a>) rồi chuyển đổi digital ↔ điện áp vi sai CAN_H/CAN_L (<a href=\"#can-physical\">lớp vật lý</a>)","Bit trên dây (Tx) hoặc frame nhị phân trong mailbox nhận (Rx)"]
]) +
'</tbody></table></div>' +

'<h2><span class="h2-num">4</span>Theo dấu một message thật: đọc VIN (DID <code>0xF190</code>)</h2>' +
'<p>Dùng lại đúng ví dụ VIN đã quen ở <a href="#isotp">bài ISO-TP</a> và <a href="#uds-services">bài Services</a>: request <code>22 F1 90</code> (3 byte, vừa 1 Single Frame) và response <code>62 F1 90 &lt;17 byte VIN&gt;</code> (20 byte, cần phân mảnh). Lần này ta xem chính xác module nào tạo ra／xử lý từng byte đó bên trong ECU.</p>' +

'<h3>4.1 Chiều nhận (Rx) — request đi từ bus lên tới Dcm</h3>' +
hopTable([
  ["1","CAN Controller<br>+ Transceiver","Điện áp vi sai analog trên CAN_H/CAN_L","Frame nhị phân trong mailbox phần cứng: <span class=\"mono\">ID=0x7E0, DLC=8, Data=03 22 F1 90 00 00 00 00</span>","Giải mã bit, kiểm CRC/ACK, báo ngắt \"có frame mới\"."],
  ["2","Can Driver","Frame trong thanh ghi/mailbox vendor-specific","L-PDU trừu tượng hoá phần cứng: <span class=\"mono\">(CanId=0x7E0, Dlc=8, SduPtr→03 22 F1 90 00 00 00 00)</span>","Đọc thanh ghi, đóng gói theo cấu trúc chuẩn AUTOSAR, gọi <code>CanIf_RxIndication()</code>."],
  ["3","CanIf","L-PDU gắn CAN&nbsp;ID vật lý <span class=\"mono\">0x7E0</span>","L-PDU 8 byte, đã gỡ CAN&nbsp;ID, được nhận diện là N-PDU cấu hình cho CanTp","Tra bảng (Controller, HRH, CanId)&nbsp;→&nbsp;xác định đây là PDU của CanTp; gọi thẳng <code>CanTp_RxIndication()</code> — CanTp là lớp trên trực tiếp của CanIf, PduR không tham gia ở chặng này."],
  ["4","CanTp","L-PDU 8 byte có PCI: <span class=\"mono\">03 22 F1 90 00 00 00 00</span>","<strong>N-SDU</strong> 3 byte thuần UDS: <span class=\"mono\">22 F1 90</span> — đã lột bỏ PCI + padding","Đọc byte0=<code>0x03</code> → Single Frame, L=3 → ghép xong ngay (không cần FF/FC/CF); báo N-SDU đã sẵn sàng lên trên bằng <code>PduR_CanTpRxIndication()</code>."],
  ["5","PduR","N-SDU <span class=\"mono\">22 F1 90</span>","Y hệt dữ liệu, chuyển cho <strong>Dcm</strong>","Tra bảng routing tĩnh (tầng N-PDU chẩn đoán)&nbsp;→&nbsp;đích Dcm; gọi <code>Dcm_RxIndication()</code>. Thuần định tuyến, không đọc nội dung."],
  ["6","Dcm","N-SDU <span class=\"mono\">22 F1 90</span>","Đã xác định: SID=<code>0x22</code> ReadDataByIdentifier, DID=<code>0xF190</code>; gọi callback đọc dữ liệu → nhận về 17 byte VIN","Parse SID/DID, kiểm tra session/quyền, gọi hàm ứng dụng (qua RTE/SW-C) lấy giá trị DID thật."]
]) +

'<h3>4.2 Chiều gửi (Tx) — Dcm build response rồi đi ngược xuống bus</h3>' +
'<p>Từ đây trở đi, hướng dữ liệu đảo ngược: Dcm là nơi "sinh" ra message, các module BSW còn lại lần lượt đóng gói xuống tới tận dây dẫn.</p>' +
hopTable([
  ["1","Dcm","VIN 17 byte lấy được ở bước 4.1.6","N-SDU response 20 byte: <span class=\"mono\">62 F1 90 57 56 57 5A 5A 5A 31 4A 5A 58 57 30 30 30 30 30 31</span>","Ghép SID+0x40=<code>0x62</code>, DID, rồi dữ liệu VIN; gọi <code>PduR_Transmit()</code>."],
  ["2","PduR","N-SDU 20 byte","Y hệt dữ liệu, chuyển cho <strong>CanTp</strong>","Dcm luôn đi qua CanTp cho kênh chẩn đoán — dù response dài hay ngắn; gọi <code>CanTp_Transmit()</code>."],
  ["3","CanTp","N-SDU 20 byte thuần dữ liệu","Chuỗi L-PDU 8 byte có PCI: FF <span class=\"mono\">10 14 62 F1 90 57 56 57</span>, rồi CF#1 <span class=\"mono\">21 5A 5A 5A 31 4A 5A 58</span>, CF#2 <span class=\"mono\">22 57 30 30 30 30 30 31</span>","Phân mảnh đúng thuật toán ISO-TP (mục 2–3 bài <a href=\"#isotp\">ISO-TP</a>), chờ Flow Control từ phía nhận giữa các khối nếu BS&gt;0, rồi gọi thẳng <code>CanIf_Transmit()</code> cho từng L-PDU — không qua PduR ở chặng này."],
  ["4","CanIf","L-PDU gắn PduId trừu tượng (TxPduId)","Frame gắn CAN&nbsp;ID thật <span class=\"mono\">0x7E8</span> + DLC=8","Tra bảng TxPduId&nbsp;→&nbsp;(CAN&nbsp;ID, hardware Tx object/HTH); gọi <code>Can_Write()</code>."],
  ["5","Can Driver","Frame {ID=0x7E8, DLC=8, data}","Frame nằm trong mailbox truyền của CAN Controller, sẵn sàng phát","Nạp dữ liệu vào thanh ghi Tx buffer/mailbox phần cứng."],
  ["6","CAN Controller<br>+ Transceiver","Frame trong mailbox Tx","Bit thật trên dây: điện áp vi sai CAN_H/CAN_L, sau khi thắng arbitration","Arbitration (nếu bus bận), nhồi bit, CRC, chờ ACK — đúng cơ chế ở <a href=\"#can-arbitration\">bài Arbitration</a>."]
]) +
'<div class="callout tip">' + co("check") +
'<div class="callout-body"><div class="callout-title">Xác nhận (confirmation) chạy ngược lại y hệt đường đi</div>' +
'<p>Sau khi 1 khung được phát xong, CAN Controller báo ngắt "Tx complete" → Can Driver gọi <code>CanIf_TxConfirmation()</code> → CanIf gọi thẳng <code>CanTp_TxConfirmation()</code> (CanTp là lớp trên trực tiếp của CanIf, PduR không xen vào chặng này). CanTp dùng tín hiệu này để biết "khung vừa rồi đã đi", và tiếp tục gửi CF kế tiếp (hoặc chờ Flow Control mới nếu vừa hết một block). Khi <em>toàn bộ</em> N-SDU 20 byte đã gửi xong, CanTp mới gọi <code>PduR_CanTpTxConfirmation()</code> lên PduR, rồi PduR gọi <code>Dcm_TxConfirmation()</code> — lúc đó Dcm mới biết response đã thực sự rời khỏi ECU.</p></div></div>' +

'<h2><span class="h2-num">5</span>Sơ đồ tổng hợp</h2>' +
stackDiagram() +
'<p class="muted">PduR chỉ xuất hiện ở <em>một</em> điểm nối duy nhất trong sơ đồ trên — giữa Dcm và CanTp. Từ CanTp trở xuống, CanTp nói chuyện trực tiếp với CanIf (không có PduR xen giữa), đúng như hai bảng bước-by-step ở mục 4.</p>' +

'<h2><span class="h2-num">6</span>Lưu ý &amp; hiểu lầm thường gặp</h2>' +
'<ul>' +
'<li><strong>Không phải ECU nào cũng có đủ mọi module:</strong> một ECU rất nhỏ, chỉ trả lời vài DID ngắn, đôi khi lược bớt hoặc gộp CanTp/PduR vào cùng một khối code — nhưng về mặt kiến trúc chuẩn AUTOSAR Classic, chuỗi module vẫn được định nghĩa đầy đủ như trên.</li>' +
'<li><strong>Dcm luôn đi qua CanTp, kể cả khi message chỉ cần 1 Single Frame:</strong> ví dụ request <code>22 F1 90</code> ở mục 4.1 vẫn qua CanTp — chỉ là CanTp "ghép xong ngay lập tức" vì đã đủ dữ liệu trong 1 khung, không có nghĩa là CanTp bị bỏ qua.</li>' +
'<li><strong>PduR không đưa ra quyết định logic</strong> — nó chỉ tra một bảng tĩnh sinh sẵn lúc build. Muốn đổi luồng định tuyến phải cấu hình lại (qua công cụ như ARXML), không sửa runtime.</li>' +
'<li><strong>Quy ước đặt tên hàm <code>&lt;Module&gt;_&lt;Function&gt;()</code></strong> (như <code>CanIf_Transmit</code>, <code>PduR_CanIfRxIndication</code>) là chuẩn AUTOSAR — nhờ vậy module do nhà cung cấp khác nhau viết vẫn ghép nối được với nhau qua đúng những hàm này.</li>' +
'<li><strong>Com và Dcm không bao giờ dùng chung PduId</strong> cho cùng một CAN ID — PduR phân biệt hai luồng hoàn toàn dựa vào cấu hình PduId, không "đoán" dựa trên nội dung byte.</li>' +
'</ul>' +

'<div class="callout spec">' + co("zap") +
'<div class="callout-body"><div class="callout-title">Vì sao thiết kế phức tạp như vậy?</div>' +
'<p>Nhìn thoáng qua, 6 module cho một request 3 byte có vẻ rườm rà. Nhưng đổi lại: đổi CAN ID chỉ cần sửa cấu hình CanIf; đổi hãng vi điều khiển chỉ cần thay driver Can/CanTrcv; thêm một kênh chẩn đoán qua Ethernet (DoIP) chỉ cần thêm một module ngang hàng CanTp mà không đụng tới Dcm hay tầng ứng dụng. Đây chính là mục tiêu cốt lõi của AUTOSAR: tái sử dụng phần mềm giữa các ECU, các hãng và các thế hệ xe khác nhau.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Ôn lại</span>' +
'<p>Nếu phần byte-level ISO-TP ở mục 4 còn chưa chắc tay, quay lại <a href="#isotp">bài ISO-TP</a> để luyện thêm — module <strong>CanTp</strong> trong bài này chính là bản cài đặt phần mềm của đúng những gì đã học ở đó.</p></div></div>' +

'</div>'
      );
    }
  });

  function stackDiagram() {
    var boxes = [
      { label: "Application / SW-C (Diagnostic logic)", sub: "qua RTE", fill: "var(--c-purple-soft)", stroke: "var(--c-purple)", text: "var(--c-purple)" },
      { label: "Dcm — Diagnostic Communication Manager", sub: "hiểu SID, session, security", fill: "var(--c-brand-soft)", stroke: "var(--c-brand)", text: "var(--c-brand-strong)" },
      { label: "PduR — PDU Router", sub: "tra bảng, chuyển tiếp", fill: "var(--c-accent-soft)", stroke: "var(--c-accent)", text: "var(--c-accent)" },
      { label: "CanTp — Transport Protocol (ISO-TP)", sub: "phân mảnh / ghép SF·FF·CF·FC", fill: "var(--c-blue-soft)", stroke: "var(--c-blue)", text: "var(--c-blue)" },
      { label: "CanIf — CAN Interface", sub: "PduId ↔ CAN ID thật", fill: "var(--c-accent-soft)", stroke: "var(--c-accent)", text: "var(--c-accent)" },
      { label: "Can + CanTrcv Driver (MCAL)", sub: "thanh ghi phần cứng vi điều khiển", fill: "var(--c-green-soft)", stroke: "var(--c-green)", text: "var(--c-green)" },
      { label: "CAN Controller + Transceiver (HW)", sub: "arbitration, CRC, tín hiệu vi sai", fill: "var(--c-amber-soft)", stroke: "var(--c-amber)", text: "var(--c-amber)" }
    ];
    var bw = 420, bh = 46, gap = 30, x = 110;
    var top = 10;
    var svg = '<figure class="figure"><svg viewBox="0 0 640 ' + (top + boxes.length * (bh + gap) + 60) + '" width="100%" style="max-width:640px;margin:0 auto" role="img" aria-label="Sơ đồ ngăn xếp module AUTOSAR từ Application xuống CAN bus, với đường Rx đi lên và Tx đi xuống">' +
      '<style>svg .bt{font:700 12.5px var(--font-sans)}svg .bs{font:500 10px var(--font-sans);fill:var(--text-muted)}svg .lg{font:600 10px var(--font-sans);fill:var(--text-muted)}</style>' +
      '<defs>' +
      '<marker id="arUp" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto"><path d="M0,5 L5,0 L5,5 z" fill="var(--c-blue)"/></marker>' +
      '<marker id="arDown" markerWidth="7" markerHeight="7" refX="0" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="var(--c-green)"/></marker>' +
      '</defs>';
    var ys = [];
    boxes.forEach(function (b, i) {
      var y = top + i * (bh + gap);
      ys.push(y);
      svg += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="10" fill="' + b.fill + '" stroke="' + b.stroke + '"/>' +
        '<text class="bt" x="' + (x + bw / 2) + '" y="' + (y + 20) + '" text-anchor="middle" fill="' + b.text + '">' + b.label + '</text>' +
        '<text class="bs" x="' + (x + bw / 2) + '" y="' + (y + 36) + '" text-anchor="middle">' + b.sub + '</text>';
    });
    // Rx arrow (blue, pointing up) on the left of the stack, Tx arrow (green, pointing down) on the right
    var xRx = x - 24, xTx = x + bw + 24;
    var yFirst = ys[0], yLast = ys[ys.length - 1] + bh;
    svg += '<line x1="' + xRx + '" y1="' + (yFirst + bh / 2) + '" x2="' + xRx + '" y2="' + (yLast) + '" stroke="var(--c-blue)" stroke-width="2" marker-start="url(#arUp)"/>' +
      '<line x1="' + xTx + '" y1="' + (yFirst + bh / 2) + '" x2="' + xTx + '" y2="' + (yLast) + '" stroke="var(--c-green)" stroke-width="2" marker-end="url(#arDown)"/>';
    var legendY = yLast + 26;
    svg += '<text class="lg" x="' + xRx + '" y="' + legendY + '" text-anchor="middle" fill="var(--c-blue)">Rx: request đi lên</text>' +
      '<text class="lg" x="' + xTx + '" y="' + legendY + '" text-anchor="middle" fill="var(--c-green)">Tx: response đi xuống</text>' +
      '<text class="bs" x="' + (x + bw / 2) + '" y="' + (legendY + 22) + '" text-anchor="middle">CAN Bus (CAN_H / CAN_L)</text>';
    svg += '</svg></figure>';
    return svg;
  }
})();
