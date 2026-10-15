import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ChatProvider, useChat } from './context/ChatContext.js';
import { SidebarHeader } from './components/SidebarHeader.js';
import { ChatList } from './components/ChatList.js';
import { ChatWindow } from './components/ChatWindow.js';
import { AuthModal } from './components/AuthModal.js';
import { NewChatModal } from './components/NewChatModal.js';
import { NewGroupModal } from './components/NewGroupModal.js';
import { ProfileSettingsModal } from './components/ProfileSettingsModal.js';
import { EmailInboxModal } from './components/EmailInboxModal.js';
import { VerifyEmailModal } from './components/VerifyEmailModal.js';

function MainChatInterface() {
  const { user, isLoading } = useAuth();
  const { activeConversationId, setActiveConversationId, verifyEmail } = useChat() as any;

  // Global modals
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmailInbox, setShowEmailInbox] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#efeae2] dark:bg-[#0b141a]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Loading EchoChat...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthModal
        onEmailVerificationNeeded={() => {
          setShowVerifyModal(true);
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
      {/* Unverified Email Warning Banner */}
      {!user.isEmailVerified && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-xs font-medium flex items-center justify-between shadow-xs z-30 select-none">
          <div className="flex items-center gap-2 truncate">
            <span>⚠️ Your email ({user.email}) is not yet verified.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowEmailInbox(true)}
              className="underline text-[11px] font-semibold hover:text-black"
            >
              Check Test Inbox
            </button>
            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-black transition-colors"
            >
              Enter Code
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Chat Layout Container */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto md:my-3 md:rounded-2xl md:shadow-2xl md:border md:border-slate-200/80 md:dark:border-slate-800">
        {/* Left Sidebar (Chat List) */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#111b21] shrink-0 ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <SidebarHeader
            onOpenNewChat={() => setShowNewChat(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenEmailInbox={() => setShowEmailInbox(true)}
            onOpenVerifyModal={() => setShowVerifyModal(true)}
          />
          <ChatList onSelectConversation={(id) => setActiveConversationId(id)} />
        </div>

        {/* Right Panel (Active Chat Window) */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0b141a] ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatWindow onBackToSidebar={() => setActiveConversationId(null)} />
        </div>
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onOpenNewGroup={() => {
            setShowNewChat(false);
            setShowNewGroup(true);
          }}
        />
      )}

      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} />
      )}

      {showSettings && (
        <ProfileSettingsModal
          onClose={() => setShowSettings(false)}
          onOpenVerifyModal={() => setShowVerifyModal(true)}
        />
      )}

      {showEmailInbox && (
        <EmailInboxModal
          onClose={() => setShowEmailInbox(false)}
          onApplyVerificationCode={(code) => {
            setShowVerifyModal(true);
          }}
        />
      )}

      {showVerifyModal && (
        <VerifyEmailModal
          onClose={() => setShowVerifyModal(false)}
          onOpenEmailInbox={() => {
            setShowVerifyModal(false);
            setShowEmailInbox(true);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MainChatInterface />
      </ChatProvider>
    </AuthProvider>
  );
}
