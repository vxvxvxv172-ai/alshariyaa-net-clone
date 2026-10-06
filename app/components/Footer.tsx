import Image from "next/image";
import { FaWhatsapp, FaMobileAlt, FaEnvelope } from "react-icons/fa";
import { getCompany } from "../lib/getCompany";

function ensureAbsolute(url: string) {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function footerImageUrl(src: string) {
  if (!src) return "";
  if (!src.startsWith("https://res.cloudinary.com/")) return src;
  return src.replace("/image/upload/", "/image/upload/e_trim/");
}

function toInlineUrl(url: string) {
  if (!url) return url;
  const rawUrl = url.replace("/image/upload/", "/raw/upload/").replace(/\/fl_attachment:[^/]+\//, "/");
  return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=false`;
}

export default async function Footer() {
  const c = await getCompany();

  const footerItems: { number?: string; image: string; linkType: string; link: string; file: string }[] =
    (c.footerItems || []).filter((item: { image: string }) => item.image);

  const img1: string = c.img1 || "";
  const useFile1 = c.link1Type === "file" || (!!(c.file1 || "").trim() && !(c.link1 || "").trim());
  const link1: string = useFile1 ? toInlineUrl(c.file1 || "") : ensureAbsolute(c.link1 || "");

  const img2: string = c.img2 || "";
  const useFile2 = c.link2Type === "file" || (!!(c.file2 || "").trim() && !(c.link2 || "").trim());
  const link2: string = useFile2 ? toInlineUrl(c.file2 || "") : ensureAbsolute(c.link2 || "");

  function getHref(item: { linkType: string; link: string; file: string }) {
    const asFile = item.linkType === "file" || (!!(item.file || "").trim() && !(item.link || "").trim());
    return asFile ? toInlineUrl(item.file) : ensureAbsolute(item.link);
  }

  const paymentImages = [
    ...(c.qrImage ? [{ src: c.qrImage, href: ensureAbsolute(c.qrLink || ""), number: "" }] : []),
    ...(img1 ? [{ src: img1, href: link1, number: c.number1 || "" }] : []),
    ...(img2 ? [{ src: img2, href: link2, number: c.number2 || "" }] : []),
    ...footerItems.map((item) => ({ src: item.image, href: getHref(item), number: item.number || "" })),
  ];

  return (
    <footer dir="rtl" className="mt-16 border-t border-gray-200" style={{ background: "#F3F4F6" }}>

      <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Image src="/logo.webp" alt="logo" width={72} height={72} className="object-contain" />
            <p className="text-sm leading-7 text-gray-600 whitespace-pre-line">
              {c.details || "الشريحة الموثوقة - شرائح اتصال وإنترنت بأسعار منافسة، مع خدمة سريعة وآمنة ودعم عملاء مميز. ثقتكم غايتنا وخدمتكم أولويتنا"}
            </p>
          </div>

          {/* Contact details */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-black">تواصل معنا</h3>

            <ul className="flex flex-col gap-3">
              {c.whatsapp && (
                <li>
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 shrink-0">
                      <FaWhatsapp size={14} className="text-black" />
                    </span>
                    <span dir="ltr">{c.whatsapp}</span>
                  </a>
                </li>
              )}
              {c.phone && (
                <li>
                  <a href={`tel:${c.phone}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 shrink-0">
                      <FaMobileAlt size={14} className="text-black" />
                    </span>
                    <span dir="ltr">{c.phone}</span>
                  </a>
                </li>
              )}
              {c.email && (
                <li>
                  <a href={`mailto:${c.email}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 shrink-0">
                      <FaEnvelope size={14} className="text-black" />
                    </span>
                    <span dir="ltr">{c.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Payment / Certification Images */}
        {paymentImages.length > 0 && (
          <div className="mt-5 mb-6 flex flex-wrap items-start justify-center gap-x-5 gap-y-4 sm:justify-end">
            {paymentImages.map(({ src, href, number }, i) => (
              <div key={i} className="flex w-[65px] shrink-0 flex-col items-center gap-1.5 text-center">
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="shrink-0">
                    <Image src={footerImageUrl(src)} alt={`وسيلة توثيق ${i + 1}`} width={65} height={40} className="object-contain" style={{ width: 65, height: 40 }} />
                  </a>
                ) : (
                  <Image src={footerImageUrl(src)} alt={`وسيلة توثيق ${i + 1}`} width={65} height={40} className="object-contain shrink-0" style={{ width: 65, height: 40 }} />
                )}
                {number && (
                  <span dir="ltr" className="block w-full break-all text-[10px] leading-4 font-medium tabular-nums text-gray-500">
                    {number}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-gray-200 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              صنع بإتقان على <span className="font-semibold text-gray-500">| 2026 منصة سلة</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/mada.svg" alt="mada" width={36} height={24} className="object-contain" style={{ height: "24px", width: "36px" }} />
            <Image src="/visa.webp" alt="visa" width={36} height={24} className="object-contain" style={{ height: "24px", width: "36px" }} />
            <Image src="/Apple-Pay-01.png" alt="apple pay" width={56} height={36} className="object-contain" style={{ height: "36px", width: "auto" }} />
            <Image src="/work.webp" alt="salla" width={36} height={24} className="object-contain" style={{ height: "24px", width: "auto" }} />
            <Image src="/commerce.webp" alt="salla" width={36} height={24} className="object-contain" style={{ height: "24px", width: "auto" }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
