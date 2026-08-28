/* Page: Giới thiệu tổng quan */
(function () {
  var I = APP.icon;
  APP.register("intro", {
    title: "Giới thiệu",
    icon: "compass",
    keywords: "gioi thieu tong quan overview bus xe hoi ecu tai sao why bat dau",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("grad") + 'Bắt đầu học</span>' +
'<h1 class="page-title">CAN, CAN FD &amp; UDS — học từ số 0 đến thực hành</h1>' +
'<p class="page-lead">Một hành trình có cấu trúc giúp bạn hiểu cách các bộ điều khiển điện tử (ECU) trong ô tô "nói chuyện" với nhau qua mạng CAN, cách CAN FD nâng cấp nó, và cách kỹ thuật viên chẩn đoán xe bằng giao thức UDS — kèm các bài lab tương tác để tự tay dựng khung, gửi request và đọc response.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<div class="callout info">' + calloutIcon("info") +
'<div class="callout-body"><div class="callout-title">Bạn chưa biết gì về lĩnh vực này?</div>' +
'<p>Hoàn hảo. Trang web được viết cho đúng đối tượng đó. Hãy đọc lần lượt theo thứ tự trong sidebar từ trên xuống dưới — mỗi phần được xây dựng dựa trên phần trước. Cuối mỗi trang có nút <strong>Tiếp theo</strong> để đi đúng lộ trình.</p></div></div>' +

'<h2><span class="h2-num">?</span>Tại sao ô tô cần một "mạng"?</h2>' +
'<p>Một chiếc xe hiện đại có thể chứa từ vài chục đến hơn 100 <strong>ECU</strong> (Electronic Control Unit — bộ điều khiển điện tử): điều khiển động cơ, hộp số, phanh ABS, túi khí, điều hòa, cửa sổ, đèn, màn hình giải trí... Các ECU này liên tục cần trao đổi thông tin với nhau. Ví dụ: khi bạn đạp phanh gấp, ECU phanh cần báo cho ECU động cơ giảm ga, báo cho ECU đèn bật đèn phanh, báo cho hệ thống túi khí chuẩn bị.</p>' +
'<p>Nếu nối trực tiếp từng cặp ECU với nhau bằng dây riêng (point-to-point), số lượng dây điện sẽ bùng nổ, nặng, đắt và gần như không thể bảo trì. Giải pháp là dùng chung một <strong>bus</strong> — một "đường truyền chung" mà mọi ECU đều gắn vào, giống như nhiều người cùng nói chuyện trên một đường dây điện thoại hội nghị.</p>' +

'<div class="def-grid">' +
defItem("network", "Bus dùng chung", "Chỉ cần 2 dây, mọi ECU cùng nghe và cùng nói trên đó. Giảm mạnh khối lượng dây điện.") +
defItem("chip", "ECU / Node", "Mỗi bộ điều khiển gắn vào bus gọi là một node. Node vừa gửi vừa nhận.") +
defItem("message", "Message-based", "Dữ liệu được gửi theo từng bản tin (frame) có định danh, không phải theo địa chỉ người nhận.") +
'</div>' +

'<h2><span class="h2-num">≡</span>CAN, CAN FD, UDS liên quan thế nào?</h2>' +
'<p>Ba khái niệm này nằm ở ba tầng khác nhau — hãy hình dung như gửi thư qua bưu điện:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Khái niệm</th><th>Ví như…</th><th>Trả lời câu hỏi</th></tr></thead><tbody>' +
'<tr><td><strong>CAN / CAN FD</strong></td><td>Hệ thống đường xá &amp; xe chở thư</td><td>Dữ liệu được <em>vận chuyển</em> vật lý trên dây như thế nào? (bit, khung, tốc độ)</td></tr>' +
'<tr><td><strong>ISO-TP</strong></td><td>Cách chia một lá thư dày thành nhiều phong bì</td><td>Làm sao gửi dữ liệu <em>dài hơn</em> sức chứa một khung CAN?</td></tr>' +
'<tr><td><strong>UDS</strong></td><td>Ngôn ngữ &amp; nội dung lá thư</td><td>Máy chẩn đoán và ECU <em>nói gì</em> với nhau để đọc lỗi, lập trình lại?</td></tr>' +
'</tbody></table></div>' +
'<p>Nói cách khác: <strong>UDS chạy trên nền ISO-TP, ISO-TP chạy trên nền CAN/CAN FD.</strong> Trang này sẽ đi từ tầng thấp nhất (CAN) lên tầng cao nhất (UDS).</p>' +

'<h2><span class="h2-num">◇</span>Các chủ đề chính</h2>' +
'<div class="topic-grid">' +
topicCard("network", "linear-gradient(135deg,#4f46e5,#7c3aed)", "CAN Bus", "Nền tảng: lớp vật lý, cấu trúc khung, cơ chế phân xử (arbitration) và xử lý lỗi.", "can-basics") +
topicCard("zap", "linear-gradient(135deg,#0d9488,#059669)", "CAN FD", "Phiên bản nâng cấp: 64 byte dữ liệu, tốc độ data phase cao hơn.", "canfd") +
topicCard("message", "linear-gradient(135deg,#d97706,#dc2626)", "UDS", "Giao thức chẩn đoán ISO 14229: đọc DTC, đọc/ghi dữ liệu, security access, lập trình ECU.", "uds-intro") +
topicCard("flask", "linear-gradient(135deg,#2563eb,#0d9488)", "Labs tương tác", "Tự dựng khung CAN, xem arbitration từng bit, gửi request UDS tới ECU ảo.", "lab-can") +
'</div>' +

'<h2><span class="h2-num">↗</span>Lộ trình học đề xuất</h2>' +
'<ol class="steps">' +
'<li><strong>Hiểu CAN.</strong> Đọc lần lượt 5 phần trong nhóm "CAN Bus". Đây là nền tảng quan trọng nhất.</li>' +
'<li><strong>Thực hành ngay.</strong> Sau mỗi phần lý thuyết, mở lab tương ứng (CAN Frame Builder, Arbitration Simulator) để "sờ" vào khái niệm.</li>' +
'<li><strong>Nắm CAN FD.</strong> Chỉ cần hiểu nó khác CAN cổ điển ở đâu.</li>' +
'<li><strong>Học UDS.</strong> Đây là phần ứng dụng thực tế nhất với thợ chẩn đoán và kỹ sư. Kết thúc bằng UDS Simulator.</li>' +
'</ol>' +

'<div class="callout spec">' + calloutIcon("book") +
'<div class="callout-body"><div class="callout-title">Nguồn tham khảo</div>' +
'<p>Nội dung lý thuyết dựa trên các tiêu chuẩn công khai: <strong>ISO 11898-1</strong> (CAN &amp; CAN FD data link + physical signalling), <strong>Bosch CAN 2.0 (1991)</strong> và <strong>CAN FD Specification 1.0 (2012)</strong>, <strong>ISO 14229-1</strong> (UDS services), <strong>ISO 15765-2</strong> (ISO-TP / network layer), <strong>SAE J1979 &amp; J2012</strong> (OBD-II &amp; mã DTC). Các con số cụ thể (số bit từng trường, mã NRC, mã service) được lấy đúng theo tiêu chuẩn.</p></div></div>' +

'</div>'
      );
    }
  });

  /* local helpers */
  function calloutIcon(name) { return '<span class="callout-icon">' + I(name) + "</span>"; }
  function defItem(ic, title, desc) {
    return '<div class="def-item"><h4><span class="def-icon">' + I(ic) + "</span>" + title + "</h4><p>" + desc + "</p></div>";
  }
  function topicCard(ic, grad, title, desc, target) {
    return '<button class="topic-card" onclick="location.hash=\'#' + target + '\'">' +
      '<div class="tc-icon" style="background:' + grad + '">' + I(ic) + "</div>" +
      "<h3>" + title + "</h3><p>" + desc + "</p>" +
      '<span class="tc-arrow">Khám phá ' + I("arrowRight") + "</span></button>";
  }
})();
