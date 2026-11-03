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
import { TabId, SavedClass } from './types';
import { classStorage } from './services/classStorage';

export default function App() {
  // Saved classes state (persisted locally on device)
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>(() => classStorage.getClasses());
  const [activeClass, setActiveClass] = useState<SavedClass | null>(() => {
    const classes = classStorage.getClasses();
    const activeId = classStorage.getActiveClassId();
    return classes.find((c) => c.id === activeId) || classes[0] || null;
  });

  const [isClassManagerOpen, setIsClassManagerOpen] = useState<boolean>(false);

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
    alert(`Đã lưu danh sách ${students.length} học sinh vào "${updated.name}" thành công!`);
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
          setSavedClasses(classStorage.getClasses());
        }}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
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
            <span>Đã lưu trên thiết bị</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
