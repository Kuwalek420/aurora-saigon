/**
 * Vietnamese versions of the long static pages.
 *
 * SCRAPED: everything in `src/data/static-vi.json` is the live aurorasaigon.com Vietnamese text, exactly as published
 * (`node scripts/scrape-static-translations.js`). Each page is merged here with its English twin so the photos,
 * ids and layout flags carry over by position.
 * AUTHORED: the few passages the live Vietnamese site still shows in English (founder letter, 5-reasons intro), the
 * two owner-approved corrections of the 5-reasons page, and short UI sentences on pages whose live copy is a form.
 * They are marked below. Short UI strings (buttons, menus, headers) live in `i18n-vi.ts`, keyed by their English text.
 */
import vi from "@/data/static-vi.json";
import about from "@/data/about.json";
import reasons from "@/data/five-reasons.json";
import guide from "@/data/size-guide.json";
import faq from "@/data/faq.json";
import { siteConfig } from "@/data/site-config";

export const STATIC_VI = vi;

/* ---------------------------------- about ---------------------------------- */

/** AUTHORED: the live Vietnamese home page shows Nick's letter in English. */
const FOUNDER_LETTER_VI = {
  paragraphs: [
    "Sau nhiều năm sinh sống tại Việt Nam, tôi nhận ra rằng trải nghiệm mua sắm trang sức ở đây thường khiến người mua thất vọng. Nhiều nhà bán lẻ chỉ chú trọng lợi nhuận nhanh thay vì xây dựng niềm tin hay phục vụ tốt. Điều này thường khiến khách hàng gặp phải sự thiếu trung thực và thông tin mập mờ. Mua trang sức tại Việt Nam có thể giống như một canh bạc nhiều rủi ro, và nhiều người cảm thấy không chắc chắn về món đồ mình mua.",
    "Với nhiều năm kinh nghiệm trong ngành trang sức, chúng tôi đã xây dựng và vận hành thành công một doanh nghiệp xuất khẩu phục vụ thị trường Anh. Trong suốt hành trình đó, chúng tôi hiểu được tầm quan trọng của việc nắm bắt xu hướng thị trường, duy trì chất lượng cao và vun đắp mối quan hệ bền chặt với đối tác và khách hàng. Đam mê của chúng tôi là mang đến những sản phẩm xuất sắc.",
    "Chính sách đổi trả và bảo hành của chúng tôi vượt xa những gì thường thấy tại Việt Nam và gần với Luật Bảo vệ Người tiêu dùng của Anh hơn. Những chính sách này là nền tảng cho cam kết làm hài lòng khách hàng của Aurora Saigon.",
    "Chúng tôi rất hào hứng mang trải nghiệm mua sắm mang tính đột phá này đến Việt Nam. Chúng tôi hướng đến một cách mua trang sức hiện đại, minh bạch và vượt trội, nơi mỗi khách hàng cảm thấy được hỗ trợ và được cung cấp đầy đủ thông tin trong suốt hành trình cùng chúng tôi. Chúng tôi tin rằng đã đến lúc cho một kỷ nguyên mới của việc mua sắm trang sức tại Việt Nam, nơi niềm tin, sự tận tâm và chất lượng được đặt lên hàng đầu.",
  ],
  role: "Người sáng lập Aurora Saigon Jewellery",
  caption: "Nick, Người Sáng Lập Aurora Saigon Jewellery",
};

export const aboutVi: typeof about = {
  ...about,
  title: "Câu Chuyện Của Chúng Tôi",
  sections: about.sections.map((s, i) => ({ ...s, ...(vi.about.sections[i] as object), id: s.id, image: s.image })) as typeof about.sections,
  closing: vi.about.closing,
  founderLetter: {
    ...about.founderLetter,
    heading: vi.about.founderLetter.heading,
    paragraphs: FOUNDER_LETTER_VI.paragraphs,
    role: FOUNDER_LETTER_VI.role,
  },
};
export const FOUNDER_CAPTION_VI = FOUNDER_LETTER_VI.caption;

/* ------------------------------- five reasons ------------------------------- */

/** AUTHORED: the live Vietnamese intro is English. Origin from site-config (designed in HCMC, handcrafted in Bangkok). */
const REASONS_INTRO_VI =
  "Tại Aurora, chúng tôi tin rằng một món trang sức ý nghĩa không chỉ là tổng của các phần cấu thành. Khách hàng yêu thích đá quý thật và những thiết kế hiện đại, đặc trưng của chúng tôi, nhưng họ cũng yêu trang sức của chúng tôi vì cảm xúc mà một món trang sức mang lại, vì ý nghĩa đằng sau viên đá, và vì tất cả đều được chế tác thủ công bằng cả tình yêu. Thiết kế tại TP. Hồ Chí Minh, chế tác thủ công tại " +
  siteConfig.origin.workshop +
  ".";

/**
 * AUTHORED: Vietnamese versions of the same two owner-approved replacements the English page applies (the live claims
 * "exclusively natural gemstones" and "we have no storefront" conflict with the catalogue and the showroom).
 */
const REASON_CORRECTIONS_VI: [string, string][] = [
  [
    "Chúng tôi độc quyền sử dụng đá quý tự nhiên trong mỗi thiết kế được bán ra, chính vì trân trọng tâm hồn quý giá của mỗi người phụ nữ.",
    "Chúng tôi chọn lọc đá quý tự nhiên có nguồn gốc đạo đức và kim cương nuôi cấy cao cấp có chứng nhận, kèm giám định độc lập (GIA/IGI) cho kim cương, cùng cam kết nghiêm ngặt về tính xác thực cho từng sản phẩm.",
  ],
  [
    "Aurora không thật sự cần các mặt tiền cửa hàng đắt đỏ, chúng tôi mong muốn mang trang sức đến tận cửa nhà bạn, có thể tinh chỉnh và tạo ra một mức giá dễ chịu, ít lãng phí, xin được trân trọng bạn theo cách đó.",
    "Thay vì đẩy biên lợi nhuận lên để duy trì những cửa hàng đắt đỏ trên phố, chúng tôi vận hành một showroom riêng tại Thảo Điền, chuyển phần tiết kiệm đó đến bạn mà vẫn luôn sẵn sàng đón tiếp trực tiếp. Chúng tôi chỉ bán những món trang sức mà khách hàng yêu thích, nên có thể chế tác với chi phí thấp hơn, ít lãng phí và giữ mức giá hợp lý.",
  ],
];

export const reasonsVi: typeof reasons = {
  ...reasons,
  intro: REASONS_INTRO_VI,
  reasons: reasons.reasons.map((r, i) => ({
    ...r,
    heading: vi.fiveReasons.reasons[i].heading,
    body: REASON_CORRECTIONS_VI.reduce((t, [from, to]) => t.replace(from, to), vi.fiveReasons.reasons[i].body.trim()),
  })),
};

/* -------------------------------- size guide -------------------------------- */

export const guideVi: typeof guide = {
  ...guide,
  headings: vi.sizeGuide.headings,
  considerations: vi.sizeGuide.considerations,
  steps: vi.sizeGuide.steps,
  conversionNote: vi.sizeGuide.conversionNote ?? guide.conversionNote,
};

/* ----------------------------------- faq ----------------------------------- */

const pay = siteConfig.paymentGateways;
/** AUTHORED: Vietnamese twin of the reconciled English payment answer (faq/page.tsx). */
const PAYMENT_ONLINE_VI = `Trực tuyến: ${pay.domestic} (thẻ nội địa Việt Nam), chuyển khoản ngân hàng trực tiếp và ${pay.international} (thanh toán quốc tế; chế độ Demo trên cửa hàng này). Cửa hàng này đang chạy ở chế độ Demo mô phỏng: không thu tiền và không lưu bất kỳ thông tin nào.`;

export const faqVi = vi.faq.categories.map((c) => ({
  ...c,
  items: c.items.map((it) =>
    /thanh toán/i.test(it.question)
      ? { ...it, answer: [...it.answer.map((p) => p.replace(/\s*Ngoài ra, bạn có thể hoàn tất đơn hàng trực tuyến[^.]*\./i, "")), PAYMENT_ONLINE_VI] }
      : it,
  ),
})) as typeof faq.categories;

/* --------------------------------- policies --------------------------------- */

export const policyVi = {
  shippingReturns: vi.shippingReturns,
  payment: vi.payment,
  privacy: vi.privacy,
  warranty: vi.warranty,
  gemstone: vi.gemstone,
};

/** AUTHORED, short: the page-level sentences that sit above the scraped policy text. */
export const PAYMENT_INTRO_VI =
  "Cửa hàng này là bản trình diễn: thanh toán được mô phỏng, không thu tiền và không lưu bất kỳ thông tin nào bạn nhập. Các thông tin dưới đây là thông tin Aurora Saigon công bố cho đơn hàng thật; vui lòng không chuyển tiền cho đơn hàng demo.";
export const WARRANTY_INTRO_VI = `Nhẫn: Bảo hành trọn đời theo tiêu chuẩn Anh Quốc. Mặt dây, bông tai, vòng tay và dây chuyền: Bảo hành trang sức cao cấp 2 năm.`;
