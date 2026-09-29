import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { MobileNav } from './components/navigation/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { SettingsModal } from './components/settings/SettingsModal';

import { FeedView } from './components/feed/FeedView';
import { CommunityDetail } from './components/communities/CommunityDetail';
import { CommunitiesExplorer } from './components/communities/CommunitiesExplorer';
import { PostDetail } from './components/posts/PostDetail';
import { CreatePostView } from './components/create/CreatePostView';
import { DirectMessagesView } from './components/messages/DirectMessagesView';
import { UserProfileView } from './components/profile/UserProfileView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SearchView } from './components/search/SearchView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 min-w-0 pb-20 lg:pb-8">
      {activeTab === 'feed' && <FeedView />}
      {activeTab === 'community-detail' && <CommunityDetail />}
      {activeTab === 'communities' && <CommunitiesExplorer />}
      {activeTab === 'post-detail' && <PostDetail />}
      {activeTab === 'create' && <CreatePostView />}
      {activeTab === 'messages' && <DirectMessagesView />}
      {activeTab === 'profile' && <UserProfileView />}
      {activeTab === 'notifications' && <NotificationsView />}
      {activeTab === 'search' && <SearchView />}
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { dir, settingsModalOpen, setSettingsModalOpen } = useApp();

  return (
    <div
      dir={dir}
      className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans selection:bg-emerald-600 selection:text-white"
    >
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main App Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <MainContent />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Modals & Dialogs */}
      <AuthModal />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
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
