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

'<h2><span class="h2-num">6</span>Ví dụ chuỗi giao tiếp UDS trong thực tế</h2>' +
'<p>Các mục trên giải thích từng dịch vụ riêng lẻ. Trong thực tế, một phiên chẩn đoán luôn là <strong>chuỗi nhiều dịch vụ nối tiếp nhau</strong>. Dưới đây là 5 kịch bản đầy đủ, đúng theo cấu trúc byte của ISO 14229-1. Cấu trúc từng byte (SID, sub-function, +0x40, NRC…) là chuẩn hoá; riêng các <em>giá trị</em> như seed/key, địa chỉ bộ nhớ hay Routine Identifier tuỳ theo từng hãng/ECU — những chỗ đó được ghi rõ là "ví dụ minh hoạ".</p>' +

'<h3>6.1 Đọc thông tin định danh ECU (kịch bản hay gặp nhất)</h3>' +
'<p>Tool chẩn đoán mở phiên mở rộng, đọc vài DID định danh để hiển thị lên màn hình, rồi giữ phiên bằng TesterPresent trong lúc kỹ thuật viên xem thông tin.</p>' +
seqTable([
  ["1","Chuyển sang Extended Session","<span class=\"mono\">10 03</span>","<span class=\"mono\">50 03 00 32 01 F4</span>","P2Server_max=0x0032=50&nbsp;ms; P2*Server_max=0x01F4×10&nbsp;ms=5000&nbsp;ms."],
  ["2","Đọc VIN (DID 0xF190)","<span class=\"mono\">22 F1 90</span>","<span class=\"mono\">62 F1 90 57 56 57 5A 5A 5A 31 4A 5A 58 57 30 30 30 30 30 31</span>","Giải ASCII 17 byte cuối → <code>\"WVWZZZ1JZXW000001\"</code> (VIN minh hoạ, dùng lại từ ví dụ ISO-TP)."],
  ["3","Đọc phiên đang hoạt động (DID 0xF186)","<span class=\"mono\">22 F1 86</span>","<span class=\"mono\">62 F1 86 03</span>","Byte cuối 0x03 = đang ở Extended Session — khớp session vừa chuyển ở bước 1."],
  ["4","Giữ phiên — lặp lại mỗi ~2 giây","<span class=\"mono\">3E 00</span>","<span class=\"mono\">7E 00</span>","Bắt buộc nếu không muốn ECU tự rơi về Default sau S3 timeout (mục 1)."],
  ["5","Xong việc, trả về Default Session","<span class=\"mono\">10 01</span>","<span class=\"mono\">50 01 00 32 01 F4</span>","Không bắt buộc — ECU cũng tự về Default nếu ngừng gửi TesterPresent."]
]) +

'<h3>6.2 Chẩn đoán lỗi &amp; xoá sau khi sửa xong</h3>' +
'<p>Quy trình chuẩn của kỹ thuật viên: đọc DTC để biết ECU đang báo lỗi gì, sửa/thay phần cứng, rồi xoá DTC và đọc lại để xác nhận đã sạch.</p>' +
seqTable([
  ["1","Đọc DTC đang \"confirmed\" hoặc đang lỗi","<span class=\"mono\">19 02 09</span>","<span class=\"mono\">59 02 09 01 33 09</span>","Mask 0x09 = bit0 (testFailed) + bit3 (confirmedDTC). DTC <span class=\"mono\">01 33</span> ứng với mã OBD-II chuẩn <strong>P0133</strong> (O2 Sensor Circuit Slow Response); status <span class=\"mono\">09</span> = 0000&nbsp;1001₂ = testFailed + confirmedDTC."],
  ["2","<em>(Kỹ thuật viên thay cảm biến, không phải gói tin UDS)</em>","—","—","Đây là bước sửa chữa vật lý, không có giao dịch trên bus."],
  ["3","Xoá toàn bộ DTC","<span class=\"mono\">14 FF FF FF</span>","<span class=\"mono\">54</span>","groupOfDTC=0xFFFFFF nghĩa là xoá tất cả nhóm DTC. Positive response 0x54 không kèm dữ liệu."],
  ["4","Đọc lại với cùng mask để xác nhận sạch","<span class=\"mono\">19 02 09</span>","<span class=\"mono\">59 02 00</span>","statusAvailabilityMask trả về 0x00 và không còn bản ghi DTC nào theo sau → xác nhận đã xoá sạch."]
]) +

'<h3>6.3 Mở khoá Security Access rồi ghi lại cấu hình</h3>' +
'<p>Ví dụ thực tế: sau khi thay một ECU mới (hoặc hiệu chỉnh lại thông số), cần Security Access trước khi được phép ghi DID — nối tiếp sơ đồ seed/key ở <a href="#uds-security">trang Security Access</a> bằng số liệu cụ thể.</p>' +
seqTable([
  ["1","Chuyển sang Extended Session","<span class=\"mono\">10 03</span>","<span class=\"mono\">50 03 00 32 01 F4</span>","Ghi DID thường chỉ được phép ngoài Default Session."],
  ["2","Request seed (level 1)","<span class=\"mono\">27 01</span>","<span class=\"mono\">67 01 12 34 56 78</span>","Seed 4 byte — giá trị ngẫu nhiên do ECU sinh ra, chỉ mang tính minh hoạ."],
  ["3","Send key (level 1)","<span class=\"mono\">27 02 AB CD EF 01</span>","<span class=\"mono\">67 02</span>","Key = f(seed) theo thuật toán riêng của ECU (mục 4, trang Security Access). Positive response không kèm dữ liệu."],
  ["4","Ghi lại VIN sau khi thay ECU","<span class=\"mono\">2E F1 90 57 56 57 5A 5A 5A 31 4A 5A 58 57 30 30 30 30 30 31</span>","<span class=\"mono\">6E F1 90</span>","Request dài 20 byte (SID+DID+17 byte VIN) — thực tế trên CAN sẽ cần phân mảnh ISO-TP (xem ví dụ 3, trang ISO-TP). Response chỉ echo lại SID+DID, không có dữ liệu."],
  ["5","Đọc lại để xác nhận đã ghi đúng","<span class=\"mono\">22 F1 90</span>","<span class=\"mono\">62 F1 90 57 56 57 5A 5A 5A 31 4A 5A 58 57 30 30 30 30 30 31</span>","Khớp đúng VIN vừa ghi ở bước 4."]
]) +

'<h3>6.4 RoutineControl với NRC 0x78 (response pending) — routine chạy lâu</h3>' +
'<p>Rất nhiều routine thực tế (tự kiểm tra actuator, hiệu chỉnh cảm biến, xoá bộ nhớ…) không trả lời ngay vì cần vài trăm ms đến vài giây để chạy xong. Đây là lúc cơ chế NRC <code>0x78</code> (mục 5, trang Định dạng UDS) phát huy tác dụng.</p>' +
'<ol class="steps">' +
'<li>Tester → ECU: <code class="mono">31 01 02 03</code> — startRoutine, Routine Identifier <code>0x0203</code> (ví dụ minh hoạ — ID thật do từng hãng/ECU tự định nghĩa, ISO 14229 không chuẩn hoá cụ thể phần lớn dải RID).</li>' +
'<li>ECU → Tester: <code class="mono">7F 31 78</code> — "đã nhận đúng request, đang xử lý, chờ thêm" vì routine cần thời gian chạy thật (ví dụ hiệu chỉnh cơ cấu chấp hành).</li>' +
'<li>ECU có thể lặp lại <code class="mono">7F 31 78</code> thêm vài lần nữa (mỗi lần "gia hạn" thêm một khoảng P2*Server_max) nếu routine chưa xong.</li>' +
'<li>ECU → Tester (cuối cùng, khi routine hoàn tất): <code class="mono">71 01 02 03 00</code> — positive response, routineStatusRecord = <code>0x00</code> báo thành công.</li>' +
'<li>Tester → ECU: <code class="mono">31 03 02 03</code> — requestRoutineResults để hỏi thêm chi tiết kết quả (nếu ECU định nghĩa dữ liệu trả về cho routine này).<br />ECU → Tester: <code class="mono">71 03 02 03 …</code> — dữ liệu kết quả, định dạng tuỳ ECU.</li>' +
'</ol>' +

'<h3>6.5 Nạp lại firmware (flashing) — chi tiết từng byte</h3>' +
'<p>Đây là kịch bản phức tạp nhất, kết hợp gần như mọi dịch vụ đã học. Ví dụ dưới đây nạp một vùng nhớ 0x00080000 byte (512&nbsp;KB) bắt đầu tại địa chỉ 0x00100000 — địa chỉ, kích thước và Routine Identifier chỉ mang tính minh hoạ, nhưng cách mã hoá từng trường (dataFormatIdentifier, addressAndLengthFormatIdentifier, blockSequenceCounter…) đúng theo ISO 14229-1.</p>' +
seqTable([
  ["1","Chuyển sang Programming Session","<span class=\"mono\">10 02</span>","<span class=\"mono\">50 02 00 32 01 F4</span>","Flashing gần như luôn chạy trên bootloader riêng, không phải phần mềm ứng dụng bình thường."],
  ["2","Security Access (seed/key)","<span class=\"mono\">27 01</span> rồi <span class=\"mono\">27 02 &lt;key&gt;</span>","<span class=\"mono\">67 01 &lt;seed&gt;</span> rồi <span class=\"mono\">67 02</span>","Xem chi tiết seed/key ở mục 6.3."],
  ["3","RequestDownload — khai báo vùng nhớ sẽ nạp","<span class=\"mono\">34 00 44 00 10 00 00 00 08 00 00</span>","<span class=\"mono\">74 20 01 00</span>","dataFormatIdentifier=0x00 (không nén, không mã hoá); addressAndLengthFormatIdentifier=0x44 (địa chỉ 4 byte, kích thước 4 byte); địa chỉ=0x00100000, kích thước=0x00080000. Response: lengthFormatIdentifier=0x20 (trường maxNumberOfBlockLength dài 2 byte), maxNumberOfBlockLength=0x0100=256 byte/khối (tính cả 2 byte SID+counter)."],
  ["4","TransferData — khối đầu tiên","<span class=\"mono\">36 01 &lt;254 byte dữ liệu&gt;</span>","<span class=\"mono\">76 01</span>","blockSequenceCounter bắt đầu từ 0x01, tăng dần; response echo lại đúng counter đã nhận."],
  ["5","TransferData — lặp lại cho tới hết dữ liệu","<span class=\"mono\">36 02 …</span> … <span class=\"mono\">36 FF …</span> rồi <span class=\"mono\">36 00 …</span>","<span class=\"mono\">76 02</span> … <span class=\"mono\">76 FF</span> rồi <span class=\"mono\">76 00</span>","Với 512&nbsp;KB chia khối 254 byte cần khoảng 2000+ khối nên counter chắc chắn tràn: sau 0xFF quay về 0x00 rồi tiếp tục 0x01, 0x02… — ECU/tool phải xử lý đúng vòng lặp này."],
  ["6","RequestTransferExit — báo đã truyền xong","<span class=\"mono\">37</span>","<span class=\"mono\">77</span>","Kết thúc pha TransferData; một số hãng thêm dữ liệu xác thực (ví dụ checksum) vào đây — chi tiết tuỳ nhà sản xuất."],
  ["7","RoutineControl — kiểm tra tính toàn vẹn firmware","<span class=\"mono\">31 01 02 02</span>","<span class=\"mono\">7F 31 78</span> … rồi <span class=\"mono\">71 01 02 02 00</span>","Routine Identifier ví dụ minh hoạ (ISO 14229 không chuẩn hoá cụ thể). Việc kiểm tra checksum thường mất thời gian → gặp NRC 0x78 (mục 6.4) là bình thường."],
  ["8","ECUReset — khởi động lại với firmware mới","<span class=\"mono\">11 01</span>","<span class=\"mono\">51 01</span>","hardReset. Sau khi khởi động lại, ECU trở về Default Session, chạy firmware vừa nạp."]
]) +
'<div class="callout danger">' + co("alert") +
'<div class="callout-body"><p>Flashing sai có thể làm "chết" (brick) ECU. Đây là lý do quy trình được bảo vệ bằng Security Access, kiểm tra checksum và trình tự nghiêm ngặt (NRC <code>0x24</code> requestSequenceError bảo vệ trình tự này — ví dụ gửi TransferData trước khi có RequestDownload sẽ bị từ chối bằng NRC này).</p></div></div>' +

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

  function seqTable(list) {
    var html = '<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Bước</th><th>Request (Tester → ECU)</th><th>Response (ECU → Tester)</th><th>Giải thích</th></tr></thead><tbody>';
    list.forEach(function (r) {
      html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + r[4] + '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }
})();
