"use client";

import { useRef, useState } from "react";
import { CERTIFICATE_TYPE, MAX_IMAGE_BYTES, uploadProductImage } from "@/lib/supabase";
import { signUpload } from "./actions";

/** PDF upload for a GIA / IGI certificate. `url` is the public link once uploaded; null clears it. */
export default function CertificateField({ url, onChange, onBusy }: { url: string | null; onChange: (url: string | null) => void; onBusy?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== CERTIFICATE_TYPE) return setState({ busy: false, error: "The certificate must be a PDF." });
    if (file.size > MAX_IMAGE_BYTES) return setState({ busy: false, error: "Over 10 MB." });
    setState({ busy: true, error: null });
    onBusy?.(true);
    try {
      onChange(await uploadProductImage(file, signUpload));
      setState({ busy: false, error: null });
    } catch (e) {
      setState({ busy: false, error: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      onBusy?.(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <button type="button" onClick={() => input.current?.click()} disabled={state.busy} className="eyebrow border border-dashed border-charcoal/30 px-5 py-3 text-[0.6rem] transition-colors duration-500 hover:border-obsidian/60 disabled:opacity-50">
        {state.busy ? "Uploading" : url ? "Replace certificate (PDF)" : "Upload certificate (PDF)"}
      </button>
      <input ref={input} type="file" accept={CERTIFICATE_TYPE} className="sr-only" tabIndex={-1} aria-label="Choose certificate PDF" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      {url && (
        <>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-champagne-deep underline underline-offset-[5px]">View certificate</a>
          <button type="button" onClick={() => onChange(null)} className="text-[0.8rem] text-muted-gray underline underline-offset-[5px] hover:text-obsidian">Remove</button>
        </>
      )}
      {state.error && <p role="alert" className="w-full text-[0.75rem] text-obsidian">{state.error}</p>}
    </div>
  );
}
