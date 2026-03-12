"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquarePlus,
  Loader2,
  ImagePlus,
  X,
  AlertCircle,
} from "lucide-react";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_EXT_LABEL = "JPG, PNG, WEBP, GIF";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
import { useSubmitFeedback } from "@/hooks/dashboard/use-submit-feedback";
import { cn } from "@/lib/utils";

interface FeedbackPageProps {
  children?: React.ReactNode;
}

function FeedbackPage({ children }: FeedbackPageProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { submitFeedback, loading } = useSubmitFeedback({
    onSuccess: () => {
      setOpen(false);
      resetFile();
    },
  });

  const resetFile = () => {
    setPreview(null);
    setFileError(null);
    // setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreview(null);
    setFileError(null);
    // setFileName(null);

    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError(
        `Unsupported file type. Please upload: ${ALLOWED_EXT_LABEL}.`,
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        "File exceeds the 50 MB limit. Please choose a smaller image.",
      );
      e.target.value = "";
      return;
    }

    // setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (fileError) return;
    const formData = new FormData(e.currentTarget);
    await submitFeedback(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant="outline" className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Submit Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by providing your feedback, feature requests, or
            reporting bugs.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Brief summary"
              className="break-all"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
              required
              defaultValue="feedback"
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="feedback">General Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Please provide details..."
              className="min-h-25 break-all"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Attach Screenshot (Optional)</Label>

            {/* Drop zone / trigger */}
            <div
              className={cn(
                "relative rounded-md border border-dashed transition-colors",
                fileError
                  ? "border-destructive bg-destructive/5"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500",
              )}
            >
              <Input
                ref={fileInputRef}
                id="screenshot"
                name="screenshot"
                type="file"
                accept={ALLOWED_MIME_TYPES.join(",")}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                disabled={loading}
                onChange={handleFileChange}
              />

              {preview ? (
                /* Preview */
                <div className="flex items-center gap-3 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                    <Image
                      src={preview}
                      alt="Screenshot preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">Click to replace</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove screenshot"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetFile();
                    }}
                    disabled={loading}
                    className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center gap-1 py-5 text-center">
                  <ImagePlus className="h-6 w-6 text-zinc-400" />
                  <p className="text-sm text-zinc-500">
                    Click to upload a screenshot
                  </p>
                </div>
              )}
            </div>

            {/* Validation error */}
            {fileError && (
              <p className="flex items-center gap-1.5 break-all text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fileError}
              </p>
            )}

            {/* Policy hint */}
            <p className="break-all text-xs text-zinc-400 dark:text-zinc-500">
              Accepted: {ALLOWED_EXT_LABEL} &mdash; Max size: 50 MB
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackPage;
