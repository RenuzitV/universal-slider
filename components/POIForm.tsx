// src/components/POIForm.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BodyPortal from "./BodyPortal";
import type { PointOfInterest } from "./pointOfInterest"; // ← lowercase p
import { createPOI, updatePOI, uploadImageBase64 } from "../lib/api";
import styles from "../styles/poi-form.module.css";
import { compressAndToBase64 } from "../lib/imageClient";

type Props = {
    open: boolean;
    onClose: () => void;
    onSaved: (poi: PointOfInterest) => void;
    poi?: PointOfInterest;           // edit mode if present
    initialDate?: Date;              // ← NEW: used in create mode
};

type ImgEntry = {
    url: string;
    status: "ready" | "uploading" | "error";
    name?: string;
};

const toInputDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseInputDate = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export default function POIForm({ open, onClose, onSaved, poi, initialDate }: Props) {
    // form state
    const [title, setTitle] = useState(poi?.title ?? "");
    const [dateStr, setDateStr] = useState(
        poi ? toInputDate(poi.date)
            : toInputDate(initialDate ?? new Date())
    );
    const [desc, setDesc] = useState(poi?.description ?? "");
    const [images, setImages] = useState<ImgEntry[]>(
        (poi?.imageURLs ?? []).map((u) => ({ url: u, status: "ready" }))
    );

    const isEdit = !!poi;
    const canSubmit = title.trim().length > 0 && dateStr.length > 0;

    // reset when opening on a different POI
    useEffect(() => {
        if (!open) return;
        setTitle(poi?.title ?? "");
        setDateStr(poi ? toInputDate(poi.date)
            : toInputDate(initialDate ?? new Date())); // ← use it here too
        setDesc(poi?.description ?? "");
        setImages((poi?.imageURLs ?? []).map(u => ({ url: u, status: "ready" })));
    }, [open, poi, initialDate]);



    // file input
    const fileRef = useRef<HTMLInputElement>(null);

    const onPickFiles = () => fileRef.current?.click();

    const handleFiles = async (files: FileList | null) => {
        if (!files?.length) return;

        const placeholders = Array.from(files).map((f) => ({
            url: "",
            status: "uploading" as const,
            name: f.name,
        }));
        setImages((prev) => [...prev, ...placeholders]);

        for (const f of Array.from(files)) {
            try {
                const { contentType, base64 } = await compressAndToBase64(f, {
                    maxW: 2048,
                    maxH: 2048,
                    quality: 0.85,
                });
                const { url } = await uploadImageBase64(contentType, base64);
                setImages((prev) => {
                    const copy = [...prev];
                    const idx = copy.findIndex((x) => x.status === "uploading" && !x.url && x.name === f.name);
                    if (idx >= 0) copy[idx] = { url, status: "ready", name: f.name };
                    return copy;
                });
            } catch (err) {
                console.error("upload failed", err);
                setImages((prev) => {
                    const copy = [...prev];
                    const idx = copy.findIndex((x) => x.status === "uploading" && !x.url && x.name === f.name);
                    if (idx >= 0) copy[idx] = { url: "", status: "error", name: f.name };
                    return copy;
                });
            }
        }
    };


    const removeImage = (idx: number) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const payload = {
            title: title.trim(),
            date: new Date(dateStr).toISOString(),
            description: desc,
            imageURLs: images.filter((i) => i.status === "ready" && i.url).map((i) => i.url),
        };

        try {
            if (isEdit && poi) {
                const dto = await updatePOI(poi.id, payload);
                const saved: PointOfInterest = {
                    id: dto.id,
                    title: dto.title,
                    description: dto.description,
                    date: new Date(dto.date),
                    imageURLs: dto.imageURLs ?? [],
                };
                onSaved(saved);
            } else {
                const dto = await createPOI(payload);
                const saved: PointOfInterest = {
                    id: dto.id,
                    title: dto.title,
                    description: dto.description,
                    date: new Date(dto.date),
                    imageURLs: dto.imageURLs ?? [],
                };
                onSaved(saved);
            }
            onClose();
        } catch (err) {
            console.error("save failed", err);
            // TODO: toast/error UI
        }
    };

    if (!open) return null;

    return (
        <BodyPortal>
            <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={isEdit ? "Edit POI" : "Create POI"}>
                <div className={styles.panel}>
                    {/* left square: form */}
                    <form className={styles.infoPanel} onSubmit={handleSubmit}>
                        <div className={styles.header}>
                            <div className={styles.title}>{isEdit ? "Edit Moment" : "New Moment"}</div>
                            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">×</button>
                        </div>

                        <label className={styles.label}>
                            Title
                            <input
                                className={styles.input}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., First Date"
                                required
                            />
                        </label>

                        <label className={styles.label}>
                            Date
                            <input
                                type="date"
                                className={styles.input}
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
                                required
                            />
                        </label>

                        <label className={styles.label}>
                            Description
                            <textarea
                                className={styles.textarea}
                                rows={6}
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                placeholder="A few words about the day…"
                            />
                        </label>

                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={onClose}>Cancel</button>
                            <button type="submit" className={styles.primary} disabled={!canSubmit}>
                                {isEdit ? "Save" : "Create"}
                            </button>
                        </div>
                    </form>

                    {/* right square: images */}
                    <div className={styles.galleryPanel}>
                        <div className={styles.galleryHeader}>
                            <div className={styles.galleryTitle}>Photos</div>
                            <button type="button" className={styles.addBtn} onClick={onPickFiles}>＋ Add</button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={(e) => handleFiles(e.target.files)}
                            />
                        </div>

                        {images.length === 0 ? (
                            <div className={styles.empty}>No photos yet. Click “Add” to upload.</div>
                        ) : (
                            <div className={styles.thumbGrid}>
                                {images.map((img, i) => (
                                    <div key={`${img.url || img.name || i}-${i}`} className={styles.thumb}>
                                        {img.status === "uploading" && <div className={styles.thumbStatus}>Uploading…</div>}
                                        {img.status === "error" && <div className={styles.thumbError}>Failed</div>}
                                        {img.url ? <img src={img.url} alt="" /> : <div className={styles.thumbPh} />}
                                        <button
                                            type="button"
                                            className={styles.remove}
                                            aria-label="Remove photo"
                                            onClick={() => removeImage(i)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BodyPortal>
    );
}

/* util */
function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result).split(",").pop() || "");
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}
