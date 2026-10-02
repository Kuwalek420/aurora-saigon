/**
 * Text for the three landing pages, taken from aurorasaigon.com (English and Vietnamese versions of each page) and
 * kept as published. Nothing here is written for the storefront, with ONE deliberate exception: the ring-making price
 * sentences use placeholders so they follow the currency selector and use the SAME figures in both languages.
 * The live English page quotes VND 28-35 million (18k gold) and 30-45 million (platinum); the live Vietnamese page still
 * quotes the older VND 20-28 million and 25-35 million. The English figures are used for both; the owner should confirm.
 */
export type Bi = { en: string; vi: string };

/** Ring-making charge ranges (VND) as published on the live English page. The stone is priced separately. */
export const RING_MAKING = { gold18: [28_000_000, 35_000_000], platinum: [30_000_000, 45_000_000] } as const;

export const CUSTOM_RING = {
  source: "https://aurorasaigon.com/create-your-own-engagement-ring",
  // h1 as requested for this route; the live Vietnamese h1 reads "TỰ TAY THIẾT KẾ CHIẾC NHẪN ĐÍNH HÔN CỦA RIÊNG BẠN"
  title: { en: "Create Your Own Engagement Ring", vi: "Tự Tay Thiết Kế Chiếc Nhẫn Đính Hôn Của Riêng Bạn" } as Bi,
  intro: {
    en: "At Aurora Saigon, when purchasing an engagement ring, the journey of how you came to choose the ring should be a memorable experience, and the ring should be something from your creation and heart. An engagement ring symbolises a sign of eternal love and faithfulness, perfection and infinity. The journey of how you came to purchase your ring is just as important as the final ring itself and something you will remember for the rest of your life. Why we feel designing and custom-making your engagement ring is the only way to go!",
    vi: "Tại Aurora Sài Gòn, khi bạn muốn mua một chiếc nhẫn đính hôn, quá trình thiết kế chiếc nhẫn của riêng bạn sẽ là một trải nghiệm đáng nhớ và chiếc nhẫn đó sẽ được làm từ lòng chân thành từ trái tim của bạn. Nhẫn đính hôn tượng trưng cho tình yêu vĩnh cửu và sự chung thủy, hoàn hảo và vô hạn. Tại sao chúng tôi cảm thấy việc thiết kế và làm theo yêu cầu riêng cho chiếc nhẫn đính hôn của bạn là cách duy nhất và chân thành nhất bạn nên làm!",
  } as Bi,
  gemstone: {
    heading: { en: "Finding the Perfect Gemstone!", vi: "Chọn viên đá quý hoàn hảo!" } as Bi,
    body: [{
      en: "We understand that you may not have an idea yet, how you want the ring to be. This is something we will help you explore and something you should take time in deciding. With any engagement ring, the centre stone is key to the overall design and this is usually where we start. Be it a classic 1ct round diamond or any shaped coloured gemstone, we will help you choose the perfect centre piece for your ring.",
      vi: "Chúng tôi hiểu rằng bạn có thể chưa có ý tưởng về việc bạn muốn chiếc nhẫn như thế nào. Đây là điều chúng tôi sẽ giúp bạn khám phá và là điều bạn nên dành thời gian để quyết định. Với bất kỳ chiếc nhẫn đính hôn nào, viên đá ở giữa là chìa khóa cho thiết kế tổng thể và đây thường là nơi chúng ta bắt đầu. Dù là viên kim cương tròn 1ct cổ điển hay đá quý có hình dạng màu bất kỳ, chúng tôi sẽ giúp bạn chọn viên đá trung tâm hoàn hảo cho chiếc nhẫn của mình.",
    }] as Bi[],
  },
  cost: {
    heading: { en: "Cost and Budget", vi: "Giá cả và Ngân sách" } as Bi,
    body: [
      {
        en: "You may think creating your ring will end up being more expensive when, in fact, it will most likely end up cheaper. Why? At Aurora Saigon, we specialise in handcrafting all our jewellery, and we do not have any expensive fancy shop fronts to add costs to the jewellery. The quality and magic of making jewellery are back at the Goldsmith workshop, where we invest our time and resources to return the best value and quality to you.",
        vi: "Bạn có thể nghĩ rằng việc tạo ra chiếc nhẫn của mình sẽ đắt hơn trong khi trên thực tế, rất có thể nó sẽ rẻ hơn. Tại sao? Tại Aurora Sài Gòn, chúng tôi chuyên chế tác thủ công tất cả đồ trang sức của mình và chúng tôi không có bất kỳ cửa hàng sang trọng đắt tiền nào để tăng thêm chi phí cho đồ trang sức. Chất lượng và sự kỳ diệu của việc chế tác đồ trang sức ở ngay tại xưởng chế tác trang sức của chúng tôi, nơi chúng tôi đầu tư thời gian và nguồn lực để mang lại giá trị và chất lượng tốt nhất cho bạn.",
      },
      {
        // {from} {to}: the live English page's figures, formatted in the selected currency
        en: "To give you an idea, we charge from {from} to {to} to create the ring in 18k gold - depending on the design and weight. It is then up to you how much you want to spend on the gemstones that will grace your ring.",
        vi: "Để bạn dễ hình dung, chúng tôi tính phí từ {from} đến {to} để tạo ra chiếc nhẫn bằng vàng 18k - tùy theo mẫu mã và trọng lượng. Sau đó, việc bạn muốn chi bao nhiêu cho những viên đá quý sẽ làm tôn lên chiếc nhẫn của bạn là tùy thuộc vào bạn.",
      },
      {
        en: "We also offer the option to create beautiful Platinum engagement rings, with prices starting from {from} to {to}. Our platinum engagement rings are crafted with the finest attention to detail and are perfect for those seeking a timeless, elegant, and durable symbol of love and commitment. Whether you prefer a classic, modern, or unique design, our platinum engagement rings are customizable to suit your style and budget.",
        vi: "Ngoài ra, Aurora còn có dịch vụ chế tác nhẫn đính hôn Bạch Kim cao cấp, với giá khởi điểm từ {from} đến {to}. Nhẫn đính hôn bạch kim của chúng tôi được chế tác với sự tỉ mỉ nhất đến từng chi tiết và hoàn hảo cho những ai đang tìm kiếm biểu tượng vượt thời gian, thanh lịch và bền bỉ của tình yêu cho một sự cam kết. Cho dù bạn thích thiết kế cổ điển, hiện đại hay độc đáo, nhẫn đính hôn bạch kim của chúng tôi đều có thể tùy chỉnh để phù hợp với phong cách và ngân sách của bạn.",
      },
    ] as Bi[],
  },
  design: {
    heading: { en: "Designing the Ring", vi: "Thiết kế chiếc nhẫn của bạn" } as Bi,
    body: [{
      en: "Our journey in designing your engagement ring starts with a seed - the concept. Through comprehensive discussions, we glean insights into your desires and dreams, sketching them onto paper, and translating those dreams into detailed drawings. These renderings are then brought to life through advanced 3D modeling, providing a tangible visual of what the finished product will look like. This step lets you view your ring from every angle and tweak as you see fit. After you approve of the 3D model, we utilize cutting-edge 3D printing technology to construct a prototype in wax. This gives you the unique opportunity to see and feel a physical manifestation of your ring, ensuring every facet aligns with your vision before the final crafting process begins.",
      vi: "Hành trình thiết kế chiếc nhẫn đính hôn của chúng tôi bắt đầu từ hạt giống - ý tưởng. Thông qua các cuộc thảo luận toàn diện, chúng tôi thu thập những hiểu biết sâu sắc về mong muốn và ước mơ của bạn, phác thảo chúng ra giấy và chuyển những giấc mơ đó thành những bản vẽ chi tiết. Những ý tưởng này sau đó được hiện thực hóa thông qua mô hình 3D chuyên nghiệp, cung cấp hình ảnh hữu hình về sản phẩm hoàn chỉnh sẽ trông như thế nào. Bước này cho phép bạn xem chiếc nhẫn của mình từ mọi góc độ và điều chỉnh khi bạn thấy phù hợp. Sau khi bạn duyệt mô hình 3D, chúng tôi sử dụng công nghệ in 3D tiên tiến để tạo ra nguyên mẫu bằng sáp. Điều này mang đến cho bạn cơ hội duy nhất để nhìn và cảm nhận biểu hiện vật lý của chiếc nhẫn, đảm bảo mọi khía cạnh đều phù hợp với tầm nhìn của bạn trước khi quá trình chế tạo cuối cùng bắt đầu.",
    }] as Bi[],
  },
  time: {
    heading: { en: "How Long Does it Take?", vi: "Thời gian chế tác?" } as Bi,
    body: [
      {
        en: "We recommend allowing at least six weeks to create your dream ring. Most of this time will be spent designing and sourcing the correct centre stone for the ring. We will also be able to prototype the ring first in silver because we understand you will only get a natural feel for the ring once you see a finished example. We want you to be 100% delighted with your engagement ring, and we understand there could be changes before we reach it.",
        vi: "Chúng tôi khuyên bạn nên dành ít nhất sáu tuần để tạo ra chiếc nhẫn mơ ước của mình. Phần lớn thời gian này sẽ được dành cho việc thiết kế và tìm nguồn cung ứng viên đá chủ cho chiếc nhẫn. Chúng tôi cũng sẽ có thể tạo nguyên mẫu chiếc nhẫn trước bằng bạc vì chúng tôi hiểu rằng bạn sẽ chỉ có cảm giác tự nhiên về chiếc nhẫn sau khi nhìn thấy một mẫu hoàn thiện. Chúng tôi muốn bạn hài lòng 100% với chiếc nhẫn đính hôn của mình và chúng tôi hiểu rằng có thể có những thay đổi trước khi chúng tôi đạt được nó.",
      },
      {
        en: "We also understand that you may not have time, and two to three weeks is the minimum amount of time we require. However, if you have limited time, we ask you to be flexible in the design and gemstone choice.",
        vi: "Chúng tôi cũng hiểu rằng bạn có thể không có thời gian, vậy thì hai đến ba tuần là khoảng thời gian tối thiểu chúng tôi yêu cầu. Tuy nhiên, nếu bạn có thời gian hạn chế, chúng tôi yêu cầu bạn hãy linh hoạt trong việc thiết kế và lựa chọn đá quý.",
      },
    ] as Bi[],
  },
  start: {
    heading: { en: "Getting Started", vi: "Bắt đầu" } as Bi,
    body: [
      {
        en: "We invite you to contact us for a complimentary price quote for your bespoke ring design. Don't hesitate to contact us and start this extraordinary journey of love and craftsmanship.",
        vi: "Mời các bạn liên hệ với chúng tôi để được báo giá miễn phí cho những mẫu nhẫn theo yêu cầu của bạn. Đừng ngần ngại liên hệ với chúng tôi và bắt đầu cuộc hành trình phi thường của tình yêu và sự khéo léo.",
      },
      {
        en: "We look forward to crafting your dream ring and forging an unforgettable story together.",
        vi: "Chúng tôi mong muốn tạo ra chiếc nhẫn trong mơ của bạn và cùng nhau tạo nên một câu chuyện khó quên.",
      },
    ] as Bi[],
  },
};

export const LAB_DIAMONDS = {
  source: "https://aurorasaigon.com/shop-lab-diamonds",
  title: { en: "Shop Lab Diamonds & Pricing Guide", vi: "Bảng Giá Kim Cương Nhân Tạo" } as Bi,
  // the page's own intro line
  intro: {
    en: "Search through our loose lab grown diamonds. Extensive collection of lab grown diamonds all with GIA or IGI Certification.",
    vi: "Tìm kiếm trong bộ sưu tập kim cương nhân tạo của chúng tôi. Bộ sưu tập kim cương nhân tạo phong phú, tất cả đều có chứng nhận GIA hoặc IGI.",
  } as Bi,
};

export const FANCY_DIAMONDS = {
  source: "https://aurorasaigon.com/fancy-coloured-lab-diamonds",
  title: { en: "Fancy Coloured Lab Diamonds", vi: "Kim Cương Nhân Tạo Màu Fancy" } as Bi,
  intro: {
    en: "Shop our extensive range of loose fancy coloured lab grown diamonds. Each diamond is ethically created and comes with GIA or IGI certification for guaranteed quality and authenticity.",
    vi: "Khám phá bộ sưu tập kim cương nuôi cấy màu fancy của chúng tôi. Bộ sưu tập đa dạng các loại kim cương nhân tạo màu fancy, tất cả đều có chứng nhận GIA hoặc IGI.",
  } as Bi,
};
