/* Page: CAN — Cấu trúc khung */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  function bf(cls, bits, name){return '<div class="bf-cell '+cls+'"><div class="bf-bits">'+bits+'</div><div class="bf-name">'+name+'</div></div>';}

  APP.register("can-frame", {
    title: "Cấu trúc khung",
    icon: "layers",
    keywords: "frame khung data remote error overload sof identifier rtr ide srr r0 r1 dlc crc ack eof ifs bit stuffing standard extended",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("layers") + 'CAN Bus · Phần 3</span>' +
'<h1 class="page-title">Cấu trúc khung (Frame)</h1>' +
'<p class="page-lead">Mọi thứ trên bus CAN đều được đóng gói thành "khung" (frame). Hiểu từng trường trong khung giúp bạn đọc được log CAN thật và tự dựng bản tin trong lab.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Bốn loại khung</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Loại khung</th><th>Mục đích</th></tr></thead><tbody>' +
'<tr><td><strong>Data Frame</strong></td><td>Chở dữ liệu thực từ node gửi đến các node nhận. Loại phổ biến nhất.</td></tr>' +
'<tr><td><strong>Remote Frame</strong></td><td>Yêu cầu một node khác gửi Data Frame có Identifier tương ứng (không chứa dữ liệu). Ít dùng trong thực tế hiện đại.</td></tr>' +
'<tr><td><strong>Error Frame</strong></td><td>Do bất kỳ node nào phát ra khi phát hiện lỗi, để báo cho cả bus biết khung vừa rồi hỏng.</td></tr>' +
'<tr><td><strong>Overload Frame</strong></td><td>Dùng để node "câu giờ", trì hoãn khung kế tiếp khi chưa xử lý kịp. Hiếm gặp.</td></tr>' +
'</tbody></table></div>' +
'<p>Chúng ta tập trung vào <strong>Data Frame</strong> vì nó quan trọng nhất.</p>' +

'<h2><span class="h2-num">2</span>Data Frame chuẩn (Standard / 11-bit)</h2>' +
'<p>Đây là bố cục các trường của một Standard Data Frame (CAN 2.0A). Con số là số bit của mỗi trường:</p>' +
'<div class="bitfield">' +
  bf("sof","1","SOF") +
  bf("arb","11","Identifier") +
  bf("arb","1","RTR") +
  bf("ctrl","1","IDE") +
  bf("ctrl","1","r0") +
  bf("ctrl","4","DLC") +
  bf("data","0–64","Data (0–8 byte)") +
  bf("crc","15","CRC") +
  bf("crc","1","CRC del") +
  bf("ack","1","ACK slot") +
  bf("ack","1","ACK del") +
  bf("eof","7","EOF") +
'</div>' +
'<div class="bit-legend">' +
  legend("sof","Start") + legend("arb","Arbitration") + legend("ctrl","Control") +
  legend("data","Data") + legend("crc","CRC") + legend("ack","ACK") + legend("eof","End") +
'</div>' +

'<h3>Giải thích từng trường</h3>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Trường</th><th>Bit</th><th>Ý nghĩa</th></tr></thead><tbody>' +
'<tr><td><strong>SOF</strong> (Start of Frame)</td><td>1</td><td>Một bit <em>dominant</em> đánh dấu bắt đầu khung, đồng thời để các node đồng bộ với nhau.</td></tr>' +
'<tr><td><strong>Identifier</strong></td><td>11</td><td>Định danh bản tin, đồng thời quyết định <strong>độ ưu tiên</strong>: ID càng nhỏ (nhiều bit 0/dominant ở đầu) thì ưu tiên càng cao.</td></tr>' +
'<tr><td><strong>RTR</strong> (Remote Transmission Request)</td><td>1</td><td><code>0</code> (dominant) = Data Frame; <code>1</code> (recessive) = Remote Frame.</td></tr>' +
'<tr><td><strong>IDE</strong> (Identifier Extension)</td><td>1</td><td><code>0</code> = khung chuẩn 11-bit; <code>1</code> = khung mở rộng 29-bit.</td></tr>' +
'<tr><td><strong>r0</strong></td><td>1</td><td>Bit dự trữ (reserved), phát dominant.</td></tr>' +
'<tr><td><strong>DLC</strong> (Data Length Code)</td><td>4</td><td>Số byte dữ liệu (0–8). Xem bảng mã hóa bên dưới.</td></tr>' +
'<tr><td><strong>Data</strong></td><td>0–64</td><td>Dữ liệu thực, 0 đến 8 byte.</td></tr>' +
'<tr><td><strong>CRC</strong></td><td>15</td><td>Chuỗi kiểm tra dư vòng (Cyclic Redundancy Check) để phát hiện lỗi truyền, theo sau là 1 bit <em>CRC delimiter</em> (recessive).</td></tr>' +
'<tr><td><strong>ACK</strong></td><td>2</td><td>Gồm <em>ACK slot</em> + <em>ACK delimiter</em>. Xem mục ACK bên dưới — đây là chi tiết rất "CAN".</td></tr>' +
'<tr><td><strong>EOF</strong> (End of Frame)</td><td>7</td><td>Bảy bit recessive liên tiếp báo kết thúc khung.</td></tr>' +
'</tbody></table></div>' +
'<p class="muted">Sau EOF còn có <strong>IFS</strong> (Inter-Frame Space) gồm tối thiểu 3 bit recessive, ngăn cách giữa các khung.</p>' +

'<h2><span class="h2-num">3</span>Standard vs Extended (11-bit vs 29-bit)</h2>' +
'<p>Chuẩn CAN 2.0 định nghĩa 2 khuôn dạng: <strong>Standard Frame (CAN 2.0A)</strong> ở trên với Identifier 11 bit, và <strong>Extended Frame (CAN 2.0B)</strong> với Identifier dài <strong>29 bit</strong> — cho không gian định danh lớn hơn nhiều (hơn 500 triệu ID), cần cho các giao thức như SAE J1939. Cả hai khuôn dạng phải cùng tồn tại được trên một bus, và arbitration luôn so bit theo cùng vị trí, nên khung Extended được thiết kế để <strong>11 bit đầu tiên trùng đúng vị trí</strong> của Identifier chuẩn, rồi mới "rẽ nhánh" thêm các bit và 18 bit ID còn lại.</p>' +
'<h3>Bố cục khung Extended</h3>' +
'<div class="bitfield">' +
  bf("sof","1","SOF") +
  bf("arb","11","Base ID") +
  bf("arb","1","SRR") +
  bf("ctrl","1","IDE") +
  bf("arb","18","ID mở rộng") +
  bf("arb","1","RTR") +
  bf("ctrl","1","r1") +
  bf("ctrl","1","r0") +
  bf("ctrl","4","DLC") +
  bf("data","0–64","Data (0–8 byte)") +
  bf("crc","15","CRC") +
  bf("crc","1","CRC del") +
  bf("ack","1","ACK slot") +
  bf("ack","1","ACK del") +
  bf("eof","7","EOF") +
'</div>' +
'<p class="muted">Màu sắc giống chú thích ở mục 2. So với khung Standard, phần thay đổi nằm ở đúng chỗ RTR/IDE cũ: thêm <strong>SRR</strong>, giữ <strong>IDE</strong> (nay = 1), chèn <strong>18 bit ID mở rộng</strong>, rồi mới tới RTR thật và thêm 1 bit dự trữ <strong>r1</strong>.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Trường mới / khác</th><th>Bit</th><th>Ý nghĩa</th></tr></thead><tbody>' +
'<tr><td><strong>Base ID</strong></td><td>11</td><td>11 bit đầu của định danh 29-bit (ID28…ID18), nằm <em>đúng vị trí</em> Identifier của Standard Frame — nhờ vậy hai loại khung so được bit với nhau khi cùng phát lên bus.</td></tr>' +
'<tr><td><strong>SRR</strong> (Substitute Remote Request)</td><td>1</td><td>Nằm đúng vị trí bit RTR của Standard Frame, nhưng <em>luôn phát recessive (1)</em> và bản thân nó không mang ý nghĩa gì — vai trò duy nhất là "giữ chỗ" cho arbitration. Nhờ vậy nếu Base ID trùng nhau, một Standard Data Frame (RTR = 0, dominant) luôn <strong>thắng</strong> Extended Frame (SRR = 1, recessive) ngay tại bit này.</td></tr>' +
'<tr><td><strong>IDE</strong> ở đây</td><td>1</td><td>Vẫn là bit Identifier Extension như ở Standard Frame, nhưng phát <code>1</code> (recessive) để báo "đây là khung Extended". Bit này đứng ngay sau SRR nên cũng tham gia arbitration: nếu hai khung hòa nhau ở SRR/RTR (ví dụ Standard đó là Remote Frame), Standard (IDE = 0, dominant) vẫn thắng Extended (IDE = 1, recessive) tại đây.</td></tr>' +
'<tr><td><strong>ID mở rộng</strong></td><td>18</td><td>18 bit còn lại (ID17…ID0), ghép sau Base ID để tạo đủ 29 bit định danh.</td></tr>' +
'<tr><td><strong>RTR</strong> (thật)</td><td>1</td><td>Giống hệt vai trò ở Standard Frame — <code>0</code> = Data Frame, <code>1</code> = Remote Frame — chỉ khác là đứng sau 18 bit ID mở rộng thay vì ngay sau 11 bit ID.</td></tr>' +
'<tr><td><strong>r1</strong>, <strong>r0</strong></td><td>1 + 1</td><td>Hai bit dự trữ (reserved) trong phần Control Field, luôn phát dominant, dành cho mở rộng giao thức trong tương lai. Standard Frame chỉ có 1 bit dự trữ (r0); Extended Frame có thêm r1.</td></tr>' +
'</tbody></table></div>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p><strong>Ví dụ arbitration cụ thể:</strong> một Standard Data Frame ID = <code>0x123</code> và một Extended Data Frame có Base ID = <code>0x123</code> (11 bit đầu giống hệt nhau). Cả hai hòa nhau suốt 11 bit ID. Đến bit kế tiếp: Standard phát <strong>RTR = 0</strong> (dominant, vì là Data Frame) trong khi Extended buộc phải phát <strong>SRR = 1</strong> (recessive) → Extended thua ngay tại đó, Standard tiếp tục chiếm bus. Nếu Standard đó lại là <em>Remote Frame</em> (RTR = 1, recessive) thì hai bên hòa tiếp một nhịp nữa, và Extended chỉ thua ở bit kế — <strong>IDE</strong>: Standard phát 0 (dominant), Extended phát 1 (recessive). Nói cách khác: <em>khung Standard luôn thắng khung Extended có cùng Base ID</em>, chỉ khác nhau ở việc thua sớm (tại SRR) hay muộn hơn một bit (tại IDE).</p></div></div>' +

'<h2><span class="h2-num">4</span>DLC — mã hóa độ dài dữ liệu</h2>' +
'<p>Trong Classical CAN, DLC 4 bit mã hóa số byte 0–8. Các giá trị 9–15 vẫn được hiểu là 8 byte.</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>DLC (nhị phân)</th><th>Số byte dữ liệu</th></tr></thead><tbody>' +
'<tr><td class="mono">0000 … 1000</td><td>0, 1, 2, 3, 4, 5, 6, 7, 8</td></tr>' +
'<tr><td class="mono">1001 … 1111</td><td>vẫn là 8 (trong Classical CAN)</td></tr>' +
'</tbody></table></div>' +
'<p class="muted">CAN FD dùng lại các giá trị 9–15 để biểu diễn 12, 16, 20, 24, 32, 48, 64 byte — sẽ nói ở phần CAN FD.</p>' +

'<h2><span class="h2-num">5</span>Cơ chế ACK — cả bus cùng "gật đầu"</h2>' +
'<p>Node gửi phát ra <strong>ACK slot</strong> ở mức <em>recessive (1)</em>. Bất kỳ node nào nhận đúng khung (CRC khớp) sẽ ghi đè bit này bằng mức <em>dominant (0)</em> trong đúng khe ACK. Nhờ wired-AND, chỉ cần <strong>một</strong> node xác nhận là node gửi sẽ "nghe" thấy bit dominant tại vị trí đó và biết rằng có ít nhất một người đã nhận được.</p>' +
'<div class="callout warn">' + co("alert") +
'<div class="callout-body"><p>Nếu node gửi phát ACK slot recessive mà đọc lại vẫn thấy recessive (không ai kéo xuống dominant) → <strong>ACK Error</strong>. Thường xảy ra khi node gửi là node duy nhất trên bus, hoặc khớp nối bus có vấn đề.</p></div></div>' +

'<h2><span class="h2-num">6</span>Bit-stuffing</h2>' +
'<p>Như đã nói ở lớp vật lý, CAN dùng NRZ và không có clock riêng. Để giữ đồng bộ, quy tắc <strong>bit-stuffing</strong> áp dụng cho phần từ SOF đến hết CRC: cứ <strong>5 bit liên tiếp cùng mức</strong>, bên gửi tự chèn thêm <strong>1 bit ngược mức</strong>. Bên nhận biết quy tắc này nên tự loại bỏ các "stuff bit".</p>' +
'<p>Hệ quả: độ dài thực tế của một khung trên dây <em>không cố định</em>, mà phụ thuộc nội dung dữ liệu (dữ liệu có nhiều bit lặp thì thêm nhiều stuff bit). Phần <em>CRC delimiter, ACK, EOF</em> KHÔNG áp dụng bit-stuffing (chúng có định dạng cố định).</p>' +
'<div class="callout tip">' + co("flask") +
'<div class="callout-body"><p><strong>Thực hành:</strong> Mở <a href="#lab-can">Lab: CAN Frame Builder</a> để tự nhập ID + data và xem toàn bộ chuỗi bit, các stuff bit được đánh dấu, cùng tổng số bit của khung.</p></div></div>' +

'<h2><span class="h2-num">7</span>Remote / Error / Overload frame (tóm tắt)</h2>' +
'<ul>' +
'<li><strong>Remote Frame:</strong> giống Data Frame nhưng RTR = recessive và <em>không có trường Data</em>. Dùng để "xin" dữ liệu. Hiện ít dùng.</li>' +
'<li><strong>Error Frame:</strong> gồm <em>Error Flag</em> (6 bit cùng mức, cố ý vi phạm bit-stuffing để mọi node nhận ra) + <em>Error Delimiter</em> (8 bit recessive). Khi một node báo lỗi, khung đang truyền bị hủy và sẽ được gửi lại.</li>' +
'<li><strong>Overload Frame:</strong> cấu trúc giống Error Frame, dùng để trì hoãn khung tiếp theo.</li>' +
'</ul>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Ta đã biết khung trông ra sao. Câu hỏi hay tiếp theo: <a href="#can-arbitration">Nếu hai node gửi cùng lúc thì sao?</a></p></div></div>' +

'</div>'
      );
    }
  });

  function legend(cls, label){
    var map={sof:'--c-blue-soft',arb:'--c-brand-soft',ctrl:'--c-accent-soft',data:'--c-green-soft',crc:'--c-amber-soft',ack:'--c-purple-soft',eof:'--surface-2'};
    return '<span><span class="swatch" style="background:var('+map[cls]+');border:1px solid var(--border-strong)"></span>'+label+'</span>';
  }
})();
