/* Page: UDS — Giới thiệu */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  function def(ic,t,d){return '<div class="def-item"><h4><span class="def-icon">'+I(ic)+"</span>"+t+"</h4><p>"+d+"</p></div>";}

  APP.register("uds-intro", {
    title: "UDS — Giới thiệu",
    icon: "message",
    keywords: "uds unified diagnostic services iso 14229 chan doan client server tester ecu doip obd",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("message") + 'UDS · Phần 1</span>' +
'<h1 class="page-title">UDS là gì?</h1>' +
'<p class="page-lead">UDS (Unified Diagnostic Services) là giao thức chẩn đoán tiêu chuẩn hóa trong ISO 14229, cho phép công cụ chẩn đoán "hỏi chuyện" các ECU: đọc mã lỗi, đọc dữ liệu cảm biến, ghi cấu hình, chạy routine, và thậm chí nạp lại phần mềm.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Định nghĩa</h2>' +
'<p><strong>UDS (Unified Diagnostic Services)</strong> được chuẩn hóa trong <strong>ISO 14229</strong>. "Unified" (thống nhất) vì nó gộp và chuẩn hóa các dịch vụ chẩn đoán vốn trước đây rời rạc giữa các hãng. UDS là <em>giao thức tầng ứng dụng</em>: nó định nghĩa <strong>nội dung</strong> bản tin chẩn đoán (dịch vụ nào, tham số gì, phản hồi ra sao), không phụ thuộc vào việc truyền qua đường nào.</p>' +
'<div class="callout spec">' + co("layers") +
'<div class="callout-body"><div class="callout-title">UDS chạy trên nhiều "đường"</div>' +
'<p>UDS có thể truyền trên <strong>CAN/CAN FD</strong> (qua ISO-TP / ISO 15765), <strong>DoIP</strong> (Diagnostics over IP / Ethernet, ISO 13400), <strong>FlexRay</strong>, <strong>LIN</strong>, K-Line... Trong khóa học này ta tập trung vào UDS trên CAN — phổ biến nhất.</p></div></div>' +

'<h2><span class="h2-num">2</span>Mô hình Client–Server</h2>' +
'<p>UDS hoạt động theo mô hình <strong>yêu cầu–đáp ứng</strong> (request–response):</p>' +
'<div class="def-grid">' +
def("tool", "Client (Tester)", "Công cụ chẩn đoán — máy scan, thiết bị lập trình, phần mềm của kỹ sư. Luôn là bên chủ động gửi request.") +
def("cpu", "Server (ECU)", "Bộ điều khiển trên xe. Nhận request, xử lý và gửi response. Không tự ý gửi khi chưa được hỏi.") +
'</div>' +
'<p>Client gửi một <strong>request</strong>, ECU trả về một <strong>response</strong> (khẳng định hoặc phủ định). Đây là điểm khác biệt lớn với các bản tin CAN thông thường (vốn phát định kỳ, không cần hỏi).</p>' +

diagramFlow() +

'<h2><span class="h2-num">3</span>UDS dùng để làm gì?</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Nhóm chức năng</th><th>Ví dụ thực tế</th></tr></thead><tbody>' +
'<tr><td><strong>Đọc lỗi (DTC)</strong></td><td>Đọc danh sách mã lỗi đang lưu trong ECU, xóa lỗi sau khi sửa.</td></tr>' +
'<tr><td><strong>Đọc dữ liệu</strong></td><td>Đọc số VIN, phiên bản phần mềm, số serial, giá trị cảm biến theo thời gian thực.</td></tr>' +
'<tr><td><strong>Ghi dữ liệu / cấu hình</strong></td><td>Cài đặt thông số, coding/variant, hiệu chỉnh (calibration).</td></tr>' +
'<tr><td><strong>Điều khiển</strong></td><td>Kích hoạt actuator để kiểm tra (bật quạt, mở van), chạy routine tự kiểm tra.</td></tr>' +
'<tr><td><strong>Lập trình lại (Flashing)</strong></td><td>Nạp firmware mới vào ECU — quy trình bảo mật nhiều bước.</td></tr>' +
'</tbody></table></div>' +

'<h2><span class="h2-num">4</span>UDS và OBD-II khác gì nhau?</h2>' +
'<p>Nhiều người nhầm hai khái niệm này:</p>' +
'<ul>' +
'<li><strong>OBD-II</strong> (theo SAE J1979 / ISO 15031) là bộ chẩn đoán <em>bắt buộc theo luật</em>, chủ yếu phục vụ kiểm soát khí thải, với tập lệnh hạn chế và công khai (ví dụ Mode 01–0A). Bất kỳ máy scan phổ thông nào cũng đọc được.</li>' +
'<li><strong>UDS</strong> (ISO 14229) rộng hơn nhiều, phục vụ chẩn đoán/lập trình sâu của hãng, gồm cả các chức năng cần bảo mật (Security Access). Một số dịch vụ UDS và OBD dùng chung nền vận chuyển (ISO-TP trên CAN).</li>' +
'</ul>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Có thể hình dung: OBD-II là "khám tổng quát theo quy định", còn UDS là "bộ công cụ chuyên sâu của kỹ sư hãng". Mã DTC dạng P/C/B/U mà bạn thấy ở cả hai đều theo chuẩn <strong>SAE J2012</strong>.</p></div></div>' +

'<h2><span class="h2-num">5</span>Định địa chỉ: Physical vs Functional</h2>' +
'<p>Client có thể gửi request theo hai kiểu:</p>' +
'<ul>' +
'<li><strong>Physical addressing (1–1):</strong> gửi tới đúng <em>một</em> ECU cụ thể (một request ID, một response ID). Dùng khi làm việc với một ECU.</li>' +
'<li><strong>Functional addressing (1–nhiều):</strong> gửi tới <em>nhiều</em> ECU cùng lúc qua một ID chung (ví dụ "TesterPresent" để giữ phiên cho tất cả). Các ECU liên quan sẽ phản hồi.</li>' +
'</ul>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Ta sẽ mổ xẻ <a href="#uds-format">Định dạng message UDS</a>: SID, sub-function, positive/negative response và mã NRC — nền tảng để đọc mọi giao dịch UDS.</p></div></div>' +

'</div>'
      );
    }
  });

  function diagramFlow() {
    return (
'<figure class="figure"><svg viewBox="0 0 640 150" width="100%" style="max-width:600px;margin:0 auto" role="img" aria-label="Sơ đồ trao đổi request response giữa Tester và ECU">' +
  '<style>svg .b{rx:12;stroke-width:2}svg .t{font:700 14px var(--font-sans)}svg .m{font:600 12px var(--font-mono)}svg .a{stroke-width:2;fill:none}</style>' +
  '<defs><marker id="ah2" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="var(--c-blue)"/></marker>' +
  '<marker id="ah3" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="var(--c-green)"/></marker></defs>' +
  '<rect x="20" y="45" width="150" height="60" rx="12" fill="var(--c-brand-soft)" stroke="var(--c-brand)"/>' +
  '<text class="t" x="95" y="80" text-anchor="middle" fill="var(--c-brand-strong)">Tester (Client)</text>' +
  '<rect x="470" y="45" width="150" height="60" rx="12" fill="var(--c-accent-soft)" stroke="var(--c-accent)"/>' +
  '<text class="t" x="545" y="80" text-anchor="middle" fill="var(--c-accent)">ECU (Server)</text>' +
  '<path class="a" d="M175,65 L465,65" stroke="var(--c-blue)" marker-end="url(#ah2)"/>' +
  '<text class="m" x="320" y="58" text-anchor="middle" fill="var(--c-blue)">Request: 22 F1 90</text>' +
  '<path class="a" d="M465,90 L175,90" stroke="var(--c-green)" marker-end="url(#ah3)"/>' +
  '<text class="m" x="320" y="108" text-anchor="middle" fill="var(--c-green)">Response: 62 F1 90 ...</text>' +
'</svg><figcaption>Ví dụ: đọc VIN (DID F190). Response = SID+0x40 rồi lặp lại DID kèm dữ liệu.</figcaption></figure>'
    );
  }
})();
