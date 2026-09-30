import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  ArrowRight,
  Search,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  X,
  UserPlus
} from 'lucide-react';
import { readImageFile } from '../../utils/fileUpload';
import { GifPicker } from './GifPicker';

export const DirectMessagesView: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isInsideChat,
    setIsInsideChat,
    selectConversation,
    startConversationWithUser,
    directMessages,
    sendDirectMessage,
    currentUser,
    users,
    navigateToProfile,
    setAuthModalOpen,
    t,
    language,
    dir,
  } = useApp();

  const [messageText, setMessageText] = useState('');
  const [showMobileList, setShowMobileList] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeChatMessages = (activeConversationId && directMessages[activeConversationId]) || [];

  // Sync mobile view with isInsideChat state
  useEffect(() => {
    if (activeConv && isInsideChat) {
      setShowMobileList(false);
    } else if (!isInsideChat) {
      setShowMobileList(true);
    }
  }, [activeConv, isInsideChat]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file, 800, 0.85);
      setAttachedImage(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!messageText.trim() && !attachedImage) return;

    sendDirectMessage(messageText.trim(), attachedImage || undefined);
    setMessageText('');
    setAttachedImage(null);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.participant.displayName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const availableUsers = users.filter((u) => u.id !== currentUser?.id);
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div
      className={`flex overflow-hidden bg-neutral-950 text-start ${
        isInsideChat ? 'h-[calc(100dvh-4rem)]' : 'h-[calc(100dvh-4rem-4rem)] lg:h-[calc(100dvh-4rem)]'
      }`}
    >
      {/* Channels List */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-col border-e border-white/5 bg-neutral-950/60 backdrop-blur-md shrink-0 ${
          activeConv && !showMobileList ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* DM List Header */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{t.directMessagesTitle}</span>
            </h2>

            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalOpen(true, 'login');
                } else {
                  setIsNewChatModalOpen(true);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors cursor-pointer"
              title={t.newChat}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newChat}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t.searchFriends}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl ps-9 pe-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-0.5">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => {
                  selectConversation(conv.id);
                  setShowMobileList(false);
                  setIsInsideChat(true);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-start group cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Avatar
                  src={conv.participant.avatar}
                  alt={conv.participant.displayName}
                  size="md"
                  status={conv.participant.status}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate text-white">
                      {conv.participant.displayName}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 truncate mt-0.5 leading-snug">
                    {conv.lastMessage}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-xs text-neutral-500 space-y-2">
              <p>{t.noMessagesYet}</p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="text-emerald-400 underline block mx-auto text-xs cursor-pointer"
              >
                {t.newChat}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Chat Room */}
      <div
        className={`flex-1 flex-col bg-neutral-900/30 ${
          activeConv && !showMobileList ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConv ? (
          <>
            {/* Chat Room Top Bar */}
            <div className="h-16 border-b border-white/5 px-4 flex items-center justify-between bg-neutral-950/40">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => {
                    setShowMobileList(true);
                    setIsInsideChat(false);
                    setActiveConversationId(null);
                  }}
                  className="md:hidden p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <BackIcon className="w-5 h-5" />
                </button>

                <div
                  onClick={() => navigateToProfile(activeConv.participant.id)}
                  className="cursor-pointer"
                >
                  <Avatar
                    src={activeConv.participant.avatar}
                    alt={activeConv.participant.displayName}
                    size="sm"
                    status={activeConv.participant.status}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => navigateToProfile(activeConv.participant.id)}
                      className="font-semibold text-sm text-white hover:text-emerald-400 cursor-pointer"
                    >
                      {activeConv.participant.displayName}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      @{activeConv.participant.username}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 block -mt-0.5">
                    {activeConv.participant.customStatus || 'DZCORE Member'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigateToProfile(activeConv.participant.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.navProfile}</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="text-center py-6 border-b border-white/5 space-y-2">
                <Avatar
                  src={activeConv.participant.avatar}
                  alt={activeConv.participant.displayName}
                  size="xl"
                  className="mx-auto"
                />
                <h3 className="font-bold text-base text-white">
                  {activeConv.participant.displayName}
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  {language === 'ar'
                    ? `بداية المحادثة المباشرة مع @${activeConv.participant.username}. المحادثات خاصة وفورية ومشفرة سحابياً.`
                    : `Start of conversation with @${activeConv.participant.username}. Messages are private and synced in real-time.`}
                </p>
              </div>

              {/* Message Items */}
              {activeChatMessages.map((msg) => {
                const isMe = currentUser && msg.senderId === currentUser.id;
                const authorUser = isMe ? currentUser : activeConv.participant;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 max-w-sm sm:max-w-md ${
                      isMe ? 'ms-auto flex-row-reverse text-end' : 'me-auto text-start'
                    }`}
                  >
                    {/* User Profile Avatar - shown on both sides (sender and receiver) */}
                    <button
                      type="button"
                      onClick={() => navigateToProfile(authorUser.id)}
                      className="shrink-0 transition-transform hover:scale-105 focus:outline-none cursor-pointer"
                      title={authorUser.displayName}
                    >
                      <Avatar
                        src={authorUser.avatar}
                        alt={authorUser.displayName}
                        size="xs"
                      />
                    </button>

                    <div className={`space-y-1.5 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Attached Image or Animated GIF */}
                      {msg.mediaUrl && (
                        <div
                          onClick={() => setPreviewImage(msg.mediaUrl || null)}
                          className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-md cursor-pointer hover:border-white/25 transition-all max-w-[260px] sm:max-w-[320px] relative group"
                          title={language === 'ar' ? 'انقر لعرض الصورة بالحجم الكامل' : 'Click to view full image'}
                        >
                          <img
                            src={msg.mediaUrl}
                            alt="Attached"
                            className="w-full h-auto max-h-[420px] object-contain block bg-neutral-950/70"
                          />
                          {(msg.mediaUrl.toLowerCase().includes('.gif') || msg.mediaUrl.toLowerCase().includes('giphy')) && (
                            <span className="absolute bottom-2 start-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-emerald-400 tracking-wider pointer-events-none select-none">
                              GIF
                            </span>
                          )}
                        </div>
                      )}

                      {/* Text Bubble: Only rendered if there is text */}
                      {msg.text && (
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-xs md:text-sm leading-relaxed max-w-xs sm:max-w-sm break-words ${
                            isMe
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                              : 'bg-neutral-800 text-neutral-100 border border-white/5'
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}

                      <span className="text-[10px] text-neutral-500 font-mono block px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached Image Preview bar */}
            {attachedImage && (
              <div className="px-4 py-2 bg-neutral-900 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={attachedImage}
                    alt="Attach"
                    className="w-10 h-10 rounded-lg object-contain bg-neutral-950 border border-white/10"
                  />
                  <span className="text-xs text-neutral-300">
                    {language === 'ar' ? 'الصورة جاهزة للإرسال' : 'Ready to send image'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* GIF Picker Popover / Drawer */}
            {showGifPicker && (
              <div className="p-3 border-t border-white/5 bg-neutral-950/95 flex justify-center">
                <GifPicker
                  onSelectGif={(gifUrl) => {
                    sendDirectMessage('', gifUrl);
                    setShowGifPicker(false);
                  }}
                  onClose={() => setShowGifPicker(false)}
                />
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 md:p-4 border-t border-white/5 bg-neutral-950/60 pb-safe">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageAttach}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-neutral-400 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  title={t.attachImage}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* GIF Picker Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    showGifPicker
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border-white/10'
                  }`}
                  title={language === 'ar' ? 'إرسال صورة متحركة GIF' : 'Send animated GIF'}
                >
                  GIF
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`${t.typeMessagePlaceholder} @${activeConv.participant.username}...`}
                  className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() && !attachedImage}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  title={t.send}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              {t.directMessagesTitle}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm">
              {t.selectConversationPrompt}
            </p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              {t.newChat}
            </button>
          </div>
        )}
      </div>

      {/* New Chat Picker Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 text-start">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-base text-white">
                  {t.newChat}
                </h3>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              <p className="text-xs text-neutral-400 mb-2">
                {t.chooseMemberToChat}
              </p>

              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    startConversationWithUser(user.id);
                    setIsNewChatModalOpen(false);
                    setShowMobileList(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 hover:bg-white/5 border border-white/5 transition-all text-start group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatar}
                      alt={user.displayName}
                      size="sm"
                      status={user.status}
                    />
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {user.displayName}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        @{user.username}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-emerald-400 font-medium">
                    {t.navMessages}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 end-4 p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            alt="Full Preview"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
