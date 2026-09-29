import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import {
  Bell,
  CheckCheck,
  ArrowBigUp,
  MessageSquare,
  UserPlus,
  Compass,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { NotificationType } from '../../types';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    navigateToPost,
    navigateToProfile,
    navigateToCommunity,
    navigateToFeed,
    t,
    dir,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => (filter === 'all' ? true : !n.isRead));

  const handleItemClick = (n: typeof notifications[0]) => {
    markNotificationRead(n.id);
    if (n.targetType === 'post') {
      navigateToPost(n.targetId);
    } else if (n.targetType === 'profile') {
      navigateToProfile(n.targetId);
    } else if (n.targetType === 'community') {
      navigateToCommunity(n.targetId);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'upvote':
        return <ArrowBigUp className="w-4 h-4 text-emerald-500 fill-current" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-teal-400" />;
      case 'community':
        return <Compass className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 text-start">
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
            <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span>{t.navNotifications}</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Track interactions, upvotes, and replies on your activity.
            </p>
          </div>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mark all read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-neutral-800 text-white ring-1 ring-white/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-neutral-800 text-white ring-1 ring-white/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Unread
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-neutral-900/40 border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`p-4 flex items-start gap-3.5 hover:bg-white/5 transition-colors cursor-pointer text-start ${
              !item.isRead ? 'bg-emerald-950/15' : ''
            }`}
          >
            <div className="relative shrink-0">
              <Avatar
                src={item.actor.avatar}
                alt={item.actor.displayName}
                size="md"
              />
              <div className="absolute -bottom-1 -end-1 p-0.5 rounded-full bg-neutral-900 ring-2 ring-neutral-950">
                {getIcon(item.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">
                  {item.title}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {item.timestamp}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                {item.message}
              </p>
            </div>

            {!item.isRead && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-center" />
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-xs text-neutral-500">
            No notifications in this filter.
          </div>
        )}
      </div>
    </div>
  );
};
