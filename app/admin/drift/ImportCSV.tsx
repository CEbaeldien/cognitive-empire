"use client";

import { useRef, useState } from "react";

type ImportResult = {
  batch_id: string;
  status: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors?: string[];
};

export default function ImportCSV() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/drift/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — could not reach import API");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => { setResult(null); setError(null); inputRef.current?.click(); }}
        disabled={uploading}
        className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800/60 px-4 py-2 text-[11px] uppercase tracking-widest text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-500 border-t-slate-200" />
            Importing…
          </>
        ) : (
          "Import CSV"
        )}
      </button>

      {result && (
        <div className="text-right">
          <p className={`text-[11px] font-medium ${result.failed_rows === 0 ? "text-emerald-400" : result.successful_rows > 0 ? "text-amber-400" : "text-red-400"}`}>
            {result.successful_rows} imported
            {result.failed_rows > 0 && `, ${result.failed_rows} failed`}
          </p>
          <p className="text-[10px] text-slate-600">
            batch {result.batch_id.slice(0, 8)}…
          </p>
          {result.errors && result.errors.length > 0 && (
            <details className="mt-1 text-left">
              <summary className="cursor-pointer text-[10px] text-slate-600 hover:text-slate-400">
                {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}
              </summary>
              <ul className="mt-1 max-h-32 overflow-y-auto rounded border border-slate-800 bg-slate-900/50 p-2">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-[10px] text-red-400">{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <p className="text-right text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}
