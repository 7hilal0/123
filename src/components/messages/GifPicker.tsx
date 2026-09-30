import React, { useState, useMemo } from 'react';
import { Search, X, Sparkles, Link, Flame, Smile, ThumbsUp, PartyPopper, Gamepad2, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface GifItem {
  id: string;
  title: string;
  category: string;
  url: string;
  tags: string[];
}

const CURATED_GIFS: GifItem[] = [
  // Trending / Reactions
  {
    id: 'g_trend_1',
    title: 'Thumbs Up Approval',
    category: 'thumbs',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    tags: ['thumbs', 'up', 'ok', 'good', 'agree', 'نعم', 'تمام', 'ممتاز', 'موافق'],
  },
  {
    id: 'g_trend_2',
    title: 'Laughing Dog',
    category: 'funny',
    url: 'https://media.giphy.com/media/10JhviFuU2BQZ2/giphy.gif',
    tags: ['laugh', 'lol', 'funny', 'dog', 'ضحك', 'هههه', 'نكتة'],
  },
  {
    id: 'g_trend_3',
    title: 'Excited Minion',
    category: 'party',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    tags: ['party', 'happy', 'excited', 'minion', 'فرح', 'احتفال', 'سعادة'],
  },
  {
    id: 'g_trend_4',
    title: 'Shocked Cat',
    category: 'cats',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    tags: ['cat', 'shocked', 'wow', 'قطة', 'مياو', 'صدمة', 'واو'],
  },
  {
    id: 'g_trend_5',
    title: 'Jonah Hill Screaming Yes',
    category: 'trending',
    url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
    tags: ['yes', 'excited', 'celebrate', 'نعم', 'حماس'],
  },

  // Funny / Laugh
  {
    id: 'g_fun_1',
    title: 'Crying Laughing',
    category: 'funny',
    url: 'https://media.giphy.com/media/ltIFdjNAas3VvPKGd8/giphy.gif',
    tags: ['laugh', 'cry', 'dead', 'lol', 'موت ضحك', 'كركر', 'مسخرة'],
  },
  {
    id: 'g_fun_2',
    title: 'Elmo Fire Crazy',
    category: 'funny',
    url: 'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif',
    tags: ['fire', 'crazy', 'burn', 'حريق', 'جنون'],
  },
  {
    id: 'g_fun_3',
    title: 'Side Eye Dog',
    category: 'funny',
    url: 'https://media.giphy.com/media/B0vFTrb0ZGDf2/giphy.gif',
    tags: ['sus', 'side eye', 'doubt', 'شك', 'نظرة'],
  },
  {
    id: 'g_fun_4',
    title: 'Mr Bean Smirk',
    category: 'funny',
    url: 'https://media.giphy.com/media/mFdnWF1RTI7M9v0DZf/giphy.gif',
    tags: ['bean', 'smirk', 'funny', 'مستر بين', 'ابتسامة'],
  },

  // Hello / Wave
  {
    id: 'g_wave_1',
    title: 'Baby Yoda Wave',
    category: 'hello',
    url: 'https://media.giphy.com/media/ASd0Ukj0BCcYU/giphy.gif',
    tags: ['hello', 'wave', 'hi', 'yoda', 'مرحبا', 'أهلا', 'سلام'],
  },
  {
    id: 'g_wave_2',
    title: 'Forrest Gump Wave',
    category: 'hello',
    url: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    tags: ['wave', 'hello', 'bye', 'سلام عليكم', 'باي'],
  },
  {
    id: 'g_wave_3',
    title: 'Peanuts Snoopy Dance',
    category: 'hello',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    tags: ['snoopy', 'dance', 'happy', 'رقص', 'فرحان'],
  },

  // Thumbs Up / OK
  {
    id: 'g_th_1',
    title: 'Leonardo DiCaprio Cheers',
    category: 'thumbs',
    url: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
    tags: ['cheers', 'gatsby', 'salute', 'تحية', 'كفو', 'أحسنت'],
  },
  {
    id: 'g_th_2',
    title: 'Chuck Norris Approved',
    category: 'thumbs',
    url: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif',
    tags: ['thumbs', 'chuck norris', 'yes', 'موافق', 'صح'],
  },
  {
    id: 'g_th_3',
    title: 'Iron Man Nod',
    category: 'thumbs',
    url: 'https://media.giphy.com/media/AbYxDs20DECQw/giphy.gif',
    tags: ['nod', 'ironman', 'respect', 'احترام', 'تمام'],
  },

  // Gaming
  {
    id: 'g_game_1',
    title: 'Gamer Victory',
    category: 'gaming',
    url: 'https://media.giphy.com/media/M33UV4zy92Am7NUUob/giphy.gif',
    tags: ['game', 'victory', 'winner', 'فوز', 'قيمر', 'لعبة'],
  },
  {
    id: 'g_game_2',
    title: 'Mario Level Clear',
    category: 'gaming',
    url: 'https://media.giphy.com/media/atQF1zaSGqBTW/giphy.gif',
    tags: ['mario', 'nintendo', 'clear', 'ماريو'],
  },
  {
    id: 'g_game_3',
    title: 'Rage Quit Keyboard',
    category: 'gaming',
    url: 'https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif',
    tags: ['rage', 'keyboard', 'smash', 'غضب', 'تكسير'],
  },

  // Cats & Cute
  {
    id: 'g_cat_1',
    title: 'Keyboard Cat Bongo',
    category: 'cats',
    url: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
    tags: ['bongo', 'cat', 'music', 'قطوة', 'طبل'],
  },
  {
    id: 'g_cat_2',
    title: 'Cat Typing Fast',
    category: 'cats',
    url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
    tags: ['typing', 'working', 'hacker', 'شغال', 'برمجة'],
  },
  {
    id: 'g_cat_3',
    title: 'Cat Vibing Jam',
    category: 'cats',
    url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif',
    tags: ['vibe', 'jam', 'vibing', 'طرب', 'روقان'],
  },

  // Love / Hearts
  {
    id: 'g_love_1',
    title: 'Hearts Explosion',
    category: 'love',
    url: 'https://media.giphy.com/media/R6gVNROjGP4UM/giphy.gif',
    tags: ['love', 'heart', 'hug', 'حب', 'قلب', 'شكرا'],
  },
  {
    id: 'g_love_2',
    title: 'Heart Eyes Cat',
    category: 'love',
    url: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif',
    tags: ['eyes', 'cute', 'sweet', 'جميل', 'حلو'],
  },

  // Algeria / DZ
  {
    id: 'g_dz_1',
    title: 'One Two Three Viva L Algerie',
    category: 'dz',
    url: 'https://media.giphy.com/media/3ohhwkIX21yGqW3gpa/giphy.gif',
    tags: ['algeria', 'dz', 'flag', 'الجزائر', 'فيفا', 'الخضرا', 'محرز'],
  },
];

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const categories = [
    { id: 'all', label: language === 'ar' ? '🔥 الشائع' : '🔥 Trending', icon: Flame },
    { id: 'funny', label: language === 'ar' ? '😂 ضحك' : '😂 Funny', icon: Smile },
    { id: 'hello', label: language === 'ar' ? '👋 ترحيب' : '👋 Hello', icon: Sparkles },
    { id: 'thumbs', label: language === 'ar' ? '👍 تمام' : '👍 Thumbs Up', icon: ThumbsUp },
    { id: 'party', label: language === 'ar' ? '🎉 احتفال' : '🎉 Party', icon: PartyPopper },
    { id: 'gaming', label: language === 'ar' ? '🎮 ألعاب' : '🎮 Gaming', icon: Gamepad2 },
    { id: 'cats', label: language === 'ar' ? '🐱 قطط' : '🐱 Cats', icon: Smile },
    { id: 'love', label: language === 'ar' ? '❤️ قلوب' : '❤️ Love', icon: Heart },
    { id: 'dz', label: language === 'ar' ? '🇩🇿 الجزائر' : '🇩🇿 Algeria', icon: Flame },
  ];

  const filteredGifs = useMemo(() => {
    return CURATED_GIFS.filter((gif) => {
      const matchesCategory = activeCategory === 'all' || gif.category === activeCategory;
      if (!searchQuery.trim()) return matchesCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        gif.title.toLowerCase().includes(q) ||
        gif.tags.some((tag) => tag.toLowerCase().includes(q));

      return matchesQuery && (activeCategory === 'all' || matchesCategory);
    });
  }, [searchQuery, activeCategory]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelectGif(customUrl.trim());
      onClose();
    }
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md h-[400px] animate-in fade-in zoom-in-95 z-50">
      {/* Top Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between gap-2 bg-neutral-950/70">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
            GIF
          </span>
          <span className="text-xs font-semibold text-neutral-200">
            {language === 'ar' ? 'صور متحركة' : 'Animated GIFs'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              showUrlInput
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border-white/10'
            }`}
            title={language === 'ar' ? 'إدخال رابط GIF خارجي' : 'Paste GIF URL'}
          >
            <Link className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">
              {language === 'ar' ? 'رابط' : 'URL'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL Input Bar (Collapsible) */}
      {showUrlInput && (
        <form onSubmit={handleCustomSubmit} className="p-2.5 bg-neutral-950 border-b border-white/5 flex gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder={language === 'ar' ? 'الصق رابط الصورة المتحركة (https://...gif)' : 'Paste direct .gif URL...'}
            className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={!customUrl.trim()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
          >
            {language === 'ar' ? 'إرسال' : 'Send'}
          </button>
        </form>
      )}

      {/* Search Bar */}
      <div className="p-2.5 border-b border-white/5 bg-neutral-900/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن GIF أو رد فعل...' : 'Search GIF reactions, memes...'}
            className="w-full bg-neutral-950/80 border border-white/10 rounded-xl ps-8 pe-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="px-2 py-1.5 border-b border-white/5 bg-neutral-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* GIFs Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 bg-neutral-950/20">
        {filteredGifs.map((gif) => (
          <button
            key={gif.id}
            type="button"
            onClick={() => {
              onSelectGif(gif.url);
              onClose();
            }}
            className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-emerald-500/60 transition-all cursor-pointer aspect-video flex items-center justify-center"
          >
            <img
              src={gif.url}
              alt={gif.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-[11px] text-white font-medium truncate drop-shadow-sm">
                {gif.title}
              </span>
            </div>
          </button>
        ))}

        {filteredGifs.length === 0 && (
          <div className="col-span-2 py-12 text-center text-xs text-neutral-500 space-y-1">
            <p>{language === 'ar' ? 'لم يتم العثور على أي GIF بهذا الاسم' : 'No GIFs found for this search'}</p>
            <p className="text-[11px] text-neutral-600">
              {language === 'ar' ? 'جرب كلمات أخرى أو الصق رابط GIF مباشر' : 'Try another query or paste a direct GIF link'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
