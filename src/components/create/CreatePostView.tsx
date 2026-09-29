import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PostMediaType } from '../../types';
import {
  FileText,
  Image as ImageIcon,
  Link2,
  ArrowLeft,
  ArrowRight,
  Eye,
  Upload,
  X,
  Plus
} from 'lucide-react';
import { readImageFile } from '../../utils/fileUpload';
import { Avatar } from '../common/Avatar';

export const CreatePostView: React.FC = () => {
  const {
    createPost,
    navigateToFeed,
    currentUser,
    setAuthModalOpen,
    t,
    dir,
  } = useApp();

  const [mediaType, setMediaType] = useState<PostMediaType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['dzcore', 'عام']);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError('');
      const dataUrl = await readImageFile(file, 1200, 0.85);
      setMediaUrl(dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process image';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!title.trim()) return;

    createPost({
      title: title.trim(),
      content: content.trim(),
      mediaType,
      mediaUrl: mediaType === 'image' ? mediaUrl.trim() : undefined,
      linkUrl: mediaType === 'link' ? linkUrl.trim() : undefined,
      tags,
    });
  };

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 text-start">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToFeed()}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
              {t.createPostTitle}
            </h1>
            <p className="text-xs text-neutral-400">
              {t.createPostSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
            showPreview
              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
              : 'bg-white/5 text-neutral-300 border-white/10 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t.livePreview}</span>
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Post Type Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-900/60 border border-white/5 rounded-2xl">
          <button
            type="button"
            onClick={() => setMediaType('text')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mediaType === 'text'
                ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>{t.postTypeDiscussion}</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaType('image')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mediaType === 'image'
                ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-teal-400" />
            <span>{t.postTypeImage}</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaType('link')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mediaType === 'link'
                ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4 text-indigo-400" />
            <span>{t.postTypeLink}</span>
          </button>
        </div>

        {/* Form Body Container */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                {t.postTitleLabel} <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">
                {title.length}/300
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={300}
              placeholder={t.postTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
            />
          </div>

          {/* Real Image Uploader for Image Post */}
          {mediaType === 'image' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-300">
                {t.postTypeImage}
              </label>

              {uploadError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg">
                  {uploadError}
                </div>
              )}

              {/* Upload Box */}
              {!mediaUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-white/[0.02] flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-neutral-950 flex items-center justify-center text-emerald-400 ring-1 ring-white/10">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-semibold text-white block">
                      {isUploading ? 'Compressing and processing...' : t.postImageUpload}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {t.postImageUploadHint}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 max-h-80 flex items-center justify-center">
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="max-h-80 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrl('')}
                    className="absolute top-3 end-3 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Or Direct Image URL */}
              <div className="pt-2">
                <span className="text-[11px] text-neutral-400 block mb-1">
                  {t.postImageUrlLabel}:
                </span>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start font-mono"
                />
              </div>
            </div>
          )}

          {/* Link URL */}
          {mediaType === 'link' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.postLinkUrlLabel}
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start font-mono"
              />
            </div>
          )}

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.postContentLabel}
            </label>
            <textarea
              rows={6}
              placeholder={t.postContentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl p-4 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-start leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.postTagsLabel}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={t.addTag}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addTag}</span>
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 text-xs font-mono"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Card */}
        {showPreview && (
          <div className="border border-emerald-500/30 bg-emerald-950/10 rounded-2xl p-4 md:p-6 space-y-3">
            <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider font-semibold">
              {t.livePreview}:
            </span>

            {/* Author Header in Preview */}
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Avatar
                src={currentUser?.avatar}
                alt={currentUser?.displayName || 'User'}
                size="xs"
                status={currentUser?.status}
              />
              <span className="font-semibold text-neutral-100">
                {currentUser?.displayName || 'Your Name'}
              </span>
              <span className="font-mono text-neutral-400 text-[11px]">
                @{currentUser?.username || 'username'}
              </span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-[11px] text-neutral-400">الآن</span>
            </div>

            <div className="text-lg font-bold text-white">{title || 'Sample Post Title'}</div>
            {content && <p className="text-xs md:text-sm text-neutral-300 whitespace-pre-line">{content}</p>}
            {mediaUrl && (
              <div className="rounded-xl overflow-hidden max-h-72 bg-neutral-950 flex items-center justify-center">
                <img src={mediaUrl} alt="Preview" className="max-h-72 object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigateToFeed()}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs md:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>{t.publishPost}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
