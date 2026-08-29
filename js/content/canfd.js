/* Page: CAN FD */
(function () {
  var I = APP.icon;
  function co(name){return '<span class="callout-icon">'+I(name)+"</span>";}
  function bf(cls, bits, name){return '<div class="bf-cell '+cls+'"><div class="bf-bits">'+bits+'</div><div class="bf-name">'+name+'</div></div>';}

  APP.register("canfd", {
    title: "CAN FD — Tổng quan",
    icon: "zap",
    keywords: "can fd flexible data rate 64 byte brs fdf edl esi rrs res crc17 crc21 bit rate switch tocdo bosch 2012 iso 11898-1 2015",
    render: function () {
      return (
'<span class="page-eyebrow">' + I("zap") + 'CAN FD</span>' +
'<h1 class="page-title">CAN FD — CAN with Flexible Data-rate</h1>' +
'<p class="page-lead">CAN FD giữ nguyên triết lý của CAN (arbitration, độ tin cậy) nhưng giải quyết hai giới hạn lớn: payload chỉ 8 byte và tốc độ tối đa 1 Mbit/s. Nó cho phép tới 64 byte/khung và tăng tốc phần dữ liệu.</p>' +
'<hr class="lead-hr" />' +

'<div class="prose">' +

'<h2><span class="h2-num">1</span>Vì sao cần CAN FD?</h2>' +
'<p>Khi ô tô ngày càng nhiều dữ liệu (ADAS, camera, cập nhật phần mềm qua mạng...), Classical CAN trở nên chật chội:</p>' +
'<ul>' +
'<li><strong>Payload 8 byte quá nhỏ</strong> → phải chia nhỏ dữ liệu thành nhiều khung, tốn overhead.</li>' +
'<li><strong>1 Mbit/s không đủ nhanh</strong>, đặc biệt khi <em>flash</em> (nạp lại) phần mềm ECU cần truyền hàng trăm KB.</li>' +
'</ul>' +
'<p>CAN FD do <strong>Bosch</strong> công bố năm <strong>2012</strong> và được chuẩn hóa trong <strong>ISO 11898-1:2015</strong>. Quan trọng: nó dùng lại chính lớp vật lý và cơ chế arbitration của CAN, nên tương thích tốt và dễ nâng cấp.</p>' +

'<h2><span class="h2-num">2</span>Hai thay đổi cốt lõi</h2>' +
'<div class="def-grid">' +
'<div class="def-item"><h4><span class="def-icon">' + I("database") + '</span>Payload tới 64 byte</h4><p>Thay vì tối đa 8 byte, một khung CAN FD chở được tới 64 byte dữ liệu — giảm mạnh số khung cần dùng.</p></div>' +
'<div class="def-item"><h4><span class="def-icon">' + I("zap") + '</span>Hai tốc độ trong một khung</h4><p>Phần arbitration giữ tốc độ "nominal" (an toàn), phần dữ liệu có thể chuyển sang tốc độ cao hơn — gọi là <em>Bit Rate Switch</em>.</p></div>' +
'</div>' +

'<h2><span class="h2-num">3</span>Bit Rate Switch (BRS) — nhanh ở đúng chỗ</h2>' +
'<p>Đây là ý tưởng thông minh nhất của CAN FD. Một khung được chia làm hai pha tốc độ:</p>' +
'<ul>' +
'<li><strong>Arbitration phase</strong> (đầu và cuối khung): giữ tốc độ <em>nominal</em> (ví dụ 500 kbit/s hoặc 1 Mbit/s). Phải chậm vì arbitration cần mọi node "nhìn thấy" cùng mức bit — phụ thuộc thời gian lan truyền trên bus.</li>' +
'<li><strong>Data phase</strong> (từ sau bit BRS đến hết CRC): có thể chạy <em>nhanh hơn nhiều</em> (thường 2–5 Mbit/s, phần cứng tốt có thể cao hơn). Ở pha này chỉ có <em>một</em> node đang phát nên không cần lo arbitration.</li>' +
'</ul>' +
'<div class="callout tip">' + co("check") +
'<div class="callout-body"><p>Bit <strong>BRS (Bit Rate Switch)</strong> quyết định có chuyển sang tốc độ cao cho pha dữ liệu hay không. Nếu BRS = recessive → dùng tốc độ nhanh; nếu dominant → giữ nguyên tốc độ nominal cho cả khung.</p></div></div>' +

'<h2><span class="h2-num">4</span>Các bit điều khiển mới</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Bit</th><th>Tên</th><th>Ý nghĩa</th></tr></thead><tbody>' +
'<tr><td><code>RRS</code></td><td>Remote Request Substitution</td><td>Nằm đúng vị trí bit RTR (Classical CAN) / SRR (Extended). CAN FD <strong>không có Remote Frame</strong>, nên RRS luôn phát <em>dominant (0)</em> — giữ đúng vai trò "RTR = 0 = Data Frame" để không bị các khung Classical CAN cùng ID đánh bại một cách vô lý trong arbitration.</td></tr>' +
'<tr><td><code>FDF</code></td><td>FD Format (trước gọi là EDL)</td><td>Phân biệt khung CAN FD với khung Classical CAN. Recessive (1) = khung FD; dominant (0) = khung Classical CAN.</td></tr>' +
'<tr><td><code>res</code></td><td>Reserved</td><td>Bit dự trữ, luôn phát dominant — đóng vai trò tương tự bit <code>r0</code> của Classical CAN, dành cho mở rộng giao thức trong tương lai.</td></tr>' +
'<tr><td><code>BRS</code></td><td>Bit Rate Switch</td><td>Bật/tắt tốc độ cao cho pha dữ liệu (xem trên).</td></tr>' +
'<tr><td><code>ESI</code></td><td>Error State Indicator</td><td>Cho biết node gửi đang ở trạng thái error-active (dominant) hay error-passive (recessive).</td></tr>' +
'</tbody></table></div>' +

'<h3>Bố cục khung CAN FD (Standard, rút gọn)</h3>' +
'<div class="bitfield">' +
  bf("sof","1","SOF") +
  bf("arb","11","Identifier") +
  bf("arb","1","RRS") +
  bf("ctrl","1","IDE") +
  bf("ctrl","1","FDF") +
  bf("ctrl","1","res") +
  bf("ctrl","1","BRS") +
  bf("ctrl","1","ESI") +
  bf("ctrl","4","DLC") +
  bf("data","0–512","Data (0–64 byte)") +
  bf("crc","17/21","CRC") +
  bf("ack","2","ACK") +
  bf("eof","7","EOF") +
'</div>' +
'<p class="muted">Thứ tự các bit điều khiển đúng theo đặc tả: <strong>FDF → res → BRS → ESI</strong>. Trường CRC dài hơn và mạnh hơn Classical CAN.</p>' +

'<h3>Bố cục khung CAN FD — Extended (29-bit ID)</h3>' +
'<p>CAN FD cũng có bản 29-bit, gọi là <strong>FD Extended Frame Format (FEFF)</strong>. Phần định danh dùng lại đúng cơ chế <strong>Base ID → SRR → IDE → ID mở rộng</strong> của <a href="#can-frame">Extended Frame cổ điển</a> (xem lại nếu chưa rõ SRR/IDE là gì). Khác biệt duy nhất: cổ điển có <em>RTR thật</em> ở cuối phần ID mở rộng để phân biệt Data/Remote Frame, còn CAN FD không có Remote Frame nên vị trí đó được thay bằng <strong>RRS</strong> — luôn dominant.</p>' +
'<div class="bitfield">' +
  bf("sof","1","SOF") +
  bf("arb","11","Base ID") +
  bf("arb","1","SRR") +
  bf("ctrl","1","IDE") +
  bf("arb","18","ID mở rộng") +
  bf("arb","1","RRS") +
  bf("ctrl","1","FDF") +
  bf("ctrl","1","res") +
  bf("ctrl","1","BRS") +
  bf("ctrl","1","ESI") +
  bf("ctrl","4","DLC") +
  bf("data","0–512","Data (0–64 byte)") +
  bf("crc","17/21","CRC") +
  bf("ack","2","ACK") +
  bf("eof","7","EOF") +
'</div>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p><strong>Tóm gọn 4 biến thể ở đúng "vị trí RTR cũ":</strong></p><ul>' +
'<li><strong>Classical Standard:</strong> RTR thật — <code>0</code> = Data Frame, <code>1</code> = Remote Frame.</li>' +
'<li><strong>Classical Extended:</strong> SRR (giữ chỗ, luôn recessive) ngay ở vị trí đó, rồi <em>RTR thật</em> xuất hiện lại ở cuối 18 bit ID mở rộng.</li>' +
'<li><strong>CAN FD Standard:</strong> RRS (luôn dominant) — không có RTR thật vì FD không có Remote Frame.</li>' +
'<li><strong>CAN FD Extended:</strong> SRR (giữ chỗ, luôn recessive) ở đầu, rồi <em>RRS</em> (luôn dominant, thay cho RTR thật) ở cuối 18 bit ID mở rộng.</li>' +
'</ul><p>Nói ngắn gọn: SRR luôn <em>thay chỗ</em> cho bit đứng ở vị trí Base ID/RTR, còn RTR hoặc RRS thật luôn nằm ở <em>cuối phần Identifier</em> (sau 18 bit mở rộng, nếu có) — hai bit này không phải là một, dù cùng \'gốc gác\' từ RTR.</p></div></div>' +

'<h2><span class="h2-num">5</span>DLC trong CAN FD — chở nhiều hơn 8 byte</h2>' +
'<p>CAN FD tái sử dụng các giá trị DLC 9–15 (vốn "vô nghĩa" trong Classical CAN) để biểu diễn các kích thước lớn:</p>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>DLC</th><th>Số byte</th><th>DLC</th><th>Số byte</th></tr></thead><tbody>' +
'<tr><td class="mono">0–8</td><td>0–8</td><td class="mono">12</td><td><strong>24</strong></td></tr>' +
'<tr><td class="mono">9</td><td><strong>12</strong></td><td class="mono">13</td><td><strong>32</strong></td></tr>' +
'<tr><td class="mono">10</td><td><strong>16</strong></td><td class="mono">14</td><td><strong>48</strong></td></tr>' +
'<tr><td class="mono">11</td><td><strong>20</strong></td><td class="mono">15</td><td><strong>64</strong></td></tr>' +
'</tbody></table></div>' +
'<div class="callout info">' + co("info") +
'<div class="callout-body"><p>Lưu ý: các bước nhảy không liên tục (8 → 12 → 16 → 20 → 24 → 32 → 48 → 64). Nếu dữ liệu của bạn là 10 byte, khung sẽ dùng kích thước 12 byte và 2 byte cuối là đệm (padding).</p></div></div>' +

'<h2><span class="h2-num">6</span>CRC mạnh hơn</h2>' +
'<p>Vì khung dài hơn, CAN FD dùng CRC dài hơn để giữ độ tin cậy: <strong>CRC-17</strong> cho khung có ≤ 16 byte dữ liệu, và <strong>CRC-21</strong> cho khung &gt; 16 byte. CAN FD cũng cải tiến cách xử lý stuff bit trong tính CRC (đưa fixed stuff bits và bộ đếm stuff bit vào) để tránh một số kịch bản lỗi hiếm của Classical CAN.</p>' +

'<h2><span class="h2-num">7</span>So sánh nhanh</h2>' +
'<div class="table-wrap"><table class="data"><thead><tr><th>Tiêu chí</th><th>Classical CAN</th><th>CAN FD</th></tr></thead><tbody>' +
'<tr><td>Payload tối đa</td><td>8 byte</td><td><strong>64 byte</strong></td></tr>' +
'<tr><td>Tốc độ</td><td>tới 1 Mbit/s</td><td>arbitration tới 1 Mbit/s, <strong>data phase cao hơn nhiều</strong></td></tr>' +
'<tr><td>CRC</td><td>15-bit</td><td>17-bit / 21-bit</td></tr>' +
'<tr><td>Remote Frame</td><td>Có</td><td><strong>Không</strong></td></tr>' +
'<tr><td>Arbitration</td><td>Bitwise, phi phá hủy</td><td>Giống hệt (kế thừa)</td></tr>' +
'<tr><td>Bit mới</td><td>—</td><td>RRS, FDF, res, BRS, ESI</td></tr>' +
'</tbody></table></div>' +

'<div class="callout warn">' + co("alert") +
'<div class="callout-body"><div class="callout-title">Tương thích</div>' +
'<p>Một node Classical CAN <em>không</em> hiểu khung CAN FD và sẽ coi đó là lỗi. Vì vậy trên một bus hỗn hợp cần transceiver/controller hỗ trợ FD, hoặc dùng cơ chế "CAN FD tolerant". Khi thiết kế, phải đảm bảo mọi node trên bus đều hiểu FD nếu có khung FD được truyền.</p></div></div>' +

'<div class="callout info">' + co("flask") +
'<div class="callout-body"><p><strong>Thực hành:</strong> <a href="#lab-canfd">Lab: CAN FD Builder</a> cho bạn bật/tắt BRS, ESI, chọn DLC 0–64 byte và xem kích thước khung, so sánh với Classical CAN.</p></div></div>' +

'<div class="next-up">' + I("arrowRight") +
'<div class="nu-body"><span class="nu-label">Tiếp theo</span>' +
'<p>Xong phần "đường truyền". Giờ ta lên tầng ứng dụng chẩn đoán: <a href="#uds-intro">UDS là gì?</a></p></div></div>' +

'</div>'
      );
    }
  });
})();
