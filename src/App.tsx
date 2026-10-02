import React, { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { MobileNav } from './components/navigation/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { FeedView } from './components/feed/FeedView';

const SettingsView = lazy(() => import('./components/settings/SettingsView').then((module) => ({ default: module.SettingsView })));
const CommunityDetail = lazy(() => import('./components/communities/CommunityDetail').then((module) => ({ default: module.CommunityDetail })));
const CommunitiesExplorer = lazy(() => import('./components/communities/CommunitiesExplorer').then((module) => ({ default: module.CommunitiesExplorer })));
const PostDetail = lazy(() => import('./components/posts/PostDetail').then((module) => ({ default: module.PostDetail })));
const CreatePostView = lazy(() => import('./components/create/CreatePostView').then((module) => ({ default: module.CreatePostView })));
const DirectMessagesView = lazy(() => import('./components/messages/DirectMessagesView').then((module) => ({ default: module.DirectMessagesView })));
const UserProfileView = lazy(() => import('./components/profile/UserProfileView').then((module) => ({ default: module.UserProfileView })));
const NotificationsView = lazy(() => import('./components/notifications/NotificationsView').then((module) => ({ default: module.NotificationsView })));
const SearchView = lazy(() => import('./components/search/SearchView').then((module) => ({ default: module.SearchView })));

const ScreenLoader: React.FC = () => (
  <div className="min-h-[40vh] grid place-items-center text-neutral-500">
    <div className="h-7 w-7 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
  </div>
);

const MainContent: React.FC = () => {
  const { activeTab, isInsideChat, currentUser } = useApp();

  return (
    <main
      className={`flex-1 min-w-0 w-full ${
        isInsideChat
          ? 'pb-0'
          : activeTab === 'messages'
          ? 'pb-16 md:pb-0'
          : 'pb-24 md:pb-12'
      }`}
      style={activeTab === 'profile' ? { backgroundColor: `${currentUser?.profileColor || '#10b981'}12` } : undefined}
    >
      {activeTab === 'feed' && <FeedView />}
      <Suspense fallback={<ScreenLoader />}>
        {activeTab === 'community-detail' && <CommunityDetail />}
        {activeTab === 'communities' && <CommunitiesExplorer />}
        {activeTab === 'post-detail' && <PostDetail />}
        {activeTab === 'create' && <CreatePostView />}
        {activeTab === 'messages' && <DirectMessagesView />}
        {activeTab === 'profile' && <UserProfileView />}
        {activeTab === 'notifications' && <NotificationsView />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'settings' && <SettingsView />}
      </Suspense>
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { dir, isInsideChat } = useApp();

  return (
    <div
      dir={dir}
      className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex font-sans selection:bg-emerald-600 selection:text-white"
    >
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main App Shell */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <TopBar />
        <MainContent />
      </div>

      {/* Mobile Navigation - Hidden when inside a conversation with someone */}
      {!isInsideChat && <MobileNav />}

      {/* Modals & Dialogs */}
      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
