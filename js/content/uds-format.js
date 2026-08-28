/* Page: UDS — Định dạng message */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("uds-format", {
    title: "Định dạng message",
    icon: "hash",
    keywords: "sid service identifier sub function positive response negative nrc 7f 0x40 suppress positive response bit pdu request response",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("hash") + 'UDS · Phần 2</span>' +
'<h1 class="page-title">Định dạng message UDS</h1>' +
'<p class="page-lead">Mọi giao dịch UDS đều tuân theo một khuôn mẫu đơn giản và nhất quán. Nắm vững khuôn mẫu này, bạn sẽ đọc được bất kỳ log UDS nào.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Cấu trúc request</h2>' +
'<p>Một request UDS gồm:</p>' +
'<div class="bitfield">' +
'<div class="bf-cell arb" style="flex:0 0 auto"><div class="bf-bits">1 byte</div><div class="bf-name">SID</div></div>' +
'<div class="bf-cell ctrl" style="flex:0 0 auto"><div class="bf-bits">0–1 byte</div><div class="bf-name">Sub-function</div></div>' +
'<div class="bf-cell data"><div class="bf-bits">0–n byte</div><div class="bf-name">Data parameters</div></div>' +
'</div>' +
'<ul>' +
'<li><strong>SID (Service Identifier):</strong> 1 byte cho biết yêu cầu dịch vụ gì (ví dụ <code>0x22</code> = ReadDataByIdentifier).</li>' +
'<li><strong>Sub-function:</strong> một số dịch vụ cần thêm 1 byte sub-function (ví dụ chọn loại session, loại reset). Nhiều dịch vụ không có.</li>' +
'<li><strong>Data parameters:</strong> tham số kèm theo (ví dụ số DID cần đọc, dữ liệu cần ghi).</li>' +
'</ul>' +

'<h2><span class="h2-num">2</span>Positive response — quy tắc "+0x40"</h2>' +
'<p>Khi ECU xử lý thành công, nó trả về <strong>Positive Response</strong>. Byte đầu tiên là:</p>' +
'<div class="callout spec">' + co("check") +
'<div class="callout-body"><p style="font-family:var(--font-mono);font-size:16px"><strong>Response SID = Request SID + 0x40</strong></p>' +
'<p>Ví dụ: request SID <code>0x22</code> → positive response bắt đầu bằng <code>0x62</code>. Request <code>0x10</code> → <code>0x50</code>. Request <code>0x2E</code> → <code>0x6E</code>. Sau byte này là các dữ liệu tương ứng (thường lặp lại tham số để xác nhận).</p></div></div>' +

'<div class="table-wrap"><table class="data"><thead><tr><th>Ví dụ</th><th>Bytes</th><th>Giải nghĩa</th></tr></thead><tbody>' +
'<tr><td>Request đọc VIN</td><td class="mono">22 F1 90</td><td>SID 0x22, DID 0xF190 (VIN)</td></tr>' +
'<tr><td>Positive response</td><td class="mono">62 F1 90 57 30 4C ...</td><td>0x62 (=0x22+0x40), lặp DID F190, rồi dữ liệu VIN (ASCII)</td></tr>' +
'</tbody></table></div>' +

'<h2><span class="h2-num">3</span>Negative response — khuôn <code>7F</code></h2>' +
'<p>Khi ECU <em>không</em> thực hiện được yêu cầu, nó trả về <strong>Negative Response</strong> theo khuôn cố định 3 byte:</p>' +
'<div class="bitfield">' +
'<div class="bf-cell crc" style="flex:0 0 auto"><div class="bf-bits">byte 0</div><div class="bf-name">0x7F</div></div>' +
'<div class="bf-cell arb" style="flex:0 0 auto"><div class="bf-bits">byte 1</div><div class="bf-name">SID gốc</div></div>' +
'<div class="bf-cell data" style="flex:0 0 auto"><div class="bf-bits">byte 2</div><div class="bf-name">NRC</div></div>' +
'</div>' +
'<ul>' +
'<li><code>0x7F</code>: mã báo "đây là negative response".</li>' +
'<li><strong>SID gốc:</strong> nhắc lại dịch vụ nào bị từ chối (SID của request, KHÔNG cộng 0x40).</li>' +
'<li><strong>NRC (Negative Response Code):</strong> 1 byte cho biết <em>lý do</em> từ chối.</li>' +
'</ul>' +
'<div class="callout warn">' + co("alert") +
'<div class="callout-body"><p>Ví dụ: <code>7F 22 31</code> nghĩa là dịch vụ <code>0x22</code> (ReadDataByIdentifier) bị từ chối với NRC <code>0x31</code> = <em>requestOutOfRange</em> (DID không tồn tại/không hỗ trợ).</p></div></div>' +

'<h2><span class="h2-num">4</span>Bảng NRC thường gặp</h2>' +
'<p>Đây là các mã NRC (theo ISO 14229) bạn sẽ gặp nhiều nhất. Ghi nhớ vài mã đầu sẽ giúp bạn chẩn đoán rất nhanh:</p>' +
nrcTable() +

'<h2><span class="h2-num">5</span>NRC 0x78 — "đang xử lý, chờ chút"</h2>' +
'<p>Mã <code>0x78</code> (<em>requestCorrectlyReceived–ResponsePending</em>) là một cơ chế đặc biệt: ECU báo "tôi đã nhận đúng request nhưng cần thêm thời gian". ECU có thể gửi <code>7F xx 78</code> nhiều lần để "gia hạn" (giữ cho client không bị timeout), rồi cuối cùng gửi positive response thật. Thường gặp khi thao tác tốn thời gian như xóa DTC, xóa bộ nhớ, chạy routine.</p>' +

'<h2><span class="h2-num">6</span>Suppress Positive Response Bit</h2>' +
'<p>Với các dịch vụ có sub-function, <strong>bit 7 (0x80) của byte sub-function</strong> là <em>suppressPosRspMsgIndicationBit</em>. Nếu bit này = 1, client yêu cầu ECU <strong>không gửi positive response</strong> (nhưng vẫn gửi negative response nếu có lỗi). Rất hữu ích cho <code>TesterPresent</code> gửi định kỳ — không muốn làm ngập bus bằng các phản hồi.</p>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Ví dụ: <code>3E 80</code> = TesterPresent (0x3E) với sub-function 0x00 nhưng đặt bit suppress (0x00 | 0x80 = 0x80) → ECU giữ phiên nhưng im lặng. Khi tính sub-function thực, ECU bỏ (mask) bit 0x80 đi: 0x80 &amp; 0x7F = 0x00.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Giờ đến phần "danh mục dịch vụ": <a href="#uds-services">Services &amp; Sessions</a> — các SID quan trọng nhất và ý nghĩa của diagnostic session.</p></div></div>' +

'</div>'
      );
    }
  });

  function nrcTable() {
    var rows = [
      ["0x10","generalReject","Từ chối chung, không rơi vào lý do cụ thể nào khác."],
      ["0x11","serviceNotSupported","ECU không hỗ trợ dịch vụ (SID) này."],
      ["0x12","subFunctionNotSupported","Sub-function không hợp lệ cho dịch vụ này."],
      ["0x13","incorrectMessageLengthOrInvalidFormat","Độ dài/định dạng message sai."],
      ["0x22","conditionsNotCorrect","Điều kiện hiện tại không cho phép (ví dụ động cơ đang chạy)."],
      ["0x24","requestSequenceError","Sai trình tự (ví dụ gửi bước 2 khi chưa làm bước 1)."],
      ["0x31","requestOutOfRange","Tham số ngoài phạm vi — thường là DID/địa chỉ không tồn tại."],
      ["0x33","securityAccessDenied","Chưa mở khóa bảo mật — cần Security Access trước."],
      ["0x35","invalidKey","Key gửi lên không đúng (trong Security Access)."],
      ["0x36","exceedNumberOfAttempts","Vượt quá số lần thử key cho phép."],
      ["0x37","requiredTimeDelayNotExpired","Phải chờ hết thời gian trễ mới được thử lại."],
      ["0x78","requestCorrectlyReceived-ResponsePending","Đã nhận đúng, đang xử lý — chờ thêm."],
      ["0x7E","subFunctionNotSupportedInActiveSession","Sub-function không dùng được ở session hiện tại."],
      ["0x7F","serviceNotSupportedInActiveSession","Dịch vụ không dùng được ở session hiện tại."]
    ];
    var html = '<div class="table-wrap"><table class="data"><thead><tr><th>NRC</th><th>Tên (ISO 14229)</th><th>Ý nghĩa</th></tr></thead><tbody>';
    rows.forEach(function(r){ html += '<tr><td><code>'+r[0]+'</code></td><td class="mono" style="font-size:13px">'+r[1]+'</td><td>'+r[2]+'</td></tr>'; });
    html += '</tbody></table></div>';
    return html;
  }
})();
