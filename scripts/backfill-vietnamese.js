/**
 * Fills the Vietnamese text the live site does not publish (it shows English there), so every product has Vietnamese.
 *
 *   node scripts/backfill-vietnamese.js          apply
 *   node scripts/backfill-vietnamese.js --dry    show what would change
 *
 * These are TRANSLATIONS of aurorasaigon.com's own English copy, written for this project (not scraped). They are only
 * ever written where description_vi / name_vi is empty or has no Vietnamese in it: text the site publishes in Vietnamese
 * is never overwritten. Every id this script writes is recorded in translated-vi.json so it can be reviewed.
 * Not translated: product names that are brand names (kept as published, e.g. "Margot Engagement Ring").
 * Left out on purpose: the claim "crafted in Ho Chi Minh City" in two source texts (the workshop is in Bangkok; see CLAUDE.md).
 */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
try { process.loadEnvFile(path.join(__dirname, "..", ".env.local")); } catch { /* env already set */ }

const DRY = process.argv.includes("--dry");
const VI = /[ạảãàáâậầấẩẫăắằặẳẵéèẻẽẹêếềệểễíìỉĩịóòỏõọôốồộổỗơớờợởỡúùủũụưứừựửữýỳỷỹỵđ]/i;

// ---- stone vocabulary (matches the live Vietnamese pages: "đá Mặt Trăng", "Hoàng Ngọc Xanh", "Thạch Anh Tím"...)
const S = {
  amethyst: "thạch anh tím", pinktopaz: "hoàng ngọc hồng", rosequartz: "thạch anh hồng", bluetopaz: "hoàng ngọc xanh",
  swissbluetopaz: "hoàng ngọc xanh Swiss", moonstone: "đá Mặt Trăng", garnet: "garnet", citrine: "thạch anh vàng",
  peridot: "peridot", blacksapphire: "sapphire đen", aquamarine: "aquamarine", lapis: "lapis lazuli", greenonyx: "onyx xanh",
  emerald: "ngọc lục bảo",
};

// ---- families that share one text with a different stone
const petal = (s) => `Vẻ thanh lịch vượt thời gian của mặt dây chuyền Petal Oval khiến sản phẩm trở thành điểm nhấn hoàn hảo cho mọi bộ sưu tập trang sức. Được chế tác với viên ${s} hình oval 9x7mm, mặt dây chuyền cổ điển này tôn lên trọn vẹn vẻ đẹp của viên đá mà không làm thiết kế trở nên rườm rà. Sự đơn giản là điều cốt lõi của mẫu mặt dây chuyền này, tạo nên một món trang sức nổi bật một cách thanh lịch và tự nhiên.`;
const infinity = (s, extra = "") => `Mặt dây chuyền Infinity ${s} là điểm nhấn hoàn hảo cho mọi bộ sưu tập trang sức. Được chế tác với viên ${s} 6mm, mặt dây chuyền được đính theo hình số 8 cùng hoàng ngọc trắng. Thiết kế đơn giản nhưng thanh lịch giúp món trang sức phù hợp với mọi dịp${extra}.`;
const mia = (s) => `Bạn đang tìm một chiếc vòng cổ xinh xắn, thanh mảnh để đeo hằng ngày và trong những dịp đặc biệt? Mặt dây chuyền Mia ${s} chính là điều bạn cần! Với viên ${s} đính kiểu bezel, chiếc vòng cổ này hoàn hảo cho những ai yêu phong cách tối giản. Mia cũng rất đẹp khi đeo xếp lớp cùng các vòng cổ khác. Đây là phụ kiện tuyệt vời cho mọi trang phục và là một lựa chọn quà tặng tuyệt vời!`;
const hannah = (s) => `Bạn đang tìm một mặt dây chuyền nổi bật để tỏa sáng trong các dịp trang trọng? Hãy chọn mặt dây chuyền Hannah ${s}. Viên ${s} 6x8mm được bao quanh bởi vòng halo hoàng ngọc trắng và đính trên bạc sterling, mang đến vẻ ngoài vừa chuyên nghiệp vừa thanh lịch.`;
const tulip = (s, tone = "") => `Mặt dây chuyền Tulip Oval của chúng tôi mang đến cả phong cách lẫn tính ứng dụng. Được chế tác từ bạc sterling, mặt dây chuyền ôm trọn viên ${s} oval 2ct${tone} thu hút ánh nhìn ở bất cứ nơi đâu bạn đến. Những chi tiết lấp lánh của thiết kế uốn lượn nghệ thuật cùng chiếc bail cuốn hút bổ sung nét tinh tế cho vẻ đẹp cổ điển. Dành cho những ai tìm kiếm một món trang sức luôn thu hút mọi ánh nhìn mà vẫn toát lên sự thanh lịch, Tulip Oval sẽ không làm bạn thất vọng. Với những chi tiết trang trí tinh tế, món trang sức bắt mắt này phù hợp mọi dịp, là phụ kiện lý tưởng để diện sang trọng hay giản dị. Vì vậy, nếu bạn đang phân vân nên chọn món trang sức nào, hãy tin tưởng Tulip Oval: một thiết kế đẹp mắt với nét quyến rũ riêng.`;
const classico = (s) => `Đơn giản mà thanh lịch, chiếc nhẫn Classico là món trang sức xinh xắn để bổ sung vào bộ sưu tập của bạn. Viên ${s} tròn tự nhiên được đính kiểu bezel tạo nên điểm nhấn tinh tế mà thời thượng. Thoải mái và linh hoạt để đeo mỗi ngày.`;

const DESC = {
  // Petal Oval pendants
  "AS-285-P-SS-O-AMETHYST": petal(S.amethyst), "AS-288-P-SS-O-PINKTOPAZ": petal(S.pinktopaz), "AS-289-P-SS-O-ROSEQUARTZ": petal(S.rosequartz),
  "AS-287-P-SS-O-BLUETOPAZ": petal(S.bluetopaz), "AS-134-P-SS-O-MOONSTONE": petal(S.moonstone),
  // Infinity pendants
  "AS-283-P-SS-R-AQUAMARINE": infinity(S.aquamarine), "AS-141-P-SS-R-MOONSTONE": infinity(S.moonstone, " và mang thêm chút may mắn cho người đeo"),
  "AS-142-P-SS-R-PINKTOPAZ": infinity(S.pinktopaz), "AS-138-P-SS-R-AMETHYST": infinity(S.amethyst), "AS-139-P-SS-R-BLACKSAPPHIRE": infinity(S.blacksapphire),
  "AS-143-P-SS-R-CITRINE": infinity(S.citrine), "AS-159-P-SS-R-BLUETOPAZ": infinity(S.bluetopaz), "AS-140-P-SS-R-GARNET": infinity(S.garnet), "AS-276-P-SS-R-PERIDOT": infinity(S.peridot),
  // Mia pendants
  "AS-284-P-SS-R-AQUAMARINE": mia(S.aquamarine), "AS-162-P-SS-R-AMETHYST": mia(S.amethyst), "AS-163-P-SS-R-BLACKSAPPHIRE": mia(S.blacksapphire),
  "AS-169-P-SS-R-CITRINE": mia(S.citrine), "AS-167-P-SS-R-PERIDOT": mia(S.peridot), "AS-161-P-SS-R-BLUETOPAZ": mia(S.bluetopaz),
  // Hannah pendants
  "AS-157-P-SS-P-LAPISLAZULI": hannah(S.lapis), "AS-156-P-SS-P-GREENONYX": hannah(S.greenonyx), "AS-149-P-SS-P-BLUETOPAZ": hannah(S.swissbluetopaz),
  "AS-151-P-SS-P-MOONSTONE": hannah(S.moonstone), "AS-154-P-SS-P-PERIDOT": hannah(S.peridot), "AS-148-P-SS-P-AMETHYST": hannah(S.amethyst),
  "AS-150-P-SS-P-GARNET": hannah(S.garnet), "AS-155-P-SS-P-PINKTOPAZ": hannah(S.pinktopaz),
  // Tulip Oval pendants
  "AS-133-P-SS-O-MOONSTONE": tulip(S.moonstone, " thanh bình,"), "AS-144-P-SS-O-AMETHYST": tulip(S.amethyst, " thanh bình,"), "AS-147-P-SS-O-GARNET": tulip(S.garnet, " thanh bình,"),
  // Classico rings
  "AS-165-R-SS-R-EMERALD": classico(S.emerald), "AS-166-R-SS-R-GARNET": classico(S.garnet),

  // engagement rings
  "AS-324-EN-YG-OVAL-ALYSSA": "Nhẫn Alyssa là mẫu nhẫn 4 chấu với viên oval nâng cao, đi cùng phần thân nhẫn nổi bật được tạo kiểu bằng những viên marquise và viên tròn. Chiếc nhẫn có sức hút khiến mọi ánh nhìn phải ngoái theo nhờ thiết kế thân nhẫn tinh xảo.",
  "AS-329-EN-YG-R-ZOE": "Chiếc nhẫn Toi et Moi với viên Oval và viên Giọt Lệ (Pear) tuyệt đẹp của chúng tôi có tỷ lệ hoàn hảo, mang lại cảm giác rất khác biệt cho một chiếc nhẫn đính hôn. Hai viên đá dáng thon dài tạo nên chiếc nhẫn đính hôn \"bạn và tôi\" hoàn hảo.",
  "AS-338-EN-YG-O-AUDREY": "Chiếc nhẫn thân mảnh 2mm với viên đá trung tâm hình oval. Để tăng thêm độ lấp lánh, một vòng halo ẩn được đính khéo léo vào chiếc nhẫn.",
  "AS-346-EN-YG-O-LAVA": "Lava là chiếc nhẫn đính hôn solitaire hình oval vượt thời gian, nổi bật với kiểu đính cathedral cùng bốn chấu thanh mảnh, thân nhẫn chắc chắn và vòng halo ẩn.",
  "AS-331-EN-YG-E-ORLA": "Nhẫn Đính Hôn Orla", "AS-332-EN-YG-E-ARETI": "Nhẫn Vàng Areti", "AS-333-EN-YG-E-ALLIE": "Nhẫn Đính Hôn Ellie",
  "AS-335-EN-YG-P-ZARA": "Nhẫn Vàng Hình Giọt Lệ Zara", "AS-336-EN-YG-P-DANA": "Nhẫn Vàng Hình Giọt Lệ Dana", "AS-337-EN-YG-P-ZITA": "Nhẫn Halo Hình Giọt Lệ Zita",
  "AS-339-EN-YG-O-EVIE": "Chiếc nhẫn kiểu cigar chắc chắn với viên oval đính bezel ở trung tâm.",
  "AS-344-EN-YG-O-DELA": "Della thể hiện sự thanh lịch và tinh tế vượt thời gian. Với thiết kế vừa đơn giản vừa nổi bật, nhẫn chắc chắn sẽ thu hút mọi ánh nhìn và để lại ấn tượng khó quên.",
  "AS-347-EN-YG-O-EMILY": "Giới thiệu Emily, chiếc nhẫn solitaire oval tuyệt đẹp được bao quanh bởi những viên đá tấm, toát lên vẻ sang trọng và thanh lịch vượt thời gian.",
  "AS-393-EN-YG-MIAH": "Giới thiệu Miah, chiếc nhẫn đính hôn hình giọt lệ (pear) tuyệt đẹp, thể hiện trọn vẹn nét thanh lịch và lãng mạn. Ở trung tâm là viên đá cắt hình giọt lệ nổi bật, tỏa sáng rực rỡ và cuốn hút. Hai bên viên chủ là hai viên đá phụ hình giọt lệ tinh xảo, được đính theo kiểu cathedral đẹp mắt, nâng tầm toàn bộ chiếc nhẫn. Thân nhẫn thanh lịch được đính pavé 2/3, thêm một lớp lấp lánh cho tác phẩm quyến rũ này. Hoàn hảo cho những ai muốn tạo nét độc đáo trên nền truyền thống, Miah là biểu tượng lý tưởng của tình yêu và sự cam kết. Hãy đón nhận vẻ đẹp của chiếc nhẫn đính hôn hình giọt lệ và để Miah tỏa sáng như minh chứng cho hành trình khó quên của đôi bạn.",
  "AS-395-EN-YG-ALEEVA": "Viên đá trung tâm giác cắt Emerald cùng phần thân nhẫn đơn giản. Dành cho những ai yêu thích sự giản dị và thanh lịch.",
  "AS-409-EN-YG-E-BEAU": "Nhẫn Đính Hôn Beau",
  "AS-322-EN-YG-OVAL-ALEXIA": "Nhẫn đính hôn Alexia của chúng tôi có thiết kế ba viên đơn giản nhưng tinh tế, gồm viên trung tâm cắt oval và hai viên phụ giọt lệ (pear) 3x2mm, tất cả được đính theo kiểu cathedral đẹp mắt với thân nhẫn mảnh 2mm.",
  "AS-342-EN-YG-O-TERRI": "Terri là chiếc nhẫn đính hôn solitaire oval tuyệt đẹp. Với viên đá cắt oval cuốn hút, viên trung tâm được giữ thanh lịch trong kiểu đính bốn chấu. Thiết kế tinh tế này được nâng tầm hơn nữa nhờ thân nhẫn đính pavé một nửa.",
  "AS-330-EN-YG-R-TRAY": "Chiếc nhẫn đính hôn ba viên thanh lịch với viên trung tâm oval, mỗi bên là những viên giọt lệ nhỏ. Thân nhẫn được thiết kế đính pavé để tăng thêm độ lấp lánh. Chế tác từ vàng 18K.",
  "AS-334-EN-YG-P-TARA": "Nhẫn Vàng Tara",
  "AS-343-EN-YG-O-LISA": "Lisa toát lên vẻ tinh tế và duyên dáng, với viên oval trung tâm nổi bật là tâm điểm của thiết kế tuyệt đẹp này. Chiếc nhẫn được chế tác tỉ mỉ theo tiêu chuẩn cao, đảm bảo độ bền và chất lượng đáng kinh ngạc. Thân nhẫn độc đáo có sự sắp xếp tuyệt đẹp của những viên đá tròn phụ giúp nâng tầm tổng thể, trong khi vòng halo ẩn tinh tế thêm nét bí ẩn và rực rỡ. Tay nghề điêu luyện này không chỉ tôn vinh vẻ đẹp của món trang sức mà còn thể hiện cam kết hướng đến sự hoàn hảo trong từng chi tiết.",
  "AS-345-EN-YG-O-CLAIRE": "Nhẫn đính hôn Claire thể hiện thiết kế solitaire oval tuyệt đẹp kết hợp với phần thân nhẫn được chế tác tinh xảo. Viên đá cắt oval nổi bật thu hút ánh nhìn, trong khi thân nhẫn đặc trưng toát lên vẻ tinh tế và duyên dáng, hoàn thiện với kiểu đính cathedral tuyệt đẹp.",
  "AS-348-EN-YG-O-TYA": "Tya là chiếc nhẫn đính hôn thực sự độc đáo, hoàn hảo cho những ai yêu thích sự giản dị nhưng vẫn muốn thêm chút lấp lánh. Nổi bật với viên đá cắt oval tuyệt đẹp, điểm nhấn của chiếc nhẫn nằm ở kiểu đính 4 chấu đầu đôi. Hoàn thiện với vòng halo ẩn và thân nhẫn gọn gàng, đây là một thiết kế vô cùng ấn tượng.",
  "AS-396-EN-YG-GWYNETH": "Hãy gặp chiếc nhẫn Gwyneth đầy mê hoặc, nơi phép màu gặp gỡ sự thanh lịch. Ở trung tâm là viên đá giác cắt Emerald nổi bật, được ôm giữ chắc chắn bởi kiểu đính bốn chấu tinh tế. Tăng thêm sức hút, một vòng halo ẩn lấp lánh bên dưới viên đá, trong khi thân nhẫn đính pavé hoàn thiện vẻ ngoài với chút lấp lánh. Gwyneth thực sự là một tác phẩm nổi bật, thể hiện tinh túy của vẻ đẹp vượt thời gian.",

  // silver rings
  "AS-309-R-SS-T-AMETHYST": "Giới thiệu chiếc nhẫn bạc Trilliant Amethyst tuyệt đẹp của chúng tôi, được chế tác tinh xảo với phần thân nhẫn đính hoàng ngọc trắng lấp lánh. Giác cắt trilliant của viên Amethyst tạo nên hiệu ứng ánh sáng cuốn hút, được tôn lên hoàn hảo bởi độ rực rỡ của hoàng ngọc trắng. Amethyst không chỉ được yêu thích bởi vẻ đẹp tuyệt vời mà còn được cho là mang đến sự chân thành và tài lộc cho người đeo. Chiếc nhẫn thanh lịch này là sự bổ sung đẹp mắt cho mọi bộ sưu tập trang sức và là món quà chu đáo, ý nghĩa dành cho người đặc biệt.",
  "AS-311-R-SS-T-CITRINE": "Giới thiệu chiếc nhẫn bạc Citrine cuốn hút của chúng tôi, với phần thân nhẫn đính hoàng ngọc trắng lấp lánh. Citrine nổi tiếng với vẻ đẹp rạng rỡ và những tác động tích cực được tin là mang lại, như hỗ trợ sức khỏe tinh thần, kích thích sự minh mẫn và thúc đẩy sự sáng tạo. Chiếc nhẫn tuyệt đẹp này không chỉ là sự bổ sung đẹp mắt cho mọi bộ sưu tập trang sức mà còn là biểu tượng ý nghĩa, tràn đầy tích cực và sự phát triển bản thân.",
  "AS-318-R-SS-H-PERIDOT": "Với năm viên Peridot hình trái tim 3.5mm rực rỡ, chiếc nhẫn bạc Sterling này sẽ khiến bạn say mê.",
  "AS-312-R-SS-H-GARNET": "Giới thiệu chiếc nhẫn Garnet Double Heart của chúng tôi, biểu tượng của sự gắn kết nồng nàn và tình yêu bền lâu. Được chế tác từ bạc sáng bóng, chiếc nhẫn có hai trái tim đan vào nhau được tô điểm bằng những viên garnet quyến rũ. Sắc đỏ thẫm của garnet tượng trưng cho đam mê rực lửa và sự cam kết sâu sắc của một mối quan hệ bền lâu. Thiết kế thanh lịch cùng ý nghĩa sâu sắc khiến chiếc nhẫn trở thành món quà hoàn hảo để tôn vinh tình yêu và sự trìu mến.",
  "AS-136-R-SS-T-AMETHYST": "Viên đá Amethyst cắt trillion là lựa chọn thay thế tuyệt vời, mang lại cảm giác đặc biệt và hiện đại. Chiếc nhẫn có phong cách thanh mảnh, gọn gàng và được điểm xuyết bằng vòng halo hoàng ngọc trắng.",
  "AS-179-R-SS-C-PERIDOT": "Nhẫn Jolie Peridot",
  "AS-219-R-SS-H-GARNET": "Với năm viên Garnet hình trái tim 3.5mm rực rỡ, chiếc nhẫn bạc Sterling này sẽ khiến bạn say mê.",
  "AS-223-R-SS-H-GARNET": "Chiếc nhẫn dáng chữ V xinh đẹp với viên Garnet hình trái tim 5mm cuốn hút là tâm điểm. Chiếc nhẫn thanh mảnh tôn lên bàn tay với phần thân nhẫn được điểm xuyết hoàng ngọc trắng tự nhiên. Món quà hoàn hảo dành cho người thương, nếu từng có một món quà như thế!",
  "AS-235-R-SS-P-AQUAMARINE": "Nhẫn Star Aquamarine",
  "AS-260-R-SS-O-GARNET": "Chiếc nhẫn lấy cảm hứng từ thiên nhiên dành cho những ai muốn một món trang sức khác biệt nhưng cuốn hút. Phần thân nhẫn họa tiết chiếc lá dẫn đến viên Garnet Oval 8x6mm.",
  "AS-272-R-SS-R-GARNET": "Chiếc nhẫn bạc Sterling 925 với viên Garnet tròn 6mm thanh lịch, kiểu đính nổi bật mang đến phong cách đơn giản nhưng hiện đại vượt thời gian. Toàn bộ trang sức bạc của chúng tôi được mạ rhodium, giúp chiếc nhẫn sáng đẹp lâu hơn.",
  "AS-293-R-SS-R-AMETHYST": "Nhẫn Bella Amethyst – nhẫn bạc với viên Amethyst 4mm.", "AS-294-R-SS-R-CITRINE": "Nhẫn Bella Citrine – nhẫn bạc với viên Citrine 4mm.", "AS-295-R-SS-R-GARNET": "Nhẫn Bella Garnet – nhẫn bạc với viên Garnet 4mm.",
  "AS-310-R-SS-T-GARNET": "Giới thiệu chiếc nhẫn bạc Garnet tinh tế của chúng tôi, mang vẻ thanh lịch vượt thời gian và được đính hoàng ngọc trắng lấp lánh trên thân nhẫn. Sắc đỏ thẫm đậm của Garnet không chỉ bắt mắt mà còn được tin là có tác dụng thanh lọc và tiếp thêm năng lượng đáng kinh ngạc cho tất cả các luân xa trong cơ thể. Điều này khiến chiếc nhẫn bạc Garnet trở thành món trang sức đầy ý nghĩa và mạnh mẽ cho mọi bộ sưu tập, hoàn hảo cho những ai trân trọng cả vẻ đẹp lẫn khả năng cân bằng năng lượng cá nhân.",
  "AS-314-R-SS-O-AMETHYST": "Nhẫn Katie Oval Thạch Anh Tím", "AS-315-R-SS-O-PINKTOPAZ": "Nhẫn Katie Oval Hoàng Ngọc Hồng", "AS-316-R-SS-O-PERIDOT": "Nhẫn Katie Oval Peridot",
  "AS-320-R-SS-B-SAPPHIREB": "Chiếc nhẫn Sapphire xanh tự nhiên đơn giản mà thanh lịch.",
  "AS-234-R-SS-P-WHITETOPAZ": "Nhẫn Star Hoàng Ngọc Trắng – Hoàng ngọc trắng giúp bạn đưa ra quyết định và mang lại sự sáng suốt cho cuộc sống. Chiếc nhẫn hoàng ngọc trắng tự nhiên hình giọt lệ tuyệt đẹp này mang lại cảm giác như kim cương nhưng với mức giá thấp hơn nhiều.",
  "AS-275-R-SS-BLACKSAPPHIRE": "Nhẫn Amelia Sapphire Đen 6mm Hình Tròn",
  "AS-0104-R-SS-E-AMETHYST": "Chiếc nhẫn Cocktail Amethyst này thực sự nổi bật! Nhẫn Cocktail 8x6mm của Aurora Saigon có giác cắt Emerald tuyệt đẹp giúp tôn lên độ trong của viên đá. Hoàn hảo cho những người yêu phong cách art deco với đường nét gọn gàng và ít mặt cắt hơn. Chiếc nhẫn quyến rũ một cách tự nhiên và là bổ sung lý tưởng cho mọi bộ sưu tập trang sức.",
  "AS-0106-R-SS-O-MOONSTONE": "Bạn đang tìm một chiếc nhẫn độc đáo để tôn vinh đá Mặt Trăng Cầu Vồng? Hãy chọn chiếc nhẫn Caravelle Moonstone Oval này. Được chế tác từ viên đá Mặt Trăng Cầu Vồng 9x7mm, chiếc nhẫn thể hiện viên đá theo cách giản dị mà đẹp nhất có thể, với kiểu đính thanh lịch. Hình dáng oval giúp khoe trọn màu sắc và đường vân độc đáo của viên đá, trong khi thiết kế đơn giản giữ cho tâm điểm luôn là viên đá. Dù bạn tìm một món quà đặc biệt cho người yêu đá Mặt Trăng hay muốn thêm chút lấp lánh cho tủ đồ của mình, chiếc nhẫn này chắc chắn sẽ gây ấn tượng.",
  "AS-127-R-SS-T-BLUETOPAZ": "Nếu bạn đang tìm một chiếc nhẫn độc đáo và phong cách, bạn sẽ yêu chiếc nhẫn solitaire hoàng ngọc xanh cắt Trillion 6mm của Aurora Saigon. Giác cắt trillion là một giác cắt tương đối hiện đại, được phát triển vào những năm 1960 và hiếm khi được dùng làm viên solitaire hay viên trung tâm, khiến đây là lựa chọn tuyệt vời nếu bạn muốn điều gì đó khác biệt. Hoàng ngọc xanh cũng là một loại đá quý tuyệt đẹp, sẽ thêm nét thanh lịch cho mọi bộ trang phục.",
  "AS-135-R-SS-T-GARNET": "Sắc đỏ ấm áp của chiếc nhẫn Garnet này thật lãng mạn! Chúng tôi yêu giác cắt góc cạnh của viên đá cắt trillion cùng vòng halo hoàng ngọc trắng đơn giản.",
  "AS-178-R-SS-C-PINKTOPAZ": "Giới thiệu chiếc nhẫn hoàng ngọc hồng cắt cushion tuyệt đẹp của chúng tôi, được tôn lên bởi vòng halo hoàng ngọc trắng thanh lịch. Được chế tác thủ công từ những viên đá chất lượng cao nhất, chiếc nhẫn này là một kiệt tác thực sự. Viên hoàng ngọc hồng rực rỡ được chọn lọc kỹ lưỡng nhờ độ trong và độ lấp lánh đặc biệt, trong khi vòng halo hoàng ngọc trắng lấp lánh thêm nét thanh lịch. Hãy sở hữu chiếc nhẫn hoàng ngọc hồng cắt cushion xinh đẹp này và nâng tầm phong cách của bạn. Dù bạn muốn tự thưởng cho mình hay tạo bất ngờ cho người thân, chiếc nhẫn này đều hoàn hảo. Thiết kế vượt thời gian cùng tay nghề thủ công hoàn hảo khiến đây là phụ kiện bạn sẽ trân trọng mãi mãi. Đặt hàng ngay hôm nay và cảm nhận vẻ đẹp, sự thanh lịch của món trang sức tuyệt vời này.",
  "AS-171-R-SS-C-AQUAMARINE": "Nhẫn Jolie Aquamarine",
  "AS-193-R-SS-H-MOONSTONE": "Hãy sở hữu chiếc nhẫn trái tim đá Mặt Trăng Cầu Vồng đầy mê hoặc này và cảm nhận vẻ đẹp, sự thanh lịch mà nó mang lại cho mọi dịp. Dù tự thưởng cho bản thân hay tạo bất ngờ cho người đặc biệt, chiếc nhẫn này là báu vật sẽ được trân trọng suốt nhiều năm. Đặt hàng ngay hôm nay và để câu chuyện tình yêu, lãng mạn được viết tiếp cùng món trang sức tuyệt đẹp này.",
  "AS-239-R-SS-P-GREENONYX": "Hãy khám phá chiếc nhẫn onyx xanh hình giọt lệ 6x8mm tuyệt đẹp của chúng tôi! Chiếc nhẫn có viên onyx xanh xinh đẹp đính trên thân nhẫn bạc hoặc vàng. Nhưng không chỉ đẹp, onyx xanh còn được tin là mang lại sự bình yên và tĩnh lặng cho người đeo, thúc đẩy sự hài hòa và thuần khiết trong suy nghĩ. Sắc xanh tươi mát của đá cũng tượng trưng cho sự đổi mới và phát triển. Dù tự thưởng cho bản thân hay tìm một món quà ý nghĩa, chiếc nhẫn này là lựa chọn hoàn hảo để thêm nét đẹp tự nhiên và sự tích cực cho diện mạo của bạn!",

  // pendants, bracelets, earrings (unique texts)
  "AS-291-P-SS-H-MOOSTONE": "Nhẫn Eleanor Garnet — phần vai nhẫn nâng cao thanh lịch tạo nên dáng nhẫn thú vị nhưng vẫn giản dị, với viên Garnet tự nhiên hình tròn 6mm đính kiểu bezel.",
  "AS-306-P-SS-RC-AMETHYST": "Giới thiệu mặt dây chuyền Amethyst thô tuyệt đẹp của chúng tôi, được chế tác tinh xảo từ bạc Sterling. Món trang sức thanh lịch này có viên tinh thể amethyst chưa cắt đẹp mắt, được đính trong thiết kế đơn giản nhưng cuốn hút. Vẻ quyến rũ tự nhiên của amethyst thô kết hợp cùng vẻ đẹp vượt thời gian của bạc sterling tạo nên một phụ kiện độc đáo và linh hoạt. Nâng tầm mọi bộ trang phục với nét thanh lịch tinh tế của mặt dây chuyền amethyst thô này, phù hợp cả những dịp thường ngày lẫn trang trọng.",
  "AS-269-B-SS-R-BLACKSAPPHIRE": "Vòng Tay Athena Sapphire Đen", "AS-270-B-SS-R-PINKTOPAZ": "Vòng Tay Athena Hoàng Ngọc Hồng", "AS-271-B-SS-R-CITRINE": "Vòng Tay Athena Thạch Anh Vàng", "AS-268-B-SS-R-MOONSTONE": "Vòng Tay Athena Đá Mặt Trăng",
  "AS-132-P-SS-T-BLUETOPAZ": "Mặt dây chuyền đá quý cắt Trillion tinh xảo này là điểm nhấn tuyệt đẹp, thêm nét độc đáo cho mọi phong cách. Giác cắt Trillion vượt thời gian và thanh lịch, với 78 mặt cắt cho độ rực rỡ tối đa và thiết kế táo bạo, bắt mắt. Sản phẩm được chế tác từ bạc sterling mạ rhodium để đảm bảo độ bền.",
  "AS-280-P-SS-R-BLACKSAPPHIRE": "Mặt Dây Chuyền Gaia Sapphire Đen", "AS-277-P-SS-R-PERIDOT": "Mặt Dây Chuyền Gaia Peridot", "AS-405-P-SS-R-CITRINE": "Mặt Dây Chuyền Gaia Thạch Anh Vàng",
  "AS-278-P-SS-R-GARNET": "Mặt Dây Chuyền Gaia Garnet", "AS-282-P-SS-R-AMETHYST": "Mặt Dây Chuyền Gaia Thạch Anh Tím", "AS-164-P-SS-R-BLUETOPAZ": "Mặt Dây Chuyền Gaia Hoàng Ngọc Xanh",
  "AS-181-P-SS-C-PERIDOT": "Mặt Dây Chuyền Jolie Peridot", "AS-182-P-SS-C-PINKTOPAZ": "Mặt Dây Chuyền Jolie Hoàng Ngọc Hồng", "AS-173-P-SS-C-MOONSTONE": "Mặt Dây Chuyền Jolie Đá Mặt Trăng",
  "AS-184-P-SS-C-AQUAMARINE": "Mặt dây chuyền Jolie Aquamarine. Viên aquamarine cắt cushion 5mm được bao quanh bởi vòng halo moissanite thanh lịch. Mặt dây chuyền được chế tác từ bạc Sterling 925 mạ rhodium. Đi kèm dây chuyền bạc.",
  "AS-307-P-SS-RC-GARNET": "Giới thiệu mặt dây chuyền tinh thể thô Garnet bạc Sterling cuốn hút của chúng tôi, một sự bổ sung đẹp mắt và ý nghĩa cho bộ sưu tập trang sức của bạn. Mặt dây chuyền tuyệt đẹp này có viên tinh thể garnet thô được đính khéo léo trong bạc sterling chất lượng cao. Sắc đỏ đậm, sâu của tinh thể garnet khiến món trang sức trở nên nổi bật và bắt mắt. Garnet được biết đến với những đặc tính mạnh mẽ, được tin là mang đam mê, tình yêu và năng lượng tích cực vào cuộc sống của người đeo. Ngoài ra, đá còn được cho là thúc đẩy sức mạnh, sinh lực và sự cân bằng cảm xúc. Điều này khiến mặt dây chuyền tinh thể thô Garnet không chỉ là một phụ kiện đẹp mà còn là một vật may mắn ý nghĩa để mang theo suốt cả ngày. Hãy đón nhận sức hút cuốn hút và những tác động tích cực tiềm năng của mặt dây chuyền garnet tinh xảo này, món quà hoàn hảo cho chính bạn hoặc người thân yêu. Dù đeo thường ngày hay trong dịp đặc biệt, mặt dây chuyền này chắc chắn sẽ thu hút sự chú ý và nhận được nhiều lời ngợi khen.",
  "AS-308-P-SS-RC-ROSEQUARTZ": "Giới thiệu mặt dây chuyền bạc thạch anh hồng tuyệt đẹp của chúng tôi, hoàn hảo cho bạn! Mặt dây chuyền xinh đẹp này có viên đá thạch anh hồng rạng rỡ được đính trong khung bạc tinh tế, tạo nên món trang sức thanh lịch và vượt thời gian. Thạch anh hồng được biết đến là viên đá của tình yêu và lòng trắc ẩn, rất phù hợp để đeo hằng ngày. Đá được tin là tỏa ra nguồn năng lượng nhẹ nhàng, dịu êm, thúc đẩy sự chữa lành cảm xúc, tình yêu bản thân và sự hài hòa. Đeo thạch anh hồng gần luân xa tim có thể giúp bạn thu hút năng lượng tích cực và nuôi dưỡng sự bình yên nội tâm. Bên cạnh những lợi ích tinh thần, thạch anh hồng còn được yêu thích bởi sắc hồng tuyệt đẹp và vẻ đẹp tự nhiên. Dù bạn muốn đón nhận những đặc tính huyền học của thạch anh hồng hay tô điểm bản thân bằng một viên đá cuốn hút, mặt dây chuyền bạc thạch anh hồng của chúng tôi là phụ kiện ý nghĩa và phong cách cho mọi dịp.",
  "AS-290-P-SS-H-MOOSTONE": "Không gì quyến rũ bằng một món bùa may mắn kiểu cổ điển, và mặt dây chuyền đá Mặt Trăng này cũng không ngoại lệ! Mặt dây chuyền Lucky Clover Leaf Moonstone gồm bốn viên đá Mặt Trăng hình trái tim tuyệt đẹp. Dù bạn đang tìm một món quà độc đáo cho người thân hay muốn thêm chút mê hoặc cho tủ đồ của mình, mặt dây chuyền đá Mặt Trăng này là lựa chọn hoàn hảo.",
  "AS-160-P-SS-H-PERIDOT": "Không gì quyến rũ bằng một món bùa may mắn kiểu cổ điển, và mặt dây chuyền peridot này cũng không ngoại lệ! Mặt dây chuyền Lucky Clover Leaf Peridot gồm bốn viên peridot hình trái tim tuyệt đẹp, trong đó peridot thường được gắn với sự thịnh vượng và may mắn. Món trang sức này không chỉ đẹp mắt mà còn được tin là xua đuổi điều xấu và mang lại may mắn cho người đeo. Dù bạn đang tìm một món quà độc đáo cho người thân hay muốn thêm chút mê hoặc cho tủ đồ của mình, mặt dây chuyền peridot này là lựa chọn hoàn hảo.",
  "AS-303-P-SS-O-AMETHYST": "Mặt Dây Chuyền Snowflake Thạch Anh Tím", "AS-304-P-SS-O-CITRINE": "Mặt Dây Chuyền Snowflake Thạch Anh Vàng",
  "AS-305-P-SS-O-GARNET": "Mặt dây chuyền Snowflake Garnet — giới thiệu mặt dây chuyền Garnet Oval tự nhiên tuyệt đẹp của chúng tôi, được chế tác thủ công tinh xảo. Làm từ bạc Sterling mạ rhodium thanh lịch, viên garnet oval tự nhiên ở trung tâm mang sắc đỏ đậm, sâu, khiến đây là phụ kiện hoàn hảo cho mọi dịp. Viên Garnet được bao quanh bởi những viên Moissanite tuyệt đẹp, nâng tầm mặt dây chuyền này thành một tuyên ngôn thực sự của sự thanh lịch và duyên dáng.",
  "AS-145-P-SS-O-PINKTOPAZ": "Mặt Dây Chuyền Tulip Oval Hoàng Ngọc Hồng",
  "AS-048-ESSH-OPAL": "Dù bạn đang tìm một món quà độc đáo cho người thân hay muốn tự thưởng cho bản thân, Bông Tai Heart Halo của Aurora Saigon chắc chắn sẽ làm bạn hài lòng.",
  "AS-266-E-SS-H-GARNET": "Bông Tai Heart Halo của Aurora Saigon chắc chắn sẽ làm bạn hài lòng. Garnet được biết đến là biểu tượng của tình yêu, trái tim, máu, ngọn lửa bên trong và sức sống.",
  "AS-174-E-SS-C-MOONSTONE": "Bông Tai Jolie Đá Mặt Trăng", "AS-175-E-SS-C-AQUAMARINE": "Bông Tai Jolie Aquamarine", "AS-177-E-SS-C-PINKTOPAZ": "Bông Tai Jolie Hoàng Ngọc Hồng",
  "AS-180-E-SS-C-OPAL": "Bông Tai Jolie Opal", "AS-185-E-SS-R-MOONSTONE": "Bông Tai Natalie Đá Mặt Trăng", "AS-176-E-SS-C-PERIDOT": "Bông Tai Jolie Peridot",

  // wedding rings
  "AS-367-WR-YG-GIANNA": "Nhẫn cưới vàng Gianna đính kim cương",
  "AS-368-WR-YG-CHLOE": "Được chế tác từ vàng vàng, chiếc nhẫn cưới nữ tinh tế này có một hàng kim cương tròn brilliant được đính cách đều tinh xảo, nằm phẳng trên thân nhẫn cho vẻ ngoài gọn gàng và hiện đại. Thiết kế tối giản kết hợp ánh lấp lánh tinh tế với bề mặt bóng mịn, tạo nên món trang sức thanh lịch để đeo hằng ngày, kết hợp đẹp mắt với nhẫn đính hôn hoặc có thể đeo riêng như một chiếc nhẫn xếp chồng hay nhẫn cưới vượt thời gian.",
  "AS-369-WR-YG-NETTA": "Nhẫn cưới vàng Netta", "AS-370-WR-YG-AVERY": "Nhẫn cưới vàng Avery", "AS-371-WR-YG-LAYLA": "Nhẫn cưới vàng Layla",
  "AS-372-WR-YG-ELIE": "Nhẫn cưới Elie có hàng đá xếp nửa vòng tròn, xen kẽ giữa đá cắt tròn và đá cắt Emerald đính ngang (east–west), được cố định chắc chắn trong viền bezel milgrain tinh xảo.",
  "AS-373-WR-YG-ELIE": "Được chế tác từ vàng vàng, chiếc nhẫn kim cương nữ thanh lịch này có một hàng kim cương tròn brilliant tinh tế được đính trên nửa trên của nhẫn, mang vẻ ngoài tinh giản và vượt thời gian. Với dáng nhẫn mảnh bóng mịn cùng ánh lấp lánh tinh tế, nhẫn kết hợp đẹp mắt với nhẫn đính hôn hoặc có thể đeo riêng như một chiếc nhẫn cưới tối giản, mang vẻ thanh lịch cho mỗi ngày.",
  "AS-374-WR-YG-PENELOPE": "Nhẫn cưới vàng Penelope bản rộng 2mm", "AS-375-WR-YG-ARIA": "Nhẫn cưới vàng Aria", "AS-376-WR-YG-MADISON": "Nhẫn cưới vàng Madison",
  "AS-378-WR-YG-MILA": "Nhẫn cưới vàng Mila", "AS-379-WR-YG-ABIGALE": "Nhẫn cưới vàng Abigale", "AS-380-WR-YG-ELIANE": "Nhẫn cưới vàng Eliana",
  "AS-381-WR-YG-ELIA": "Nhẫn cưới vàng Elia bản rộng 2.8mm", "AS-382-WR-YG-NORA": "Nhẫn cưới vàng Nora", "AS-383-WR-YG-ELIZABETH": "Nhẫn cưới vàng Elizabeth",
  "AS-465-WR-YG-R-ADRIAN": "Một chiếc nhẫn mảnh với chút lấp lánh vừa đủ. Chiếc nhẫn cưới nữ thanh lịch này có một hàng đá marquise và đá tròn duyên dáng, uốn nhẹ trên ngón tay như một làn sóng ánh sáng mềm mại. Được đính trên thân nhẫn mảnh, bóng mịn, nhẫn được thiết kế để mang lại cảm giác nhẹ nhàng, nữ tính và vượt thời gian. Hoàn hảo khi đeo riêng để có ánh lấp lánh tinh tế, hoặc kết hợp đẹp mắt với nhẫn đính hôn cho thêm phần rạng rỡ.",
  "AS-466-WR-YG-R-AUDRAY": "Kim cương nuôi cấy giác cắt Emerald 3x2mm – Tổng trọng lượng 1.07ct",
  "AS-469-WR-YG-R-CHARLOTT": "Một hàng kim cương hình giọt lệ duyên dáng tạo nên đường nét như chiếc vương miện rạng rỡ trên chiếc nhẫn cưới thanh lịch này. Chi tiết pavé tinh tế dọc thân nhẫn làm tăng độ rực rỡ, tạo nên ánh lấp lánh vượt thời gian với nét hiện đại. Được thiết kế để nằm đẹp bên cạnh nhẫn đính hôn hoặc tỏa sáng một cách tự nhiên khi đeo riêng, đây là biểu tượng tinh tế của tình yêu bền lâu — có sẵn theo lựa chọn kim loại quý của bạn.",
  "AS-471-WR-YG-R-MILLIE": "Được thiết kế với đường viền chữ V duyên dáng, chiếc nhẫn có một hàng kim cương tròn cắt brilliant thu nhỏ dần về phía trung tâm, tạo nên vòng cung lấp lánh mềm mại mà nổi bật. Thiết kế để ôm khít hoàn hảo với nhẫn đính hôn solitaire tròn và halo.",
  "AS-354-WR-YS-CARTER": "Giới thiệu chiếc nhẫn cưới nam tuyệt đẹp của chúng tôi, được chế tác với bề mặt xước mờ mang vẻ ngoài gọn gàng và hiện đại. Chiếc nhẫn tinh tế này có rãnh giữa khắc thanh lịch, thêm nét khác biệt và dấu ấn cho thiết kế. Lý tưởng cho chú rể hiện đại, nhẫn cưới này kết hợp phong cách và độ bền, tượng trưng cho cam kết và tình yêu được chia sẻ trong ngày trọng đại của bạn. Hãy làm nên lời thề của bạn với chiếc nhẫn cân bằng hoàn hảo giữa sự thanh lịch cổ điển và nét phong cách đương đại.",
  "AS-355-WR-YS-ESTHER": "Mỗi chiếc nhẫn cưới Aurora Saigon tượng trưng cho sự gắn kết bền lâu của tình yêu và cam kết. Những chiếc nhẫn này được chế tác cẩn thận để trường tồn cùng thời gian. Bạn có thể đeo một chiếc làm nhẫn cưới hoặc xếp chồng hai chiếc để có diện mạo phong cách, hiện đại.",
  "AS-356-WR-YS-FREYA": "Giới thiệu nhẫn cưới phẳng họa tiết đường kẻ bất đối xứng bằng vàng vàng tuyệt đẹp của chúng tôi, sự hòa quyện hoàn hảo giữa thanh lịch và thiết kế đương đại. Với bản rộng 6mm, chiếc nhẫn có họa tiết đường kẻ bất đối xứng độc đáo, thêm nét tinh tế hiện đại cho mọi bộ nhẫn cưới. Được chế tác từ vàng chất lượng cao và hoàn thiện bề mặt mờ.",
  "AS-356-WR-YS-JORDAN": "Giới thiệu chiếc nhẫn cưới kết cấu dập nổi độc đáo của chúng tôi, minh chứng cho nghệ thuật chế tác hiện đại. Với bản rộng 5mm, chiếc nhẫn có kết cấu nổi bật bắt sáng tuyệt đẹp, tạo hiệu ứng thị giác cuốn hút. Thiết kế tinh xảo thêm chiều sâu và cá tính, khiến chiếc nhẫn nổi bật trong mọi bộ sưu tập nhẫn cưới. Được chế tác từ chất liệu cao cấp, chiếc nhẫn thể hiện sự thanh lịch và hứa hẹn độ bền cho cả đời sử dụng. Hoàn hảo cho các cặp đôi muốn thể hiện cá tính riêng trong khi vẫn đón nhận phong cách vượt thời gian.",
  "AS-357-WR-YS-NOLAN": "Nhẫn cưới vàng Nolan bản 4mm", "AS-358-WR-YS-ZOEY": "Nhẫn cưới vàng Zoey bản rộng 5mm",
  "AS-470-WR-YG-R-ANTHONY": "Một phiên bản đương đại của kiểu nhẫn cổ điển vượt thời gian, chiếc nhẫn cưới nam này có đường xoắn 180 độ tinh tế, thêm chuyển động và cá tính cho dáng nhẫn gọn gàng. Được chế tác với bản rộng 5mm tinh tế, nhẫn cân bằng giữa thiết kế hiện đại và sự thoải mái hằng ngày, hoàn hảo cho những ai muốn một chiếc nhẫn nổi bật mà không phô trương.",
  "AS-472-WR-YG-R-WILLIAM": "Một chiếc nhẫn hiện đại, tinh tế với bề mặt satin mềm và cạnh bóng. Thiết kế gọn gàng cùng form ôm thoải mái giúp nhẫn hoàn hảo để đeo hằng ngày hoặc làm nhẫn cưới vượt thời gian.",
};

// ---- Vietnamese names for the wedding rings (the live site shows only English titles for them)
const NAMES = {
  "AS-368-WR-YG-CHLOE": "Nhẫn Cưới Chloe Đính Kim Cương", "AS-369-WR-YG-NETTA": "Nhẫn Cưới Netta", "AS-370-WR-YG-AVERY": "Nhẫn Cưới Avery", "AS-371-WR-YG-LAYLA": "Nhẫn Cưới Layla",
  "AS-372-WR-YG-ELIE": "Nhẫn Cưới Elie", "AS-373-WR-YG-ELIE": "Nhẫn Cưới Elie", "AS-374-WR-YG-PENELOPE": "Nhẫn Cưới Penelope", "AS-375-WR-YG-ARIA": "Nhẫn Cưới Aria",
  "AS-376-WR-YG-MADISON": "Nhẫn Cưới Madison", "AS-378-WR-YG-MILA": "Nhẫn Cưới Mila", "AS-379-WR-YG-ABIGALE": "Nhẫn Cưới Abigale", "AS-380-WR-YG-ELIANE": "Nhẫn Cưới Eliana",
  "AS-381-WR-YG-ELIA": "Nhẫn Cưới Elia", "AS-382-WR-YG-NORA": "Nhẫn Cưới Nora", "AS-383-WR-YG-ELIZABETH": "Nhẫn Cưới Elizabeth", "AS-465-WR-YG-R-ADRIAN": "Nhẫn Cưới Adrian",
  "AS-466-WR-YG-R-AUDRAY": "Nhẫn Cưới Audray", "AS-467-WR-YG-R-CLARA": "Nhẫn Cưới Clara", "AS-468-WR-YG-R-BAILEY": "Nhẫn Cưới Bailey", "AS-469-WR-YG-R-CHARLOTT": "Nhẫn Cưới Charlott",
  "AS-471-WR-YG-R-MILLIE": "Nhẫn Cưới Millie", "AS-354-WR-YS-CARTER": "Nhẫn Cưới Vàng Carter Bản Rộng 4.5mm", "AS-355-WR-YS-ESTHER": "Nhẫn Cưới Esther Bản Rộng 4mm",
  "AS-356-WR-YS-FREYA": "Nhẫn Cưới Freya Bản Rộng 6mm", "AS-356-WR-YS-JORDAN": "Nhẫn Cưới Jordan Bản Rộng 5mm", "AS-357-WR-YS-NOLAN": "Nhẫn Cưới Nolan Bản 4mm",
  "AS-358-WR-YS-ZOEY": "Nhẫn Cưới Zoey Bản Rộng 5mm", "AS-470-WR-YG-R-ANTHONY": "Nhẫn Cưới Anthony 5mm", "AS-472-WR-YG-R-WILLIAM": "Nhẫn Cưới William 5mm",
};

(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await db.from("products").select("id,name,name_vi,description,description_vi").limit(1000);
  if (error) { console.error(error.message); process.exit(1); }
  const needsText = (r) => !r.description_vi || !VI.test(r.description_vi) || r.description_vi === r.description;
  const unknown = Object.keys(DESC).filter((id) => !data.some((r) => r.id === id));
  if (unknown.length) console.log("ids in this script but not in the database:", unknown);

  const done = { descriptions: [], names: [] };
  for (const r of data) {
    const patch = {};
    if (DESC[r.id] && needsText(r)) patch.description_vi = DESC[r.id];
    if (NAMES[r.id] && !r.name_vi) patch.name_vi = NAMES[r.id];
    if (!Object.keys(patch).length) continue;
    if (!DRY) {
      const up = await db.from("products").update(patch).eq("id", r.id).select("id");
      if (up.error || !up.data?.length) { console.log("FAILED", r.id, up.error?.message ?? "no row"); continue; }
    }
    if (patch.description_vi) done.descriptions.push(r.id);
    if (patch.name_vi) done.names.push(r.id);
  }
  if (!DRY) {
    const file = path.join(__dirname, "..", "translated-vi.json");
    let prev = { descriptions: [], names: [] };
    try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* first run */ }
    const merge = (x, y) => [...new Set([...(x ?? []), ...y])].sort();
    fs.writeFileSync(file, JSON.stringify({ note: "Vietnamese text written by scripts/backfill-vietnamese.js (translations of the English copy, not scraped).", descriptions: merge(prev.descriptions, done.descriptions), names: merge(prev.names, done.names) }, null, 2));
  }
  console.log(`${DRY ? "Would write" : "Wrote"} ${done.descriptions.length} descriptions and ${done.names.length} names.`);

  const after = DRY ? data : (await db.from("products").select("id,name_vi,description,description_vi").limit(1000)).data;
  const noName = after.filter((r) => !r.name_vi).length;
  const noDesc = after.filter((r) => !r.description_vi || !VI.test(r.description_vi)).map((r) => r.id);
  console.log(`Still without a Vietnamese name: ${noName}. Without Vietnamese description text: ${noDesc.length}`, noDesc.length ? noDesc.slice(0, 8) : "");
})();
