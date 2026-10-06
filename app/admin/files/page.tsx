"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FiUpload, FiLink, FiExternalLink } from "react-icons/fi";

type FooterItem = { number: string; image: string; linkType: string; link: string; file: string };
type Data = { number1: string; number2: string; qrImage: string; qrLink: string; img1: string; link1: string; linkType1: string; file1: string; img2: string; link2: string; linkType2: string; file2: string; footerItems: FooterItem[] };

export default function FilesPage() {
  const [data, setData] = useState<Data>({ number1: "", number2: "", qrImage: "", qrLink: "", img1: "", link1: "", linkType1: "link", file1: "", img2: "", link2: "", linkType2: "link", file2: "", footerItems: [] });
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, string>>({});

  function showMsg(section: string, text: string) {
    setMsgs((p) => ({ ...p, [section]: text }));
    setTimeout(() => setMsgs((p) => ({ ...p, [section]: "" })), 3000);
  }
  const [uploading, setUploading] = useState<string | null>(null);

  function openFile(url: string) {
    const rawUrl = url.replace("/image/upload/", "/raw/upload/").replace(/\/fl_attachment:[^/]+\//, "/");
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=false`;
    window.open(viewerUrl, "_blank", "noopener,noreferrer");
  }
  const [imgKeys, setImgKeys] = useState<Record<string, number>>({});
  const qrRef = useRef<HTMLInputElement>(null);
  const img1Ref = useRef<HTMLInputElement>(null);
  const img2Ref = useRef<HTMLInputElement>(null);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const imgRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function bumpKey(k: string) { setImgKeys((p) => ({ ...p, [k]: Date.now() })); }

  useEffect(() => {
    fetch(`/api/admin/company`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const normalize = (item: Partial<FooterItem>): FooterItem => ({ number: item.number || "", image: item.image || "", linkType: item.linkType || (item.file ? "file" : "link"), link: item.link || "", file: item.file || "" });
        const items = (d.footerItems && d.footerItems.length > 0 ? d.footerItems : [{}, {}, {}]).map(normalize);
        setData({
          number1: d.number1 || "",
          number2: d.number2 || "",
          qrImage: d.qrImage || "",
          qrLink: d.qrLink || "",
          img1: d.img1 || "",
          link1: d.link1 || "",
          linkType1: d.link1Type || d.linkType1 || (d.file1 ? "file" : "link"),
          file1: d.file1 || "",
          img2: d.img2 || "",
          link2: d.link2 || "",
          linkType2: d.link2Type || d.linkType2 || (d.file2 ? "file" : "link"),
          file2: d.file2 || "",
          footerItems: items,
        });
      })
      .catch(() => showMsg("load", "❌ فشل تحميل البيانات"));
  }, []);

  async function deleteImage(field: "qrImage" | "img1" | "img2", section: string, saveBody: object) {
    setData((p) => ({ ...p, [field]: "" }));
    await saveSection(section, saveBody);
  }

  async function deleteItemImage(index: number) {
    setData((p) => {
      const items = [...p.footerItems];
      items[index] = { ...items[index], image: "" };
      return { ...p, footerItems: items };
    });
  }

  async function uploadQr(file: File) {
    setUploading("qr");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(`/api/admin/company/footer-image/qrImage`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) { setData((p) => ({ ...p, qrImage: json.url })); bumpKey("qr"); }
    } catch {
      showMsg("qr", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  async function uploadImg1(file: File) {
    setUploading("img1");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(`/api/admin/company/footer-image/img1`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) { setData((p) => ({ ...p, img1: json.url })); bumpKey("img1"); }
    } catch {
      showMsg("s1", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  async function uploadImg2(file: File) {
    setUploading("img2");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(`/api/admin/company/footer-image/img2`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) { setData((p) => ({ ...p, img2: json.url })); bumpKey("img2"); }
    } catch {
      showMsg("s2", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  async function uploadFile1(file: File) {
    setUploading("file1");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`/api/admin/company/footer-file/file1`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) setData((p) => ({ ...p, file1: json.url }));
    } catch {
      showMsg("s1", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  async function uploadFile2(file: File) {
    setUploading("file2");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`/api/admin/company/footer-file/file2`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) setData((p) => ({ ...p, file2: json.url }));
    } catch {
      showMsg("s2", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  async function uploadItemImg(index: number, file: File) {
    setUploading(`img-${index}`);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(`/api/admin/company/footer-items/image/${index}`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) {
        setData((p) => {
          const items = [...p.footerItems];
          items[index] = { ...items[index], image: json.url };
          return { ...p, footerItems: items };
        });
        bumpKey(`img-${index}`);
      }
    } catch {
      showMsg("items", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  async function uploadItemFile(index: number, file: File) {
    setUploading(`file-${index}`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`/api/admin/company/footer-items/file/${index}`, { method: "POST", credentials: "include", body: fd });
      const json = await r.json();
      if (json.url) setData((p) => {
        const items = [...p.footerItems];
        items[index] = { ...items[index], file: json.url };
        return { ...p, footerItems: items };
      });
    } catch {
      showMsg("items", "❌ خطأ في الشبكة");
    } finally {
      setUploading(null);
    }
  }

  function updateItem(index: number, field: keyof FooterItem, value: string) {
    setData((p) => {
      const items = [...p.footerItems];
      const updated = { ...items[index], [field]: value };
      if (field === "linkType") {
        if (value === "link") updated.file = "";
        else updated.link = "";
      }
      items[index] = updated;
      return { ...p, footerItems: items };
    });
  }

  async function saveSection(section: string, body: object) {
    setSavingSection(section);
    try {
      const r = await fetch(`/api/admin/company`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      showMsg(section, r.ok ? "✅ تم الحفظ" : "❌ حدث خطأ");
    } catch {
      showMsg(section, "❌ خطأ في الشبكة");
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">الملفات والصور</h1>
      </div>

      {/* QR */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600">الكيو آر</h2>
          <div className="flex items-center gap-2">
            {msgs["qr"] && <span className={`text-xs px-2 py-1 rounded-lg font-medium ${msgs["qr"].includes("✅") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msgs["qr"]}</span>}
            <button onClick={() => saveSection("qr", { qrLink: data.qrLink })} disabled={savingSection === "qr"}
              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {savingSection === "qr" ? "جاري..." : "حفظ"}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:px-5 sm:py-4">
          {/* صورة QR */}
          <div onClick={() => qrRef.current?.click()}
            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden shrink-0">
            {uploading === "qr" ? (
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : data.qrImage ? (
              <>
                <Image key={imgKeys["qr"] || data.qrImage} src={data.qrImage} alt="qr" fill sizes="80px" className="object-contain p-1" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FiUpload className="text-white" size={16} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                <FiUpload size={20} />
                <span className="text-[10px]">رفع صورة</span>
              </div>
            )}
            <input ref={qrRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadQr(e.target.files[0])} />
            {data.qrImage && (
              <button onClick={(e) => { e.stopPropagation(); deleteImage("qrImage", "qr", { qrImage: "", qrLink: data.qrLink }); }}
                className="absolute top-1 left-1 z-10 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">
                ×
              </button>
            )}
          </div>
          {/* رابط QR */}
          <div className="flex-1 min-w-0 w-full flex items-center gap-2">
            <FiLink className="text-gray-400 shrink-0" size={15} />
            <input type="text" value={data.qrLink ?? ""}
              onChange={(e) => setData((p) => ({ ...p, qrLink: e.target.value }))}
              placeholder="رابط عند الضغط على الكيو آر..."
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
          </div>
        </div>
      </div>

      {/* Footer Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600">معروف</h2>
          <div className="flex items-center gap-2">
            {msgs["items"] && <span className={`text-xs px-2 py-1 rounded-lg font-medium ${msgs["items"].includes("✅") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msgs["items"]}</span>}
            <button onClick={() => saveSection("items", { footerItems: data.footerItems })} disabled={savingSection === "items"}
              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {savingSection === "items" ? "جاري..." : "حفظ"}
            </button>
          </div>
        </div>

        {data.footerItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            لا توجد صور — اضغط &quot;إضافة صورة&quot; لإضافة أول صورة
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.footerItems.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:px-5 sm:py-4">

                {/* صورة */}
                <div onClick={() => imgRefs.current[i]?.click()}
                  className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden shrink-0">
                  {uploading === `img-${i}` ? (
                    <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : item.image ? (
                    <>
                      <Image key={imgKeys[`img-${i}`] || item.image} src={item.image} alt="preview" fill sizes="80px" className="object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FiUpload className="text-white" size={16} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <FiUpload size={20} />
                      <span className="text-[10px]">رفع صورة</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    ref={(el) => { imgRefs.current[i] = el; }}
                    onChange={(e) => e.target.files?.[0] && uploadItemImg(i, e.target.files[0])} />
                  {item.image && (
                    <button onClick={(e) => { e.stopPropagation(); deleteItemImage(i); }}
                      className="absolute top-1 left-1 z-10 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">
                      ×
                    </button>
                  )}
                </div>

                <label className="w-full sm:w-48 shrink-0 text-sm text-gray-600">
                  الرقم أسفل الصورة
                  <input type="text" inputMode="numeric" dir="ltr" value={item.number}
                    onChange={(e) => updateItem(i, "number", e.target.value)}
                    placeholder="اكتب الرقم (اختياري)"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>

                {/* رابط أو ملف */}
                <div className="flex-1 min-w-0 w-full space-y-2">
                  <div className="flex gap-4">
                    {["link", "file"].map((t) => (
                      <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                        <input type="radio" name={`type-${i}`} value={t}
                          checked={(item.linkType ?? "link") === t}
                          onChange={() => updateItem(i, "linkType", t)}
                          className="accent-blue-600" />
                        {t === "link" ? "رابط" : "ملف"}
                      </label>
                    ))}
                  </div>

                  <div className="flex items-start gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs w-full">
                    <span className="shrink-0">⚠️</span>
                    <span>مسموح برابط واحد أو ملف واحد فقط — لا يمكن الجمع بينهما</span>
                  </div>

                  {(item.linkType ?? "link") === "link" ? (
                    <div key={`link-input-${i}`} className="flex items-center gap-2 w-full">
                      <FiLink className="text-gray-400 shrink-0" size={15} />
                      <input type="text" value={item.link ?? ""}
                        onChange={(e) => updateItem(i, "link", e.target.value)}
                        placeholder="https://..."
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
                    </div>
                  ) : (
                    <div key={`file-input-${i}`} className="flex flex-wrap items-center gap-2">
                      <button onClick={() => fileRefs.current[i]?.click()}
                        disabled={uploading === `file-${i}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 shrink-0">
                        {uploading === `file-${i}`
                          ? <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          : <FiUpload size={13} />}
                        رفع ملف
                      </button>
                      <input type="file" className="hidden"
                        ref={(el) => { fileRefs.current[i] = el; }}
                        onChange={(e) => e.target.files?.[0] && uploadItemFile(i, e.target.files[0])} />
                      {item.file && (
                        <>
                          <button onClick={() => openFile(item.file)}
                            className="flex items-center gap-1 text-emerald-600 text-sm hover:underline">
                            <FiExternalLink size={13} />
                            عرض الملف
                          </button>
                          <button onClick={() => updateItem(i, "file", "")}
                            className="text-red-400 hover:text-red-600 text-xs hover:underline">
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 1 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600"> مركز الاعمال السعودي</h2>
          <div className="flex items-center gap-2">
            {msgs["s1"] && <span className={`text-xs px-2 py-1 rounded-lg font-medium ${msgs["s1"].includes("✅") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msgs["s1"]}</span>}
            <button onClick={() => saveSection("s1", { link1: data.link1, link1Type: data.linkType1, file1: data.file1, number1: data.number1 })} disabled={savingSection === "s1"}
              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {savingSection === "s1" ? "جاري..." : "حفظ"}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:px-5 sm:py-4">
          <div onClick={() => img1Ref.current?.click()}
            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden shrink-0">
            {uploading === "img1" ? (
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : data.img1 ? (
              <>
                <Image key={imgKeys["img1"] || data.img1} src={data.img1} alt="img1" fill sizes="80px" className="object-contain p-1" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FiUpload className="text-white" size={16} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                <FiUpload size={20} />
                <span className="text-[10px]">رفع صورة</span>
              </div>
            )}
            <input ref={img1Ref} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadImg1(e.target.files[0])} />
            {data.img1 && (
              <button onClick={(e) => { e.stopPropagation(); deleteImage("img1", "s1", { img1: "", link1: data.link1, link1Type: data.linkType1, file1: data.file1, number1: data.number1 }); }}
                className="absolute top-1 left-1 z-10 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">
                ×
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 w-full space-y-2">
            <label className="block text-sm text-gray-600">
              الرقم أسفل الصورة
              <input type="text" inputMode="numeric" dir="ltr" value={data.number1}
                onChange={(e) => setData((p) => ({ ...p, number1: e.target.value }))}
                placeholder="اكتب الرقم (اختياري)"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <div className="flex gap-4">
              {["link", "file"].map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                  <input type="radio" name="type-1" value={t}
                    checked={(data.linkType1 || "link") === t}
                    onChange={() => setData((p) => ({ ...p, linkType1: t, ...(t === "link" ? { file1: "" } : { link1: "" }) }))}
                    className="accent-blue-600" />
                  {t === "link" ? "رابط" : "ملف"}
                </label>
              ))}
            </div>
            <div className="flex items-start gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs w-full">
              <span className="shrink-0">⚠️</span>
              <span>مسموح برابط واحد أو ملف واحد فقط — لا يمكن الجمع بينهما</span>
            </div>

            {(data.linkType1 || "link") === "link" ? (
              <div key="s1-link" className="flex items-center gap-2 w-full">
                <FiLink className="text-gray-400 shrink-0" size={15} />
                <input type="text" value={data.link1 ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, link1: e.target.value }))}
                  placeholder="رابط سكشن 1..."
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
              </div>
            ) : (
              <div key="s1-file" className="flex flex-wrap items-center gap-2">
                <button onClick={() => fileRef1.current?.click()}
                  disabled={uploading === "file1"}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 shrink-0">
                  {uploading === "file1"
                    ? <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    : <FiUpload size={13} />}
                  رفع ملف
                </button>
                <input type="file" className="hidden" ref={fileRef1}
                  onChange={(e) => e.target.files?.[0] && uploadFile1(e.target.files[0])} />
                {data.file1 && (
                  <>
                    <button onClick={() => openFile(data.file1)}
                      className="flex items-center gap-1 text-emerald-600 text-sm hover:underline">
                      <FiExternalLink size={13} />
                      عرض الملف
                    </button>
                    <button onClick={() => setData((p) => ({ ...p, file1: "" }))}
                      className="text-red-400 hover:text-red-600 text-xs hover:underline">
                      حذف
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600"> ضريبه القيمه المضافه</h2>
          <div className="flex items-center gap-2">
            {msgs["s2"] && <span className={`text-xs px-2 py-1 rounded-lg font-medium ${msgs["s2"].includes("✅") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{msgs["s2"]}</span>}
            <button onClick={() => saveSection("s2", { link2: data.link2, link2Type: data.linkType2, file2: data.file2, number2: data.number2 })} disabled={savingSection === "s2"}
              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {savingSection === "s2" ? "جاري..." : "حفظ"}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:px-5 sm:py-4">
          <div onClick={() => img2Ref.current?.click()}
            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden shrink-0">
            {uploading === "img2" ? (
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : data.img2 ? (
              <>
                <Image key={imgKeys["img2"] || data.img2} src={data.img2} alt="img2" fill sizes="80px" className="object-contain p-1" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FiUpload className="text-white" size={16} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                <FiUpload size={20} />
                <span className="text-[10px]">رفع صورة</span>
              </div>
            )}
            <input ref={img2Ref} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadImg2(e.target.files[0])} />
            {data.img2 && (
              <button onClick={(e) => { e.stopPropagation(); deleteImage("img2", "s2", { img2: "", link2: data.link2, link2Type: data.linkType2, file2: data.file2, number2: data.number2 }); }}
                className="absolute top-1 left-1 z-10 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">
                ×
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 w-full space-y-2">
            <label className="block text-sm text-gray-600">
              الرقم أسفل الصورة
              <input type="text" inputMode="numeric" dir="ltr" value={data.number2}
                onChange={(e) => setData((p) => ({ ...p, number2: e.target.value }))}
                placeholder="اكتب الرقم (اختياري)"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <div className="flex gap-4">
              {["link", "file"].map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                  <input type="radio" name="type-2" value={t}
                    checked={(data.linkType2 || "link") === t}
                    onChange={() => setData((p) => ({ ...p, linkType2: t, ...(t === "link" ? { file2: "" } : { link2: "" }) }))}
                    className="accent-blue-600" />
                  {t === "link" ? "رابط" : "ملف"}
                </label>
              ))}
            </div>
            <div className="flex items-start gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs w-full">
              <span className="shrink-0">⚠️</span>
              <span>مسموح برابط واحد أو ملف واحد فقط — لا يمكن الجمع بينهما</span>
            </div>

            {(data.linkType2 || "link") === "link" ? (
              <div key="s2-link" className="flex items-center gap-2 w-full">
                <FiLink className="text-gray-400 shrink-0" size={15} />
                <input type="text" value={data.link2 ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, link2: e.target.value }))}
                  placeholder="رابط سكشن 2..."
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
              </div>
            ) : (
              <div key="s2-file" className="flex flex-wrap items-center gap-2">
                <button onClick={() => fileRef2.current?.click()}
                  disabled={uploading === "file2"}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 shrink-0">
                  {uploading === "file2"
                    ? <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    : <FiUpload size={13} />}
                  رفع ملف
                </button>
                <input type="file" className="hidden" ref={fileRef2}
                  onChange={(e) => e.target.files?.[0] && uploadFile2(e.target.files[0])} />
                {data.file2 && (
                  <>
                    <button onClick={() => openFile(data.file2)}
                      className="flex items-center gap-1 text-emerald-600 text-sm hover:underline">
                      <FiExternalLink size={13} />
                      عرض الملف
                    </button>
                    <button onClick={() => setData((p) => ({ ...p, file2: "" }))}
                      className="text-red-400 hover:text-red-600 text-xs hover:underline">
                      حذف
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
