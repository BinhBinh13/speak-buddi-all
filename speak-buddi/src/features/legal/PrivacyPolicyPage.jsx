// src/features/legal/PrivacyPolicyPage.jsx
// Trang Chính sách bảo mật (công khai, không yêu cầu đăng nhập) — S12.1
// Nội dung diễn giải dựa trên SRS §4.6 (Privacy and Data Classification) + §4.7 (Compliance Requirements)
// + §4.5 (Security). Đây KHÔNG phải văn bản pháp lý chính thức — cần bộ phận pháp chế rà soát trước
// khi đưa vào production thật (xem ghi chú trong plan/S12.1-plan.md mục 6).
import { Link } from "react-router-dom";
import LegalLayout from "./components/LegalLayout";
import { UI } from "../../shared/constants/designTokens";

const LAST_UPDATED = "07/06/2026";
// TODO: thay bằng email hỗ trợ chính thức khi có (xem plan/S12.1-plan.md §6 — câu hỏi cho user)
const SUPPORT_EMAIL = "support@speakbuddi.vn";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Chính sách bảo mật"
      lastUpdated={LAST_UPDATED}
      crossLink={
        <p style={{ margin: 0, fontFamily: UI.font, fontSize: UI.fontSize.bodyMd, color: UI.onSurfaceVariant }}>
          Xem thêm <Link to="/terms">Điều khoản dịch vụ</Link> để hiểu rõ quyền & nghĩa vụ khi sử dụng SpeakBuddi.
        </p>
      }
    >
      {/* 1. Giới thiệu / phạm vi áp dụng */}
      <h2>1. Giới thiệu &amp; phạm vi áp dụng</h2>
      <p>
        SpeakBuddi ("chúng tôi", "nền tảng") là website học tiếng Anh giúp bạn học từ vựng theo trình độ
        A1–C2, làm bài kiểm tra, dịch từ, luyện phát âm và hội thoại cùng AI. Chính sách bảo mật này mô tả
        cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng dịch vụ.
      </p>
      <p>
        Chính sách áp dụng cho phiên bản <strong>v1.1.0</strong> của SpeakBuddi và có thể được cập nhật khi
        dịch vụ phát triển thêm. Bằng việc tạo tài khoản hoặc sử dụng SpeakBuddi, bạn xác nhận đã đọc và
        đồng ý với chính sách này.
      </p>

      {/* 2. Dữ liệu chúng tôi thu thập */}
      <h2>2. Dữ liệu chúng tôi thu thập</h2>
      <p>Để cung cấp và cá nhân hóa trải nghiệm học tập, chúng tôi thu thập các nhóm dữ liệu sau:</p>
      <ul>
        <li><strong>Thông tin tài khoản:</strong> họ tên, địa chỉ email, mật khẩu (được băm — không lưu dạng văn bản thuần), thông tin đăng nhập qua Google (OAuth provider ID nếu bạn chọn đăng nhập bằng Google).</li>
        <li><strong>Thông tin học tập:</strong> trình độ tiếng Anh đã chọn (A1–C2), mục tiêu học, sở thích, lộ trình học và tiến độ.</li>
        <li><strong>Kết quả học tập:</strong> kết quả bài kiểm tra từ vựng/ngữ pháp, điểm số, lịch sử làm bài.</li>
        <li><strong>Lịch sử dịch thuật:</strong> các từ/cụm từ bạn đã tra cứu hoặc dịch trên nền tảng.</li>
        <li><strong>Dữ liệu hội thoại với AI:</strong> bản ghi nội dung hội thoại (transcript) phục vụ chấm điểm và cải thiện trải nghiệm học.</li>
        <li><strong>Âm thanh luyện phát âm:</strong> bản ghi âm bạn tạo ra khi luyện phát âm để hệ thống chấm điểm độ chính xác.</li>
        <li><strong>Thông tin thanh toán (đối với người dùng gói trả phí):</strong> chỉ các thông tin giao dịch ở mức siêu dữ liệu (mã giao dịch, gói đã mua, trạng thái thanh toán) — chúng tôi <strong>không</strong> lưu trữ số thẻ hay thông tin thanh toán nhạy cảm (xem mục 5).</li>
      </ul>

      <p>Để dễ hình dung mức độ nhạy cảm, chúng tôi phân loại dữ liệu theo 4 nhóm sau (diễn giải theo SRS §4.6):</p>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Phân loại</th>
            <th>Ví dụ dữ liệu</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Công khai (Public)</td>
            <td>Trang giới thiệu, bảng giá công khai, nội dung học đã xuất bản — ai cũng xem được.</td>
          </tr>
          <tr>
            <td>Nội bộ (Internal)</td>
            <td>Cấu hình hệ thống, cấu hình & nhật ký công cụ thu thập nội dung, nội dung chưa xuất bản — chỉ vận hành nội bộ.</td>
          </tr>
          <tr>
            <td>Bảo mật (Confidential)</td>
            <td>Hồ sơ cá nhân, trình độ học, email, kết quả bài kiểm tra, tiến độ học, transcript hội thoại AI, lịch sử dịch, siêu dữ liệu giao dịch thanh toán.</td>
          </tr>
          <tr>
            <td>Hạn chế (Restricted/Sensitive)</td>
            <td>Mật khẩu đã băm, token đăng nhập (refresh/session token), audio luyện phát âm, mã định danh từ nhà cung cấp OAuth.</td>
          </tr>
        </tbody>
      </table>

      {/* 3. Cách chúng tôi sử dụng dữ liệu */}
      <h2>3. Cách chúng tôi sử dụng dữ liệu</h2>
      <p>Chúng tôi sử dụng dữ liệu đã thu thập để:</p>
      <ul>
        <li>Vận hành các tính năng học tập: học từ vựng, làm bài kiểm tra, dịch từ, luyện phát âm, hội thoại AI.</li>
        <li><strong>Cá nhân hóa lộ trình và nội dung học</strong> dựa trên trình độ, mục tiêu, sở thích và kết quả học tập của bạn (giúp gợi ý chủ đề, từ vựng và bài tập phù hợp hơn).</li>
        <li>Chấm điểm và đưa ra phản hồi cho bài kiểm tra, bài luyện phát âm và hội thoại AI.</li>
        <li>Quản lý tài khoản, xác thực đăng nhập và bảo vệ tài khoản của bạn.</li>
        <li>Xử lý thanh toán cho gói trả phí (Pro) thông qua nhà cung cấp thanh toán được ủy quyền.</li>
        <li>Cải thiện chất lượng dịch vụ, khắc phục sự cố và đảm bảo an toàn hệ thống.</li>
      </ul>

      {/* 4. Lưu trữ & thời gian giữ dữ liệu */}
      <h2>4. Lưu trữ &amp; thời gian giữ dữ liệu</h2>
      <p>Chúng tôi áp dụng các mốc thời gian lưu trữ cụ thể như sau:</p>
      <ul>
        <li><strong>Audio luyện phát âm:</strong> được lưu trữ tối đa <strong>30 ngày</strong> kể từ thời điểm ghi âm, sau đó sẽ bị xóa khỏi hệ thống.</li>
        <li><strong>Điểm số &amp; siêu dữ liệu kết quả học tập:</strong> có thể được lưu trữ lâu hơn 30 ngày để bạn theo dõi tiến độ học tập và xem lại lịch sử của mình.</li>
        <li><strong>Audio hội thoại với AI:</strong> <strong>không được lưu trữ mặc định</strong> — chúng tôi chỉ giữ lại bản ghi nội dung dạng văn bản (transcript) phục vụ chấm điểm, không lưu file âm thanh đầy đủ của cuộc hội thoại.</li>
        <li>Hệ thống có thể thực hiện sao lưu (backup) định kỳ phục vụ khôi phục sự cố; dữ liệu sao lưu tuân theo cùng nguyên tắc bảo mật và thời hạn lưu trữ như dữ liệu gốc.</li>
      </ul>

      {/* 5. Bảo mật dữ liệu */}
      <h2>5. Bảo mật dữ liệu</h2>
      <p>Chúng tôi áp dụng các biện pháp kỹ thuật để bảo vệ dữ liệu của bạn, bao gồm:</p>
      <ul>
        <li>Mã hóa kết nối qua <strong>HTTPS</strong> cho mọi giao tiếp giữa trình duyệt và máy chủ.</li>
        <li><strong>Mật khẩu được băm</strong> (hash) trước khi lưu trữ — chúng tôi không bao giờ lưu mật khẩu dạng văn bản thuần và không thể xem lại mật khẩu gốc của bạn.</li>
        <li>Xác thực đăng nhập bằng <strong>JWT</strong> (JSON Web Token) tự ký, có thời hạn sử dụng giới hạn.</li>
        <li>Không ghi log mật khẩu, token, hoặc nội dung audio nhạy cảm trong nhật ký hệ thống.</li>
        <li>Phân loại dữ liệu theo mức độ nhạy cảm (xem mục 2) để áp dụng quyền truy cập phù hợp cho đội ngũ vận hành.</li>
      </ul>

      {/* 6. Quyền của người dùng */}
      <h2>6. Quyền của người dùng</h2>
      <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
      <ul>
        <li>Xem và cập nhật thông tin hồ sơ cá nhân (trình độ, mục tiêu, sở thích...) trong phần Hồ sơ/Cài đặt tài khoản.</li>
        <li>
          <strong>Yêu cầu xóa dữ liệu cá nhân:</strong> bạn có quyền yêu cầu chúng tôi xóa tài khoản và dữ liệu
          cá nhân liên quan (hồ sơ, lịch sử học tập, audio đã ghi...). Bạn có thể thực hiện trực tiếp trong ứng dụng
          tại trang <Link to="/profile">Hồ sơ &amp; Cài đặt</Link> → mục{" "}
          <strong>Xóa tài khoản &amp; dữ liệu cá nhân</strong>, hoặc gửi yêu cầu qua email hỗ trợ{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; chúng tôi sẽ xác minh danh tính và xử lý
          yêu cầu trong thời gian hợp lý.
        </li>
        <li>Liên hệ với chúng tôi nếu phát hiện dữ liệu cá nhân không chính xác để được hỗ trợ điều chỉnh.</li>
      </ul>

      {/* 7. Tuân thủ */}
      <h2>7. Tuân thủ</h2>
      <p>
        Ở phiên bản <strong>v1.1.0</strong>, SpeakBuddi <strong>chưa áp dụng đầy đủ</strong> các khung tuân
        thủ quốc tế như <strong>GDPR, SOC2, ISO 27001, HIPAA</strong>. Chúng tôi cam kết tuân thủ các yêu cầu
        cơ bản về thông báo thu thập dữ liệu và quyền yêu cầu xóa dữ liệu cá nhân theo mô tả trong chính
        sách này, đồng thời sẽ tiếp tục cải thiện mức độ tuân thủ khi phạm vi dịch vụ mở rộng.
      </p>
      <p>
        Vì hệ thống <strong>không lưu trữ trực tiếp thông tin thẻ thanh toán</strong> mà ủy quyền xử lý cho
        nhà cung cấp thanh toán bên thứ ba, chúng tôi không thuộc diện phải tuân thủ trực tiếp tiêu chuẩn
        PCI-DSS (xem thêm mục 5 của Điều khoản dịch vụ).
      </p>

      {/* 8. Thay đổi chính sách & liên hệ */}
      <h2>8. Thay đổi chính sách &amp; liên hệ</h2>
      <p>
        Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian để phản ánh thay đổi trong dịch vụ
        hoặc quy định pháp luật. Phiên bản cập nhật sẽ được đăng tại trang này kèm theo ngày "Cập nhật lần
        cuối" ở đầu trang.
      </p>
      <p>
        Nếu bạn có câu hỏi về chính sách bảo mật hoặc cách chúng tôi xử lý dữ liệu cá nhân, vui lòng dùng{" "}
        <Link to="/contact" style={{ color: UI.primary, fontWeight: UI.fontWeight.labelMd }}>
          form liên hệ
        </Link>{" "}
        hoặc gửi email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}
