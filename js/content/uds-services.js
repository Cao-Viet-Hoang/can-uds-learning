/* Page: UDS — Services & Sessions */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}

  APP.register("uds-services", {
    title: "Services & Sessions",
    icon: "database",
    keywords: "service sid 0x10 0x11 0x22 0x2e 0x19 0x14 0x27 0x31 0x3e 0x34 0x36 session default programming extended did dtc routine ecureset readdatabyidentifier writedatabyidentifier readdtcinformation",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("database") + 'UDS · Phần 3</span>' +
'<h1 class="page-title">Services &amp; Diagnostic Sessions</h1>' +
'<p class="page-lead">ISO 14229 định nghĩa một danh mục dịch vụ. Bạn không cần thuộc lòng tất cả — chỉ cần nắm chắc khoảng 10 dịch vụ cốt lõi là đủ dùng cho hầu hết công việc chẩn đoán.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Diagnostic Session — "chế độ làm việc" của ECU</h2>' +
'<p>Trước khi hiểu các dịch vụ, phải hiểu <strong>session</strong>. ECU luôn ở trong một "session" — quyết định những dịch vụ nào được phép dùng. Dịch vụ <code>0x10 DiagnosticSessionControl</code> dùng để chuyển session.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Session</th><th>Mã</th><th>Mục đích</th></tr></thead><tbody>' +
'<tr><td><strong>Default</strong></td><td><code>0x01</code></td><td>Trạng thái bình thường sau khi ECU khởi động. Chỉ cho phép các dịch vụ cơ bản (đọc DTC, đọc dữ liệu…). ECU luôn tự về đây khi mất phiên.</td></tr>' +
'<tr><td><strong>Programming</strong></td><td><code>0x02</code></td><td>Dành cho việc nạp lại phần mềm (flashing). Thường yêu cầu Security Access và chạy trên bootloader.</td></tr>' +
'<tr><td><strong>Extended Diagnostic</strong></td><td><code>0x03</code></td><td>Mở khóa nhiều dịch vụ nâng cao: ghi dữ liệu, điều khiển actuator, routine… Rất hay dùng.</td></tr>' +
'<tr><td><strong>Safety System</strong></td><td><code>0x04</code></td><td>Cho các thao tác liên quan an toàn (ví dụ hệ thống túi khí).</td></tr>' +
'</tbody></table></div>' +
'<div class="callout warn">' + co("clock") +
'<div class="callout-body"><div class="callout-title">Session sẽ hết hạn (S3 timeout)</div>' +
'<p>Khi đang ở session khác Default, client phải gửi <code>TesterPresent (0x3E)</code> định kỳ (thường mỗi ~2 giây) để "giữ phiên". Nếu ECU không nhận được trong khoảng thời gian <strong>S3</strong> (thường ~5 giây), nó tự động quay về Default session và khóa lại các quyền nâng cao.</p></div></div>' +

'<h2><span class="h2-num">2</span>Các dịch vụ cốt lõi (nên thuộc)</h2>' +
serviceTable() +

'<h2><span class="h2-num">3</span>Data Identifier (DID) là gì?</h2>' +
'<p>Nhiều dịch vụ làm việc với <strong>DID (Data Identifier)</strong> — một số 2 byte đặt tên cho một mẩu dữ liệu trong ECU. Ví dụ đọc DID = đọc mẩu dữ liệu tương ứng.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>DID</th><th>Nội dung (theo ISO 14229-1 phần định danh chuẩn)</th></tr></thead><tbody>' +
'<tr><td><code>0xF190</code></td><td>VIN (Vehicle Identification Number)</td></tr>' +
'<tr><td><code>0xF186</code></td><td>Active Diagnostic Session (session đang hoạt động)</td></tr>' +
'<tr><td><code>0xF187</code></td><td>Vehicle Manufacturer Spare Part Number</td></tr>' +
'<tr><td><code>0xF189</code></td><td>Vehicle Manufacturer ECU Software Version Number</td></tr>' +
'<tr><td><code>0xF18C</code></td><td>ECU Serial Number</td></tr>' +
'</tbody></table></div>' +
'<p class="muted">Dải <code>0xF1xx</code> phần lớn là DID định danh chuẩn hóa; các hãng còn định nghĩa DID riêng trong những dải khác.</p>' +

'<h2><span class="h2-num">4</span>DTC — mã lỗi chẩn đoán</h2>' +
'<p>Dịch vụ <code>0x19 ReadDTCInformation</code> đọc <strong>DTC (Diagnostic Trouble Code)</strong>. Mỗi DTC gồm mã lỗi (thường 3 byte) + 1 byte <em>status</em> mô tả trạng thái (đang lỗi, đã từng lỗi, chưa xác nhận…). Dịch vụ này có nhiều sub-function, phổ biến nhất:</p>' +
'<ul>' +
'<li><code>0x02 reportDTCByStatusMask</code>: liệt kê DTC khớp với một mặt nạ trạng thái (ví dụ chỉ lấy DTC "confirmed").</li>' +
'<li><code>0x01 reportNumberOfDTCByStatusMask</code>: đếm số DTC khớp mặt nạ.</li>' +
'<li><code>0x0A reportSupportedDTC</code>: liệt kê mọi DTC mà ECU hỗ trợ.</li>' +
'</ul>' +
'<p>Định dạng mã DTC dạng chữ (P/C/B/U) theo <strong>SAE J2012</strong> — bạn có thể giải mã ở <a href="#lab-dtc">Lab: DTC Decoder</a>.</p>' +

'<h2><span class="h2-num">5</span>RoutineControl (0x31)</h2>' +
'<p>Dịch vụ <code>0x31</code> cho phép chạy một "thủ tục" định sẵn trong ECU (ví dụ tự kiểm tra, hiệu chỉnh, xóa vùng nhớ). Nó có 3 sub-function:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Sub-function</th><th>Ý nghĩa</th></tr></thead><tbody>' +
'<tr><td><code>0x01</code> startRoutine</td><td>Bắt đầu chạy routine.</td></tr>' +
'<tr><td><code>0x02</code> stopRoutine</td><td>Dừng routine.</td></tr>' +
'<tr><td><code>0x03</code> requestRoutineResults</td><td>Hỏi kết quả routine.</td></tr>' +
'</tbody></table></div>' +
'<p>Mỗi routine có một <strong>Routine Identifier</strong> 2 byte đi kèm, tương tự DID.</p>' +

'<h2><span class="h2-num">6</span>Chuỗi dịch vụ khi flashing (tổng quan)</h2>' +
'<p>Nạp lại firmware là kịch bản phức tạp nhất, kết hợp nhiều dịch vụ theo trình tự:</p>' +
'<ol class="steps">' +
'<li><code>0x10 02</code> — chuyển sang Programming Session.</li>' +
'<li><code>0x27</code> — Security Access (seed/key) để mở khóa.</li>' +
'<li><code>0x34</code> RequestDownload — khai báo địa chỉ &amp; kích thước dữ liệu sẽ nạp.</li>' +
'<li><code>0x36</code> TransferData — truyền dữ liệu theo từng block (lặp nhiều lần).</li>' +
'<li><code>0x37</code> RequestTransferExit — kết thúc truyền.</li>' +
'<li><code>0x31</code> RoutineControl — kiểm tra tính toàn vẹn (checksum) &amp; kích hoạt firmware mới.</li>' +
'<li><code>0x11</code> ECUReset — khởi động lại ECU với firmware mới.</li>' +
'</ol>' +
'<div class="callout danger">' + co("alert") +
'<div class="callout-body"><p>Flashing sai có thể làm "chết" (brick) ECU. Đây là lý do quy trình được bảo vệ bằng Security Access, kiểm tra checksum và trình tự nghiêm ngặt (NRC <code>0x24</code> requestSequenceError bảo vệ trình tự này).</p></div></div>' +

'<div class="callout info">' + co("flask") +
'<div class="callout-body"><p><strong>Thực hành:</strong> <a href="#lab-uds">Lab: UDS Simulator</a> mô phỏng một ECU ảo hỗ trợ 0x10, 0x11, 0x22, 0x2E, 0x27, 0x19, 0x14, 0x31, 0x3E — bạn gửi request và nhận response/NRC đúng theo trạng thái session &amp; security.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Một trong những dịch vụ quan trọng và hay gây bối rối nhất: <a href="#uds-security">Security Access (0x27)</a> — cơ chế seed &amp; key.</p></div></div>' +

'</div>'
      );
    }
  });

  function serviceTable() {
    var rows = [
      ["0x10","DiagnosticSessionControl","Chuyển diagnostic session.","có"],
      ["0x11","ECUReset","Yêu cầu ECU khởi động lại (hard/soft reset).","có"],
      ["0x27","SecurityAccess","Mở khóa bằng cơ chế seed &amp; key.","có"],
      ["0x28","CommunicationControl","Bật/tắt việc gửi/nhận bản tin giao tiếp thông thường.","có"],
      ["0x3E","TesterPresent","Giữ phiên (session) khỏi bị timeout.","có"],
      ["0x22","ReadDataByIdentifier","Đọc dữ liệu theo DID.","không"],
      ["0x2E","WriteDataByIdentifier","Ghi dữ liệu theo DID.","không"],
      ["0x23","ReadMemoryByAddress","Đọc bộ nhớ theo địa chỉ.","không"],
      ["0x19","ReadDTCInformation","Đọc thông tin mã lỗi (DTC).","có"],
      ["0x14","ClearDiagnosticInformation","Xóa DTC &amp; dữ liệu chẩn đoán liên quan.","không"],
      ["0x2F","InputOutputControlByIdentifier","Điều khiển vào/ra (kích actuator để test).","không"],
      ["0x31","RoutineControl","Chạy/dừng/lấy kết quả routine.","có"],
      ["0x34","RequestDownload","Khởi tạo quá trình tải dữ liệu xuống ECU.","không"],
      ["0x36","TransferData","Truyền khối dữ liệu (download/upload).","không"],
      ["0x37","RequestTransferExit","Kết thúc truyền dữ liệu.","không"],
      ["0x85","ControlDTCSetting","Bật/tắt việc ECU cập nhật DTC.","có"]
    ];
    var html = '<div class="table-wrap"><table class="data"><thead><tr><th>SID</th><th>Tên dịch vụ</th><th>Mô tả</th><th>Sub-fn?</th></tr></thead><tbody>';
    rows.forEach(function(r){
      html += '<tr><td><code>'+r[0]+'</code></td><td><strong>'+r[1]+'</strong></td><td>'+r[2]+'</td><td>'+(r[3]==="có"?'<span class="badge brand">có</span>':'<span class="badge">không</span>')+'</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }
})();
