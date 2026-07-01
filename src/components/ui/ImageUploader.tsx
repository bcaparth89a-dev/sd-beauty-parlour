import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Upload, RefreshCw, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/imgbb";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "banner" | "any";
}

export function ImageUploader({
  value,
  onChange,
  onDelete,
  label = "Upload Image",
  className = "",
  aspectRatio = "any",
}: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading image to ImgBB...");
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this image?")) {
      onChange("");
      if (onDelete) onDelete();
    }
  };

  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[21/9]",
    any: "min-h-[140px]",
  }[aspectRatio];

  return (
    <div className={`w-full ${className}`}>
      {label && <span className="text-xs font-semibold text-muted-foreground block mb-2">{label}</span>}
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={uploading}
      />

      {value ? (
        <div className={`relative rounded-2xl overflow-hidden group border border-border shadow-soft bg-muted flex items-center justify-center ${aspectClass}`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploading}
              className="p-2.5 rounded-full bg-white text-black hover:bg-primary hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Replace Image"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="p-2.5 rounded-full bg-destructive text-white hover:bg-destructive/85 transition-colors cursor-pointer flex items-center justify-center"
              title="Delete Image"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-primary bg-primary/5 scale-[0.98]"
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/40"
          } ${aspectClass}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-semibold">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Drag & drop or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Supports JPG, PNG, WEBP (Max 32MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
