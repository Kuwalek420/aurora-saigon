"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, uploadProductImage } from "@/lib/supabase";
import { signUpload } from "./actions";

interface Pending { id: number; name: string; preview: string; error: string | null }

/** Drag-and-drop (or click) photo upload to Supabase Storage. `urls` is the ordered list of public URLs; the first is the main photo. */
export default function ImageDropzone({ urls, setUrls, onBusy }: { urls: string[]; setUrls: Dispatch<SetStateAction<string[]>>; onBusy?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);

  const patch = (next: (p: Pending[]) => Pending[]) => setPending(next);
  // report busy-ness from an effect: calling the parent's setState inside an updater would update it mid-render
  const uploading = pending.some((x) => !x.error);
  useEffect(() => { onBusy?.(uploading); }, [uploading, onBusy]);

  const add = (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const id = ++seq.current;
      const preview = URL.createObjectURL(file);
      const reject = !IMAGE_TYPES.includes(file.type) ? "Use a JPEG, PNG, WebP or AVIF photo." : file.size > MAX_IMAGE_BYTES ? "Over 10 MB." : null;
      patch((p) => [...p, { id, name: file.name, preview, error: reject }]);
      if (reject) continue;
      uploadProductImage(file, signUpload).then(
        (url) => { setUrls((u) => [...u, url]); patch((p) => p.filter((x) => x.id !== id)); URL.revokeObjectURL(preview); },
        (e: unknown) => patch((p) => p.map((x) => (x.id === id ? { ...x, error: e instanceof Error ? e.message : "Upload failed." } : x))),
      );
    }
  };

  const dismiss = (p: Pending) => { patch((all) => all.filter((x) => x.id !== p.id)); URL.revokeObjectURL(p.preview); };
  const remove = (i: number) => setUrls((u) => u.filter((_, n) => n !== i));
  const makeMain = (i: number) => setUrls((u) => [u[i], ...u.filter((_, n) => n !== i)]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={`border border-dashed px-6 py-10 text-center transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${over ? "border-champagne bg-champagne/10" : "border-charcoal/30 hover:border-obsidian/60"}`}
      >
        <button type="button" onClick={() => input.current?.click()} className="text-[0.95rem] text-obsidian">
          Drop ring photos here or <span className="underline underline-offset-[5px]">click to browse</span>
        </button>
        <p className="mt-2 text-[0.75rem] text-muted-gray">JPEG, PNG, WebP or AVIF, up to 10 MB each. You can add several at once.</p>
        <input ref={input} type="file" multiple accept={IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-label="Choose photos" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </div>

      {(urls.length > 0 || pending.length > 0) && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {urls.map((u, i) => (
            <li key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Photo ${i + 1}`} className="aspect-square w-full bg-cream object-cover" />
              <button type="button" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-alabaster/90 text-obsidian transition-colors hover:bg-obsidian hover:text-alabaster">
                <span aria-hidden className="relative block h-2.5 w-2.5"><span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" /><span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" /></span>
              </button>
              {i === 0 ? <span className="eyebrow mt-1 block text-center text-[0.5rem] text-champagne-deep">Main photo</span> : <button type="button" onClick={() => makeMain(i)} className="eyebrow mt-1 block w-full text-center text-[0.5rem] text-muted-gray hover:text-obsidian">Make main</button>}
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className={`aspect-square w-full object-cover ${p.error ? "opacity-40" : "opacity-60"}`} />
              {p.error ? (
                <>
                  <button type="button" onClick={() => dismiss(p)} aria-label={`Dismiss ${p.name}`} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-alabaster/90 text-obsidian">
                    <span aria-hidden className="relative block h-2.5 w-2.5"><span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" /><span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" /></span>
                  </button>
                  <p role="alert" className="mt-1 text-[0.65rem] leading-tight text-obsidian">{p.name}: {p.error}</p>
                </>
              ) : (
                <p role="status" className="eyebrow mt-1 text-center text-[0.5rem] text-muted-gray">Uploading</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
