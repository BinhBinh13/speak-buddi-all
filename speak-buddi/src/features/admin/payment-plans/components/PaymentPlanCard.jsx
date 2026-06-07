// speak-buddi/src/features/admin/payment-plans/components/PaymentPlanCard.jsx
// Card 1 gói thanh toán — UI: quan_li_goi_thanh_toan_admin

import { LuCheck, LuStar, LuX } from "react-icons/lu";
import { COLORS, FONTS } from "../../../../shared/constants/theme";
import { formatDurationLabel, formatPlanPrice } from "../utils/formatPrice";

/**
 * @param {{
 *   plan: object,
 *   highlighted?: boolean,
 *   onEdit: (plan: object) => void,
 *   onDisable?: (plan: object) => void,
 * }} props
 */
export default function PaymentPlanCard({ plan, highlighted = false, onEdit, onDisable }) {
  const features = plan.features || [];
  const inactive = plan.is_active === false;

  return (
    <article
      className={`ppc-card${highlighted ? " ppc-card--highlight" : ""}${inactive ? " ppc-card--inactive" : ""}`}
      style={{ fontFamily: FONTS.body }}
    >
      {highlighted && (
        <div className="ppc-badge">PHỔ BIẾN NHẤT</div>
      )}
      {inactive && (
        <div className="ppc-badge ppc-badge--draft">Đã tắt</div>
      )}

      <div className="ppc-body">
        <div className="ppc-header">
          <h3 className="ppc-name" style={{ color: highlighted ? COLORS.primary : COLORS.onSurface }}>
            {highlighted && <LuStar size={18} fill={COLORS.primary} color={COLORS.primary} />}
            {plan.name}
          </h3>
          <div className="ppc-price-row">
            <span className="ppc-price">{formatPlanPrice(plan.price_vnd)}</span>
            <span className="ppc-duration">{formatDurationLabel(plan.duration_days)}</span>
          </div>
        </div>

        {plan.description && (
          <p className="ppc-desc">{plan.description}</p>
        )}

        <div className="ppc-divider" />

        <ul className="ppc-features">
          {features.map((feat, i) => (
            <li key={`${feat}-${i}`} className="ppc-feature">
              <LuCheck size={18} color={COLORS.emeraldDark} />
              <span>{feat}</span>
            </li>
          ))}
          {features.length === 0 && (
            <li className="ppc-feature ppc-feature--muted">
              <LuX size={18} />
              <span>Chưa có tính năng</span>
            </li>
          )}
        </ul>
      </div>

      <div className="ppc-footer">
        <button
          type="button"
          className="ppc-edit-btn"
          onClick={() => onEdit(plan)}
          aria-label={`Sửa gói ${plan.name}`}
        >
          Sửa gói
        </button>
        {!inactive && onDisable && (
          <button
            type="button"
            className="ppc-disable-btn"
            onClick={() => onDisable(plan)}
            aria-label={`Vô hiệu hóa gói ${plan.name}`}
          >
            Vô hiệu hóa
          </button>
        )}
      </div>

      <style>{CARD_CSS}</style>
    </article>
  );
}

const CARD_CSS = `
  .ppc-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid rgba(119, 117, 135, 0.25);
    box-shadow: 0 1px 4px rgba(27, 27, 36, 0.06);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;
  }
  .ppc-card--highlight {
    border: 2px solid ${COLORS.primary};
    box-shadow: 0 8px 24px rgba(77, 68, 227, 0.12);
    transform: scale(1.02);
    z-index: 1;
  }
  .ppc-card--inactive {
    opacity: 0.72;
  }
  .ppc-badge {
    position: absolute;
    top: 0;
    right: 24px;
    background: ${COLORS.primary};
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 4px 12px;
    border-radius: 0 0 8px 8px;
  }
  .ppc-badge--draft {
    background: #777587;
    right: auto;
    left: 24px;
  }
  .ppc-body {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
  .ppc-header { margin-bottom: 12px; }
  .ppc-name {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ppc-price-row {
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }
  .ppc-price {
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
    color: ${COLORS.onSurface};
  }
  .ppc-duration {
    font-size: 16px;
    color: #464555;
    padding-bottom: 4px;
  }
  .ppc-desc {
    font-size: 14px;
    color: #464555;
    margin: 0 0 12px;
    line-height: 1.5;
  }
  .ppc-divider {
    height: 1px;
    background: rgba(119, 117, 135, 0.2);
    margin: 8px 0 12px;
  }
  .ppc-features {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  .ppc-feature {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 16px;
    color: ${COLORS.onSurface};
  }
  .ppc-feature--muted {
    opacity: 0.5;
    color: #464555;
  }
  .ppc-footer {
    padding: 0 24px 24px;
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ppc-edit-btn {
    width: 100%;
    min-height: 44px;
    padding: 12px 16px;
    border-radius: 8px;
    border: 2px solid rgba(119, 117, 135, 0.35);
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .ppc-edit-btn:hover {
    border-color: ${COLORS.primary};
    color: ${COLORS.primary};
  }
  .ppc-disable-btn {
    width: 100%;
    min-height: 44px;
    padding: 12px 16px;
    border-radius: 8px;
    border: 2px solid rgba(186, 26, 26, 0.35);
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: #ba1a1a;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .ppc-disable-btn:hover {
    background: rgba(186, 26, 26, 0.06);
    border-color: #ba1a1a;
  }
`;
