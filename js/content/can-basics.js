/* Page: CAN — Tổng quan */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  function def(ic,t,d){return '<div class="def-item"><h4><span class="def-icon">'+I(ic)+"</span>"+t+"</h4><p>"+d+"</p></div>";}

  APP.register("can-basics", {
    title: "CAN — Tổng quan",
    icon: "network",
    keywords: "can la gi controller area network bosch multi master csma tong quan lich su",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("network") + 'CAN Bus · Phần 1</span>' +
'<h1 class="page-title">CAN là gì?</h1>' +
'<p class="page-lead">CAN (Controller Area Network) là một chuẩn bus nối tiếp (serial bus) do Bosch phát triển, cho phép nhiều bộ điều khiển giao tiếp với nhau qua một cặp dây chung mà không cần máy tính trung tâm điều phối.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Định nghĩa &amp; lịch sử</h2>' +
'<p><strong>CAN (Controller Area Network)</strong> được hãng <strong>Robert Bosch GmbH</strong> giới thiệu chính thức năm <strong>1986</strong> tại hội nghị SAE, và con chip CAN controller đầu tiên được Intel và Philips sản xuất năm 1987. Mục tiêu ban đầu là giảm khối lượng dây dẫn trong ô tô. Ngày nay CAN được chuẩn hóa quốc tế trong bộ tiêu chuẩn <strong>ISO 11898</strong>.</p>' +
'<p>CAN không chỉ dùng trong ô tô — nó còn phổ biến trong xe tải, máy nông nghiệp, thiết bị y tế, tự động hóa công nghiệp, thang máy và hàng không, nhờ tính đơn giản, chi phí thấp và độ tin cậy cao.</p>' +

'<div class="callout spec">' + co("book") +
'<div class="callout-body"><div class="callout-title">Chuẩn hóa</div>' +
'<p><strong>ISO 11898-1</strong>: tầng liên kết dữ liệu (Data Link Layer) và tín hiệu vật lý. <strong>ISO 11898-2</strong>: lớp vật lý tốc độ cao (High-speed CAN, đến 1 Mbit/s). <strong>ISO 11898-3</strong>: lớp vật lý tốc độ thấp/chịu lỗi (Low-speed/Fault-tolerant CAN). Đặc tả gốc của Bosch: <em>CAN Specification 2.0</em> (1991), gồm phần A (11-bit) và B (29-bit).</p></div></div>' +

'<h2><span class="h2-num">2</span>Những đặc điểm cốt lõi</h2>' +
'<div class="def-grid">' +
def("network", "Multi-master", "Bất kỳ node nào cũng có thể chủ động gửi khi bus rảnh — không có node \"chủ\" duy nhất điều phối.") +
def("message", "Message-oriented", "Frame được nhận diện bằng Identifier mô tả nội dung/độ ưu tiên, KHÔNG phải địa chỉ node đích. Một frame gửi ra, mọi node đều nhận (broadcast).") +
def("merge", "Arbitration phi phá hủy", "Khi nhiều node gửi cùng lúc, cơ chế phân xử theo từng bit chọn ra frame ưu tiên cao nhất mà không làm hỏng dữ liệu của nó.") +
def("shield", "Phát hiện lỗi mạnh", "Nhiều cơ chế (CRC, ACK, bit-stuffing, giám sát bit) đảm bảo lỗi được phát hiện với xác suất rất cao, kèm cơ chế cô lập node hỏng.") +
'</div>' +

'<h2><span class="h2-num">3</span>CSMA/CR — cách CAN chia sẻ đường truyền</h2>' +
'<p>CAN dùng phương pháp truy cập <strong>CSMA/CR</strong> (Carrier Sense Multiple Access with Collision Resolution):</p>' +
'<ul>' +
'<li><strong>Carrier Sense (CS):</strong> mỗi node lắng nghe bus trước khi gửi; chỉ bắt đầu gửi khi bus đang rảnh (idle).</li>' +
'<li><strong>Multiple Access (MA):</strong> nhiều node có quyền dùng chung bus.</li>' +
'<li><strong>Collision Resolution (CR):</strong> nếu hai node vô tình bắt đầu gửi cùng lúc, thay vì "va chạm" phá hỏng cả hai (như Ethernet cổ điển làm với Collision Detection), CAN <em>giải quyết</em> va chạm bằng arbitration — frame ưu tiên cao thắng và tiếp tục, frame kia tự lùi lại. Không mất dữ liệu, không cần gửi lại từ đầu.</li>' +
'</ul>' +
'<div class="callout tip">' + co("check") +
'<div class="callout-body"><p>Chi tiết cơ chế arbitration được trình bày kỹ ở phần <a href="#can-arbitration">Arbitration</a>, và bạn có thể xem trực quan từng bit trong <a href="#lab-arbitration">Lab: Arbitration Simulator</a>.</p></div></div>' +

'<h2><span class="h2-num">4</span>Classical CAN — các thông số quan trọng</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Thuộc tính</th><th>Giá trị</th><th>Ghi chú</th></tr></thead><tbody>' +
'<tr><td>Tốc độ tối đa</td><td><code>1 Mbit/s</code></td><td>Với High-speed CAN (ISO 11898-2). Tốc độ càng cao thì chiều dài bus càng phải ngắn.</td></tr>' +
'<tr><td>Payload tối đa</td><td><code>8 byte</code></td><td>Mỗi data frame chở tối đa 8 byte dữ liệu.</td></tr>' +
'<tr><td>Identifier</td><td><code>11 bit</code> hoặc <code>29 bit</code></td><td>Base frame format (CAN 2.0A) và Extended frame format (CAN 2.0B).</td></tr>' +
'<tr><td>Số node</td><td>~ đến 110</td><td>Phụ thuộc lớp vật lý/transceiver và tải điện của bus.</td></tr>' +
'<tr><td>Chiều dài bus</td><td>~40 m @ 1 Mbit/s</td><td>Ví dụ ~500 m @ 125 kbit/s. Tốc độ và chiều dài đánh đổi lẫn nhau.</td></tr>' +
'<tr><td>Môi trường truyền</td><td>Cặp dây xoắn</td><td>CAN_H và CAN_L, tín hiệu vi sai (differential) chống nhiễu tốt.</td></tr>' +
'</tbody></table></div>' +

'<h2><span class="h2-num">5</span>Mô hình phân tầng</h2>' +
'<p>CAN chỉ định nghĩa hai tầng thấp nhất của mô hình OSI:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Tầng OSI</th><th>CAN phụ trách gì</th></tr></thead><tbody>' +
'<tr><td><strong>Data Link Layer</strong> (tầng 2)</td><td>Định dạng khung, arbitration, ACK, phát hiện lỗi, bit-stuffing. Gồm 2 phân tầng: LLC (Logical Link Control) và MAC (Medium Access Control).</td></tr>' +
'<tr><td><strong>Physical Layer</strong> (tầng 1)</td><td>Mức điện áp, định thời bit (bit timing), đồng bộ, kiểu dây, transceiver.</td></tr>' +
'</tbody></table></div>' +
'<p>Các tầng cao hơn (như cách sắp xếp dữ liệu ứng dụng, chẩn đoán…) do các giao thức bên trên đảm nhiệm — ví dụ <strong>CANopen</strong>, <strong>SAE J1939</strong>, hay chính <strong>UDS</strong> mà chúng ta sẽ học ở phần sau.</p>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Ta sẽ đi xuống tầng thấp nhất: <a href="#can-physical">Lớp vật lý</a> — cách các bit 0 và 1 được biểu diễn bằng điện áp trên dây, và khái niệm quan trọng nhất của CAN: <em>dominant</em> vs <em>recessive</em>.</p></div></div>' +

'</div>'
      );
    }
  });
})();
