// src/features/legal/TermsOfServicePage.jsx
// Trang Điều khoản dịch vụ (công khai, không yêu cầu đăng nhập) — S12.1
// Nội dung diễn giải dựa trên SRS §4.7 (Compliance Requirements) + Business Rules (BR02-BR06, BR10-12)
// + §4.6/§4.5. Đây KHÔNG phải văn bản pháp lý chính thức — cần bộ phận pháp chế rà soát trước khi
// đưa vào production thật (xem ghi chú trong plan/S12.1-plan.md mục 6).
import { Link } from "react-router-dom";
import LegalLayout from "./components/LegalLayout";
import { UI } from "../../shared/constants/designTokens";

const LAST_UPDATED = "07/06/2026";
// TODO: thay bằng email hỗ trợ chính thức + tên pháp lý đơn vị vận hành khi có
// (xem plan/S12.1-plan.md §6 — câu hỏi cho user)
const SUPPORT_EMAIL = "support@speakbuddi.vn";
const OPERATOR_NAME = "Đội ngũ SpeakBuddi";

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Điều khoản dịch vụ"
      lastUpdated={LAST_UPDATED}
      crossLink={
        <p style={{ margin: 0, fontFamily: UI.font, fontSize: UI.fontSize.bodyMd, color: UI.onSurfaceVariant }}>
          Xem thêm <Link to="/privacy">Chính sách bảo mật</Link> để hiểu cách chúng tôi thu thập và bảo vệ dữ liệu của bạn.
        </p>
      }
    >
      {/* 1. Chấp nhận điều khoản */}
      <h2>1. Chấp nhận điều khoản</h2>
      <p>
        Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng SpeakBuddi ("dịch vụ"), bạn đồng ý tuân theo các
        điều khoản dịch vụ này cùng với <Link to="/privacy">Chính sách bảo mật</Link>. Nếu bạn không đồng ý
        với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ.
      </p>
      <p>Điều khoản này áp dụng cho phiên bản <strong>v1.1.0</strong> của SpeakBuddi và có thể được cập nhật theo thời gian.</p>

      {/* 2. Mô tả dịch vụ */}
      <h2>2. Mô tả dịch vụ</h2>
      <p>SpeakBuddi là nền tảng học tiếng Anh trực tuyến, cung cấp các tính năng chính sau:</p>
      <ul>
        <li>Học từ vựng theo trình độ <strong>A1–C2</strong>, được cá nhân hóa theo trình độ, mục tiêu và sở thích bạn đã chọn.</li>
        <li>Làm bài kiểm tra/quiz từ vựng và ngữ pháp với nhiều dạng câu hỏi (trắc nghiệm, flashcard, điền từ, sắp xếp câu...).</li>
        <li>Tra cứu và dịch từ vựng tiếng Anh – tiếng Việt.</li>
        <li>Luyện phát âm với phản hồi chấm điểm dựa trên AI.</li>
        <li>Hội thoại cùng AI theo chủ đề để luyện phản xạ giao tiếp.</li>
      </ul>

      {/* 3. Tài khoản & trách nhiệm người dùng */}
      <h2>3. Tài khoản &amp; trách nhiệm người dùng</h2>
      <ul>
        <li>Bạn cần cung cấp thông tin chính xác khi đăng ký tài khoản (họ tên, email...) và cập nhật khi có thay đổi.</li>
        <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập (mật khẩu, phiên đăng nhập) của mình và các hoạt động diễn ra dưới tài khoản của bạn.</li>
        <li>Vui lòng thông báo cho chúng tôi ngay nếu phát hiện tài khoản bị truy cập trái phép.</li>
        <li>Mỗi người dùng chỉ nên sử dụng một tài khoản cá nhân; không chia sẻ tài khoản cho người khác.</li>
      </ul>

      {/* 4. Gói miễn phí & gói trả phí */}
      <h2>4. Gói miễn phí &amp; gói trả phí</h2>
      <p>SpeakBuddi cung cấp hai loại gói sử dụng:</p>
      <ul>
        <li>
          <strong>Gói miễn phí:</strong> cho phép học từ vựng, luyện phát âm, xem lộ trình học và hội thoại
          với AI trong giới hạn <strong>15 phút mỗi 5 giờ</strong>; sau khi hết 5 giờ, hạn mức hội thoại AI
          sẽ được làm mới tự động.
        </li>
        <li>
          <strong>Gói trả phí (Pro):</strong> sau khi thanh toán thành công, tài khoản của bạn được nâng cấp
          thành <strong>người dùng trả phí</strong> theo gói đã mua, cho phép hội thoại với AI{" "}
          <strong>không giới hạn thời gian</strong>, sử dụng mô hình AI cao cấp hơn, và{" "}
          <strong>đổi giọng đọc/mô hình giọng nói (ElevenLabs voice/model)</strong> — tính năng đổi giọng đọc
          chỉ dành riêng cho người dùng trả phí.
        </li>
      </ul>
      <p>Chi tiết các gói và mức giá hiện hành được công bố tại mục <Link to="/#pricing">Bảng giá</Link> trên trang chủ.</p>

      {/* 5. Thanh toán & hoàn tiền */}
      <h2>5. Thanh toán &amp; hoàn tiền</h2>
      <ul>
        <li>
          Việc xử lý thanh toán được <strong>ủy quyền cho nhà cung cấp dịch vụ thanh toán bên thứ ba</strong>{" "}
          (ví dụ: cổng thanh toán, ví điện tử, ngân hàng). SpeakBuddi <strong>không lưu trữ trực tiếp</strong>{" "}
          số thẻ hay thông tin thanh toán nhạy cảm của bạn trên hệ thống của mình; chúng tôi chỉ lưu siêu dữ
          liệu giao dịch (mã giao dịch, gói đã mua, trạng thái thanh toán) để quản lý gói dịch vụ của bạn.
        </li>
        <li>Sau khi thanh toán thành công, gói trả phí sẽ được kích hoạt theo đúng gói bạn đã chọn mua.</li>
        <li>
          Chính sách hoàn tiền (nếu có) sẽ tuân theo điều khoản của nhà cung cấp thanh toán và quy định hiện
          hành; vui lòng liên hệ <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> nếu bạn gặp vấn đề
          với giao dịch thanh toán.
        </li>
      </ul>

      {/* 6. Quy tắc sử dụng & nội dung bị cấm */}
      <h2>6. Quy tắc sử dụng &amp; nội dung bị cấm</h2>
      <p>Khi sử dụng SpeakBuddi, bạn đồng ý không thực hiện các hành vi sau:</p>
      <ul>
        <li>Sử dụng dịch vụ cho mục đích trái pháp luật, lừa đảo, hoặc gây hại cho người khác.</li>
        <li>Cố gắng truy cập trái phép vào hệ thống, tài khoản người khác, hoặc can thiệp vào hoạt động bình thường của dịch vụ (ví dụ: tấn công, khai thác lỗ hổng, thu thập dữ liệu tự động trái phép).</li>
        <li>Tải lên, gửi hoặc tạo ra (kể cả qua hội thoại với AI) nội dung phản cảm, xúc phạm, phân biệt đối xử, vi phạm pháp luật hoặc quyền của bên thứ ba.</li>
        <li>Sao chép, phân phối lại hoặc khai thác thương mại nội dung học tập của SpeakBuddi mà không được phép.</li>
      </ul>
      <p>Chúng tôi có quyền tạm khóa hoặc chấm dứt tài khoản vi phạm các quy tắc trên.</p>

      {/* 7. Sở hữu trí tuệ / nội dung học */}
      <h2>7. Sở hữu trí tuệ &amp; nội dung học</h2>
      <p>
        Toàn bộ nội dung học tập, giao diện, thương hiệu và mã nguồn của SpeakBuddi thuộc quyền sở hữu của
        chúng tôi hoặc được cấp phép hợp pháp để sử dụng, trừ khi có ghi chú khác.
      </p>
      <p>
        Một phần nội dung học (chủ đề, từ vựng theo trình độ) có thể được tổng hợp tự động từ nguồn{" "}
        <strong>Langeek</strong> thông qua công cụ thu thập nội dung theo lịch định kỳ. Việc thu thập này
        được thực hiện <strong>tuân thủ Điều khoản dịch vụ của Langeek, file robots.txt, các quy định về bản
        quyền/cấp phép và giới hạn tần suất truy cập</strong>; trường hợp việc thu thập tự động không được
        phép, nội dung sẽ được nhập/biên soạn thủ công thay thế. Bạn không được sao chép hoặc tái phân phối
        nội dung học của SpeakBuddi (kể cả nội dung có nguồn gốc từ Langeek) ngoài mục đích học tập cá nhân.
      </p>

      {/* 8. Giới hạn trách nhiệm & thay đổi điều khoản */}
      <h2>8. Giới hạn trách nhiệm &amp; thay đổi điều khoản</h2>
      <ul>
        <li>SpeakBuddi được cung cấp "nguyên trạng" (as-is); chúng tôi nỗ lực đảm bảo dịch vụ hoạt động ổn định nhưng không cam kết dịch vụ luôn sẵn sàng liên tục, không có lỗi hoặc đáp ứng mọi nhu cầu cá nhân.</li>
        <li>Phản hồi từ AI (chấm điểm phát âm, hội thoại, gợi ý học tập...) mang tính chất hỗ trợ học tập, không thay thế hoàn toàn cho đánh giá của giáo viên/chuyên gia ngôn ngữ.</li>
        <li>Trong phạm vi pháp luật cho phép, SpeakBuddi không chịu trách nhiệm cho các thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.</li>
        <li>Chúng tôi có thể cập nhật điều khoản dịch vụ này theo thời gian; phiên bản mới sẽ được đăng tại trang này kèm ngày "Cập nhật lần cuối". Việc bạn tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.</li>
      </ul>

      {/* 9. Liên hệ */}
      <h2>9. Liên hệ</h2>
      <p>
        Nếu bạn có câu hỏi, góp ý hoặc khiếu nại liên quan đến điều khoản dịch vụ này, vui lòng liên hệ{" "}
        {OPERATOR_NAME} qua email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
