import { useEffect, useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  Upload,
  Trash2,
  Loader2,
  Video,
  Image as ImageIcon,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/imgbb";
import type { GalleryItem } from "@/components/sections/GallerySection";
import { toast } from "sonner";

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("HAIR");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [videoUrl, setVideoUrl] = useState("");

  // Bulk Upload states
  const [isDragActive, setIsDragActive] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Bulk Actions
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) })));
    });
  }, []);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const list = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      setFilesToUpload((prev) => [...prev, ...list]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const list = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
      setFilesToUpload((prev) => [...prev, ...list]);
    }
  };

  const removeFileFromQueue = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (filesToUpload.length === 0) return setErr("Please choose or drag at least one image");

    setUploading(true);
    let count = 0;
    const now = new Date();
    const uploadTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const uploadDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${filesToUpload.length}...`);
        const fileItem = filesToUpload[i];
        const url = await uploadImage(fileItem);
        
        await addDoc(collection(db, "gallery"), {
          type: "image",
          url,
          title: title.trim() || fileItem.name.split(".")[0],
          description: description.trim() || `Gallery asset of category ${category}`,
          category: category.toUpperCase(),
          date: uploadDate,
          time: uploadTime,
          createdAt: Date.now() + i,
        });
        count++;
      }
      toast.success(`Successfully uploaded ${count} images to gallery!`);
      setFilesToUpload([]);
      setTitle("");
      setDescription("");
    } catch {
      setErr(`Failed during upload after ${count} files. Try again.`);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!videoUrl.trim()) return;

    const now = new Date();
    const uploadTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const uploadDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    await addDoc(collection(db, "gallery"), {
      type: "video",
      url: videoUrl.trim(),
      title: title.trim() || "Video Showcase",
      description: description.trim() || "Video beauty guide",
      category: category.toUpperCase(),
      date: uploadDate,
      time: uploadTime,
      createdAt: Date.now(),
    });
    setVideoUrl("");
    setTitle("");
    setDescription("");
    toast.success("Video link added successfully!");
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelectedIds(filteredItems.map((it) => it.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const deleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) return;

    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "gallery", id));
      }
      toast.success(`Deleted ${selectedIds.length} items successfully!`);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to delete selected items");
    }
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      !searchQuery ||
      (it.title && it.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (it.description && it.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (it.category && it.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bulk Image Drag & Drop Upload Form */}
        <form onSubmit={handleUploadBulk} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4" /> Upload Gallery Images
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="HAIR">Hair</option>
              <option value="SKIN">Skin</option>
              <option value="MAKEUP">Makeup</option>
              <option value="NAILS">Nails</option>
              <option value="SPA">Spa</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
            />
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[0.98]"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Drag & drop images here or <span className="text-primary hover:underline">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Supports PNG, JPG, WEBP (Single/Bulk)</p>
          </div>

          {/* Upload Queue Previews */}
          {filesToUpload.length > 0 && (
            <div className="space-y-2 border border-border p-3 rounded-xl bg-background max-h-40 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                Queue list ({filesToUpload.length})
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {filesToUpload.map((f, idx) => (
                  <div key={idx} className="relative aspect-square border rounded overflow-hidden bg-muted group">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFileFromQueue(idx)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || filesToUpload.length === 0}
            className="w-full py-2.5 rounded-full gradient-rose text-white font-medium text-xs inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-soft"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? uploadProgress : `Upload images (${filesToUpload.length} in queue)`}
          </button>
        </form>

        {/* Video Link Addition */}
        <form onSubmit={addVideo} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Video className="h-4 w-4" /> Add Video Link
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="HAIR">Hair</option>
              <option value="SKIN">Skin</option>
              <option value="MAKEUP">Makeup</option>
              <option value="NAILS">Nails</option>
              <option value="SPA">Spa</option>
            </select>
            <input
              type="date"
              value={date}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
              disabled
            />
          </div>

          <input
            type="url"
            placeholder="https://youtube.com/watch?v=... or Instagram video link"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Video Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
            />
            <input
              type="text"
              placeholder="Video Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-full gradient-rose text-white font-medium text-xs cursor-pointer shadow-soft"
          >
            Add Video Link
          </button>
        </form>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {/* Grid search and bulk actions */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search images/tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-xs"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 ? (
            <>
              <button
                onClick={deleteBulk}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.length})
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold cursor-pointer"
              >
                Deselect All
              </button>
            </>
          ) : (
            <button
              onClick={selectAll}
              className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
            >
              Select All Shown
            </button>
          )}
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredItems.map((it) => {
          const isSelected = selectedIds.includes(it.id);
          return (
            <div
              key={it.id}
              onClick={() => toggleSelect(it.id)}
              className={`relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer border-2 transition-all ${
                isSelected ? "border-primary" : "border-transparent"
              }`}
            >
              {it.type === "image" ? (
                <img src={it.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-rose flex items-center justify-center">
                  <Video className="h-8 w-8 text-white" />
                </div>
              )}

              <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-sm text-[8px] text-white font-bold px-1.5 py-0.5 rounded uppercase">
                {it.category || "GENERAL"}
              </div>

              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] text-white/90 font-mono leading-tight">{it.date}</span>
                  {isSelected ? (
                    <Square className="h-4.5 w-4.5 text-primary fill-primary border-none" />
                  ) : (
                    <Square className="h-4.5 w-4.5 text-white/80" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this gallery image?")) deleteDoc(doc(db, "gallery", it.id));
                  }}
                  className="self-end p-1.5 rounded bg-destructive text-white cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
