import type { Metadata } from "next";
import policies from "@/data/policies.json";
import { siteConfig } from "@/data/site-config";
import PolicyPage from "@/components/policy-page";
import BankCard from "@/components/bank-card";
import type { Block } from "@/components/article-body";
import { policyVi, PAYMENT_INTRO_VI } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Payment Methods",
  description: "How purchasing works at Aurora Saigon, the payment methods we accept and our bank transfer details.",
};

export default function PaymentMethodsPage() {
  const blocks = policies.pages.payment.blocks as Block[];
  const { bankDetails, checkoutProcess } = siteConfig;

  // the live page's own copy, in its own order: ordering steps, then the payment method paragraph
  const paragraphAfter = (heading: string) => {
    const i = blocks.findIndex((b) => b.type === "h3" && b.text === heading);
    return blocks.slice(i + 1).find((b) => b.type === "p");
  };
  const adding = paragraphAfter("Adding to Cart");
  const checkout = paragraphAfter("Check-out Process");
  const method = paragraphAfter("Payment Method");

  // Vietnamese: the live page's paragraphs in order (adding to cart, check-out, payment method)
  const vb = policyVi.payment.blocks as Block[];
  const vCheckout = vb.find((b, i) => b.type === "p" && vb[i - 1]?.type === "h3");
  // the live paragraph runs the bank details on at its end; they are shown (verified) in the bank panel below instead
  const vMethodRaw = vb.filter((b) => b.type === "p").pop();
  const vMethod = vMethodRaw?.text ? { ...vMethodRaw, text: vMethodRaw.text.replace(/s*Ngân Hàng:.*$/i, "").trim() } : vMethodRaw;
  const vAdding = vb.find((b) => b.type === "p");
  const VI_METHODS = ["Thẻ nội địa / ATM qua cổng thanh toán (Visa/MasterCard/JCB)", "Chuyển khoản ngân hàng trực tiếp đến ACB", "Thẻ tín dụng quốc tế qua Stripe (Demo)"];

  return (
    <PolicyPage
      vi={{
        title: <>Quy trình mua hàng &amp; <em className="text-champagne-deep">thanh toán</em></>,
        intro: PAYMENT_INTRO_VI,
        sections: [
          { heading: "Thêm vào giỏ hàng & thanh toán", blocks: [{ type: "h3", text: "Thêm Vào Giỏ Hàng" }, ...(vAdding ? [vAdding] : []), { type: "h3", text: "Tiến Hành Thanh Toán" }, ...(vCheckout ? [vCheckout] : [])] },
          { heading: "Phương thức thanh toán", blocks: [...(vMethod && vMethodRaw !== vCheckout && vMethodRaw !== vAdding ? [vMethod] : []), { type: "ul", items: VI_METHODS }] },
          {
            heading: "Thông tin chuyển khoản ngân hàng",
            blocks: [],
            after: (
              <BankCard
                fields={[
                  { label: "Ngân hàng", value: bankDetails.bankName },
                  { label: "Chủ tài khoản", value: bankDetails.accountHolder },
                  { label: "Số tài khoản", value: bankDetails.accountNumber },
                ]}
                note="Cửa hàng demo: đây là thông tin được doanh nghiệp thật công bố. Vui lòng không chuyển tiền cho đơn hàng demo."
              />
            ),
          },
        ],
      }}
      title={<>Purchase process &amp; <em className="text-champagne-deep">payment</em></>}
      intro="This storefront is a demonstration: checkout is simulated, no payment is taken and nothing you enter is stored. The details below are the ones Aurora Saigon publishes for real orders; please do not transfer money for a demo order."
      sections={[
        {
          heading: "Adding to cart & check-out",
          blocks: [
            { type: "h3", text: "Adding to Cart" },
            ...(adding ? [adding] : []),
            { type: "h3", text: "Check-out Process" },
            ...(checkout ? [checkout] : []),
          ],
        },
        {
          heading: "Payment methods",
          blocks: [...(method ? [method] : []), { type: "ul", items: [...checkoutProcess.methods] }],
        },
        {
          heading: "Direct bank transfer details",
          blocks: [],
          after: (
            <BankCard
              fields={[
                { label: "Bank", value: bankDetails.bankName },
                { label: "Account holder", value: bankDetails.accountHolder },
                { label: "Account number", value: bankDetails.accountNumber },
              ]}
              note="Demo storefront: these are the live business's published details. Please do not transfer money for a demo order."
            />
          ),
        },
      ]}
    />
  );
}
