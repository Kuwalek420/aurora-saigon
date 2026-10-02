import type { Metadata } from "next";
import policies from "@/data/policies.json";
import { siteConfig } from "@/data/site-config";
import PolicyPage from "@/components/policy-page";
import type { Block } from "@/components/article-body";
import { policyVi } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Aurora Saigon collects, uses and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  const { brand, paymentGateways: pay } = siteConfig;
  // the published "Registered Address - No Returns Here Please" line is replaced by the notice below, which says the same thing once
  const blocks = (policies.pages.privacy.blocks as Block[]).filter((b) => !/^Registered Address/i.test(b.text ?? ""));
  const notice: [string, React.ReactNode][] = [
    ["Registered legal entity", <>{brand.legalEntity}<br />{brand.legalRegisteredAddress}</>],
    ["Showroom visits", <>{siteConfig.showroom}<br />{brand.showroomAddress}</>],
    ["Payment processing partners", <>{pay.domestic} (domestic Vietnam cards) and {pay.international} (international payments)</>],
  ];
  const viBlocks = (policyVi.privacy.blocks as Block[]).filter((b) => !/^Địa Chỉ Đã Đăng Ký/i.test(b.text ?? ""));
  const viNotice: [string, React.ReactNode][] = [
    ["Pháp nhân đăng ký", <>{brand.legalEntity}<br />{brand.legalRegisteredAddress}</>],
    ["Ghé thăm showroom", <>{siteConfig.showroom}<br />{brand.showroomAddress}</>],
    ["Đối tác xử lý thanh toán", <>{pay.domestic} (thẻ nội địa Việt Nam) và {pay.international} (thanh toán quốc tế)</>],
  ];
  const noticeBox = (rows: [string, React.ReactNode][], foot: string) => (
    <div className="mx-auto max-w-[36rem]">
      <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {rows.map(([k, v], i) => (
          <div key={k} className={i === 2 ? "sm:col-span-2" : ""}>
            <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{k}</dt>
            <dd className="text-[0.95rem] leading-[1.7] text-obsidian/80">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-[0.85rem] leading-[1.7] text-muted-gray">{foot}</p>
    </div>
  );
  return (
    <PolicyPage
      vi={{
        title: <>Chính sách <em className="text-champagne-deep">bảo mật</em></>,
        sections: [
          { blocks: [], after: noticeBox(viNotice, "Địa chỉ đăng ký là địa chỉ pháp lý của công ty, không tiếp khách và không nhận hàng trả lại. Vui lòng ghé thăm chúng tôi tại showroom Thảo Điền.") },
          { blocks: viBlocks },
        ],
      }}
      title={<>Privacy <em className="text-champagne-deep">policy</em></>}
      sections={[
        {
          blocks: [],
          after: (
            <div className="mx-auto max-w-[36rem]">
              <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {notice.map(([k, v]) => (
                  <div key={k} className={k === "Payment processing partners" ? "sm:col-span-2" : ""}>
                    <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{k}</dt>
                    <dd className="text-[0.95rem] leading-[1.7] text-obsidian/80">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-[0.85rem] leading-[1.7] text-muted-gray">The registered address is the company&rsquo;s legal address and does not accept visitors or returns. Please visit us at the Thảo Điền showroom.</p>
            </div>
          ),
        },
        { blocks },
      ]}
    />
  );
}
