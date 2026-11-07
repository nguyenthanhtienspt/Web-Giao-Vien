/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabsNav } from './components/TabsNav';
import { RandomPickerTab } from './components/RandomPickerTab';
import { GroupSplitterTab } from './components/GroupSplitterTab';
import { CountdownTimerTab } from './components/CountdownTimerTab';
import { ScoreboardTab } from './components/ScoreboardTab';
import { ClassManagerModal } from './components/ClassManagerModal';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TabId, SavedClass } from './types';
import { classStorage, DEFAULT_CLASSES } from './services/classStorage';
import { cloudClassStorage } from './services/cloudClassStorage';

function AppContent() {
  const { user } = useAuth();

  // Saved classes state (persisted locally on device + synced to Cloud when logged in)
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>(() => classStorage.getClasses());
  const [activeClass, setActiveClass] = useState<SavedClass | null>(() => {
    const classes = classStorage.getClasses();
    const activeId = classStorage.getActiveClassId();
    return classes.find((c) => c.id === activeId) || classes[0] || null;
  });

  const [isClassManagerOpen, setIsClassManagerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Global states synced with active class
  const [studentCount, setStudentCount] = useState<number>(() => activeClass?.studentCount || 40);
  const [customList, setCustomList] = useState<string[]>(() =>
    activeClass?.students && activeClass.students.length > 0
      ? activeClass.students
      : [
          'Nguyễn Văn An',
          'Trần Thị Bình',
          'Lê Văn Cường',
          'Phạm Thị Dung',
          'Hoàng Văn Em',
          'Đỗ Thị Hoa',
          'Vũ Đình Khang',
          'Bùi Thị Linh',
          'Đặng Minh Long',
          'Ngô Phương Mai',
          'Dương Quốc Nam',
          'Lý Thu Nga',
          'Mai Tuấn Phong',
          'Đinh Hải Quân',
          'Trịnh Như Quỳnh',
          'Hồ Thanh Sơn',
        ]
  );

  const [activeTab, setActiveTab] = useState<TabId>('random');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isLightMode, setIsLightMode] = useState<boolean>(false); // Dark mode default for high contrast on projectors
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Switch active class
  const handleSelectClass = (cls: SavedClass) => {
    setActiveClass(cls);
    classStorage.setActiveClassId(cls.id);
    setStudentCount(cls.studentCount);
    if (cls.students && cls.students.length > 0) {
      setCustomList(cls.students);
    }
  };

  // Sync classes from Cloud on teacher login / reset on logout
  useEffect(() => {
    if (!user) {
      // Teacher signed out -> reset local view to default
      const defaults = classStorage.getClasses();
      setSavedClasses(defaults);
      if (defaults.length > 0) {
        handleSelectClass(defaults[0]);
      }
      return;
    }

    let isMounted = true;
    const loadCloudClasses = async () => {
      setIsSyncing(true);
      const cloudClasses = await cloudClassStorage.getClassesFromCloud(user.id);
      if (!isMounted) return;
      setIsSyncing(false);

      if (cloudClasses && cloudClasses.length > 0) {
        // Teacher has classes stored in cloud -> load their own classes
        setSavedClasses(cloudClasses);
        const activeId = classStorage.getActiveClassId();
        const currentActive = cloudClasses.find((c) => c.id === activeId) || cloudClasses[0];
        handleSelectClass(currentActive);
      } else if (cloudClasses && cloudClasses.length === 0) {
        // New account with 0 classes -> give them their own independent copy of DEFAULT_CLASSES
        const initialClasses = DEFAULT_CLASSES.map((c) => ({ ...c }));
        setIsSyncing(true);
        await cloudClassStorage.syncAllClassesToCloud(user.id, initialClasses);
        if (isMounted) {
          setSavedClasses(initialClasses);
          handleSelectClass(initialClasses[0]);
          setIsSyncing(false);
        }
      }
    };

    loadCloudClasses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Save current student list directly to active class
  const handleSaveToActiveClass = (students: string[]) => {
    if (!activeClass) return;
    const updated: SavedClass = {
      ...activeClass,
      students,
      studentCount: Math.max(activeClass.studentCount, students.length),
      updatedAt: Date.now(),
    };
    classStorage.updateClass(updated);
    setActiveClass(updated);
    setSavedClasses(classStorage.getClasses());
    setCustomList(students);
    setStudentCount(updated.studentCount);

    if (user) {
      cloudClassStorage.saveClassToCloud(user.id, updated);
    }

    alert(`Đã lưu danh sách ${students.length} học sinh vào "${updated.name}" thành công!`);
  };

  // Manual trigger to sync all local classes to Cloud
  const handleSyncToCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    const target = classStorage.getClasses();
    const ok = await cloudClassStorage.syncAllClassesToCloud(user.id, target);
    setIsSyncing(false);

    if (ok) {
      alert(`Đã đồng bộ thành công ${target.length} lớp học lên Cloud của Thầy/Cô!`);
    } else {
      alert('Không thể kết nối đến Cloud. Dữ liệu vẫn được lưu an toàn trên máy tính này.');
    }
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Sync fullscreen change event
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard number shortcuts to switch tabs: 1, 2, 3, 4
  useEffect(() => {
    // If URL has OAuth error from Google provider being disabled
    const raw = (window.location.hash || '') + (window.location.search || '');
    if (
      raw.includes('provider+is+not+enabled') ||
      raw.includes('provider_not_enabled') ||
      raw.includes('Unsupported+provider') ||
      raw.includes('validation_failed')
    ) {
      setIsAuthModalOpen(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') setActiveTab('random');
      if (e.key === '2') setActiveTab('groups');
      if (e.key === '3') setActiveTab('timer');
      if (e.key === '4') setActiveTab('scores');
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 select-none ${
        isLightMode
          ? 'bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header */}
      <Header
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        activeClass={activeClass}
        savedClasses={savedClasses}
        onSelectClass={handleSelectClass}
        onOpenClassManager={() => setIsClassManagerOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSyncToCloud={handleSyncToCloud}
        isSyncing={isSyncing}
      />

      {/* 4 Feature Tabs Navigation */}
      <TabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLightMode={isLightMode}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col pb-10">
        {activeTab === 'random' && (
          <RandomPickerTab
            studentCount={studentCount}
            isLightMode={isLightMode}
            customList={customList}
            setCustomList={setCustomList}
            activeClass={activeClass}
            onOpenClassManager={() => setIsClassManagerOpen(true)}
            onSaveToActiveClass={handleSaveToActiveClass}
          />
        )}

        {activeTab === 'groups' && (
          <GroupSplitterTab
            studentCount={studentCount}
            isLightMode={isLightMode}
            customList={customList}
          />
        )}

        {activeTab === 'timer' && (
          <CountdownTimerTab isLightMode={isLightMode} />
        )}

        {activeTab === 'scores' && (
          <ScoreboardTab isLightMode={isLightMode} />
        )}
      </main>

      {/* Class Manager Modal */}
      <ClassManagerModal
        isOpen={isClassManagerOpen}
        onClose={() => {
          setIsClassManagerOpen(false);
          const current = classStorage.getClasses();
          setSavedClasses(current);
          if (user) {
            cloudClassStorage.syncAllClassesToCloud(user.id, current);
          }
        }}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
        isLightMode={isLightMode}
      />

      {/* Teacher Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isLightMode={isLightMode}
      />

      {/* Quiet Projector Footer */}
      <footer className={`py-2 px-6 border-t text-center text-xs transition-colors ${
        isLightMode 
          ? 'bg-white border-slate-200 text-slate-500' 
          : 'bg-slate-900/60 border-slate-800 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            Trợ lý Lớp học THCS · Dành cho giáo viên trình chiếu màn hình lớn
          </span>
          <div className="flex items-center gap-4">
            <span>Phím tắt nhanh: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">4</kbd> chuyển thẻ · <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Space</kbd> Thao tác</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>{user ? 'Đã kết nối Cloud' : 'Lưu cục bộ trên thiết bị'}</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
