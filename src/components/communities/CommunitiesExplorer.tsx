import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Search,
  Plus,
  Users,
  X,
  Upload,
  Sparkles
} from 'lucide-react';
import { readImageFile } from '../../utils/fileUpload';

export const CommunitiesExplorer: React.FC = () => {
  const {
    communities,
    joinCommunity,
    leaveCommunity,
    navigateToCommunity,
    createCommunity,
    currentUser,
    setAuthModalOpen,
    t,
    language,
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(language === 'ar' ? 'الكل' : 'All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New community form
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommCat, setNewCommCat] = useState('Tech & Code');
  const [iconPreview, setIconPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const categories = language === 'ar'
    ? ['الكل', 'تطوير وبرمجة', 'ريادة وعمل حر', 'سياحة واستكشاف', 'تطوير الألعاب', 'تعليم وأكاديميا', 'عام']
    : ['All', 'Technology', 'Freelance & Business', 'Travel & Culture', 'Gaming', 'Education', 'General'];

  const filteredCommunities = communities.filter((c) => {
    const isAll = selectedCategory === 'الكل' || selectedCategory === 'All';
    const matchesCategory = isAll || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file, 300, 0.85);
      setIconPreview(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file, 1200, 0.85);
      setBannerPreview(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!newCommName.trim()) return;

    createCommunity(
      newCommName.trim(),
      newCommDesc.trim(),
      newCommCat,
      iconPreview || undefined,
      bannerPreview || undefined
    );

    setIsCreateModalOpen(false);
    setNewCommName('');
    setNewCommDesc('');
    setIconPreview('');
    setBannerPreview('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-emerald-400" />
            <span>{t.exploreCommunities}</span>
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            {t.exploreCommunitiesSub}
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              setAuthModalOpen(true, 'login');
            } else {
              setIsCreateModalOpen(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createCommunity}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full h-11 ps-10 pe-4 rounded-xl bg-neutral-900/80 border border-white/10 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-neutral-800 text-white ring-1 ring-white/10 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Community Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCommunities.map((c) => (
          <div
            key={c.id}
            className="group rounded-2xl bg-neutral-900/60 border border-white/5 hover:border-white/10 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xl text-start"
          >
            <div>
              {/* Banner */}
              <div
                className="relative h-28 w-full bg-neutral-950 overflow-hidden cursor-pointer"
                onClick={() => navigateToCommunity(c.slug)}
              >
                <img
                  src={c.banner}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-4 pt-0 relative">
                <div className="relative -mt-8 mb-3 flex items-end justify-between">
                  <div
                    onClick={() => navigateToCommunity(c.slug)}
                    className="w-14 h-14 rounded-xl ring-2 ring-neutral-900 overflow-hidden bg-neutral-950 shadow-md cursor-pointer"
                  >
                    <img
                      src={c.icon}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthModalOpen(true, 'login');
                        return;
                      }
                      if (c.isMember) {
                        leaveCommunity(c.slug);
                      } else {
                        joinCommunity(c.slug);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      c.isMember
                        ? 'bg-white/5 text-neutral-300 hover:bg-rose-500/20 hover:text-rose-400 border border-white/5'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    }`}
                  >
                    {c.isMember ? t.joined : `+ ${t.join}`}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div
                    onClick={() => navigateToCommunity(c.slug)}
                    className="cursor-pointer"
                  >
                    <h3 className="font-display font-bold text-base text-white hover:text-emerald-400 transition-colors">
                      {c.name}
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400/90 block">
                      {c.slug}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer metrics */}
            <div className="p-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-500" />
                <span>{c.memberCount} {t.members}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/5">
                {c.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="p-12 text-center bg-neutral-900/30 rounded-2xl border border-white/5 space-y-2">
          <p className="text-sm text-neutral-400">No communities match your search</p>
          <button
            onClick={() => setSearchFilter('')}
            className="text-xs text-emerald-400 hover:underline"
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* Create Community Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 text-start">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-base text-white">
                  {t.createCommunityTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunitySubmit} className="p-5 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.communityName} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Engineers & Builders"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.communityCategory}
                </label>
                <select
                  value={newCommCat}
                  onChange={(e) => setNewCommCat(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
                >
                  {categories.filter((c) => c !== 'الكل' && c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.communityDesc}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what this community is about..."
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-start leading-relaxed"
                />
              </div>

              {/* Upload Icon & Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {t.communityIcon}
                  </label>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-neutral-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{iconPreview ? 'Icon selected' : t.uploadIcon}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {t.communityBanner}
                  </label>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-neutral-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{bannerPreview ? 'Banner selected' : t.uploadBanner}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm shadow-md transition-colors cursor-pointer"
                >
                  {t.createCommunity}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
