/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabsNav } from './components/TabsNav';
import { RandomPickerTab } from './components/RandomPickerTab';
import { GroupSplitterTab } from './components/GroupSplitterTab';
import { CountdownTimerTab, ExternalTimerCommand } from './components/CountdownTimerTab';
import { ScoreboardTab } from './components/ScoreboardTab';
import { ClassManagerModal } from './components/ClassManagerModal';
import { AttendanceModal } from './components/AttendanceModal';
import { NoiseMeterModal } from './components/NoiseMeterModal';
import { FloatingMiniTimer } from './components/FloatingMiniTimer';
import { TabId, SavedClass, GroupItem, GroupScore, TimerSnapshot } from './types';
import { classStorage } from './services/classStorage';
import {
  classroomStateStorage,
  createDefaultScoreGroups,
  convertSplitGroupsToScoreGroups,
  SCORE_GROUP_PALETTES,
} from './services/classroomStateStorage';

export default function App() {
  // Saved classes state (persisted locally on device)
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>(() => classStorage.getClasses());
  const [activeClass, setActiveClass] = useState<SavedClass | null>(() => {
    const classes = classStorage.getClasses();
    const activeId = classStorage.getActiveClassId();
    return classes.find((c) => c.id === activeId) || classes[0] || null;
  });

  const activeClassId = activeClass?.id || 'default_class';

  // Modals
  const [isClassManagerOpen, setIsClassManagerOpen] = useState<boolean>(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState<boolean>(false);
  const [isNoiseMeterOpen, setIsNoiseMeterOpen] = useState<boolean>(false);

  // Global states synced with active class
  const [studentCount, setStudentCount] = useState<number>(() => activeClass?.studentCount || 40);
  const [customList, setCustomList] = useState<string[]>(() =>
    activeClass?.students && activeClass.students.length > 0 ? activeClass.students : []
  );

  // Per-class Attendance (Absent students)
  const [absentStudents, setAbsentStudents] = useState<string[]>(() =>
    classroomStateStorage.getAbsentForClass(activeClassId)
  );

  // Per-class Split Groups & Scoreboard + Undo stack
  const [splitGroups, setSplitGroups] = useState<GroupItem[]>(
    () => classroomStateStorage.getSplitGroupsForClass(activeClassId) || []
  );
  const [scoreGroups, setScoreGroups] = useState<GroupScore[]>(() =>
    classroomStateStorage.getScoreboardForClass(activeClassId)
  );
  const [scoreUndoStack, setScoreUndoStack] = useState<GroupScore[][]>([]);

  // Timer snapshot & external commands for FloatingMiniTimer / Quick Question Timer
  const [timerSnapshot, setTimerSnapshot] = useState<TimerSnapshot>({
    timeLeft: 300,
    initialDuration: 300,
    isRunning: false,
    isTimeUp: false,
  });
  const [timerCommand, setTimerCommand] = useState<ExternalTimerCommand | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('random');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Reload per-class states when activeClassId changes
  useEffect(() => {
    setAbsentStudents(classroomStateStorage.getAbsentForClass(activeClassId));
    setSplitGroups(classroomStateStorage.getSplitGroupsForClass(activeClassId) || []);
    setScoreGroups(classroomStateStorage.getScoreboardForClass(activeClassId));
    setScoreUndoStack([]);
  }, [activeClassId]);

  // Switch active class
  const handleSelectClass = (cls: SavedClass) => {
    setActiveClass(cls);
    classStorage.setActiveClassId(cls.id);
    setStudentCount(cls.studentCount);
    setCustomList(cls.students || []);
  };

  // Update absent list for active class
  const handleChangeAbsent = (nextAbsent: string[]) => {
    setAbsentStudents(nextAbsent);
    classroomStateStorage.saveAbsentForClass(activeClassId, nextAbsent);
  };

  // Update scoreboard for active class (with optional Undo history)
  const handleUpdateScoreGroups = (next: GroupScore[], recordUndo = true) => {
    if (recordUndo) {
      setScoreUndoStack((prev) => [...prev.slice(-19), scoreGroups]);
    }
    setScoreGroups(next);
    classroomStateStorage.saveScoreboardForClass(activeClassId, next);
  };

  const handleUndoScore = () => {
    if (scoreUndoStack.length === 0) return;
    const previous = scoreUndoStack[scoreUndoStack.length - 1];
    setScoreUndoStack((prev) => prev.slice(0, -1));
    setScoreGroups(previous);
    classroomStateStorage.saveScoreboardForClass(activeClassId, previous);
  };

  const handleChangeScoreGroupCount = (count: number) => {
    const safeCount = Math.max(2, Math.min(12, count));
    if (safeCount === scoreGroups.length) return;
    const next: GroupScore[] = Array.from({ length: safeCount }, (_, i) => {
      const existing = scoreGroups[i];
      if (existing) return existing;
      const p = SCORE_GROUP_PALETTES[i % SCORE_GROUP_PALETTES.length];
      return {
        id: i + 1,
        name: `Nhóm ${i + 1}`,
        score: 0,
        color: p.color,
        badgeColor: p.badgeColor,
      };
    });
    handleUpdateScoreGroups(next.length > 0 ? next : createDefaultScoreGroups(8), true);
  };

  // 1-Click Sync from GroupSplitterTab to ScoreboardTab
  const handleSyncSplitToScoreboard = (groupsToSync: GroupItem[]) => {
    const converted = convertSplitGroupsToScoreGroups(groupsToSync, scoreGroups);
    handleUpdateScoreGroups(converted, true);
    setActiveTab('scores');
  };

  // Quick +1/+2 score award from RandomPickerTab
  const handleQuickAwardScore = (groupId: number, delta: number) => {
    const next = scoreGroups.map((g) =>
      g.id === groupId ? { ...g, score: Math.max(0, g.score + delta) } : g
    );
    handleUpdateScoreGroups(next, true);
  };

  // Quick start countdown timer (e.g. 30s / 60s for answering a question)
  const handleStartQuickTimer = (seconds: number) => {
    setTimerCommand({ id: Date.now(), type: 'startSeconds', seconds });
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
      if (e.ctrlKey || e.metaKey || e.altKey) return;
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
        isLightMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
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
        absentCount={absentStudents.length}
        onOpenAttendance={() => setIsAttendanceOpen(true)}
        onOpenNoiseMeter={() => setIsNoiseMeterOpen(true)}
      />

      {/* 4 Feature Tabs Navigation */}
      <TabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLightMode={isLightMode}
        scoreGroupCount={scoreGroups.length}
        isTimerRunning={timerSnapshot.isRunning}
      />

      {/* Main Tab Content — All 4 tabs remain mounted so timers, split groups, and picked students persist seamlessly */}
      <main className="flex-1 flex flex-col pb-12">
        <div className={activeTab === 'random' ? 'flex-1 flex flex-col' : 'hidden'}>
          <RandomPickerTab
            studentCount={studentCount}
            isLightMode={isLightMode}
            isActive={activeTab === 'random'}
            customList={customList}
            setCustomList={setCustomList}
            activeClass={activeClass}
            absentStudents={absentStudents}
            scoreGroups={scoreGroups}
            splitGroups={splitGroups}
            onQuickAwardScore={handleQuickAwardScore}
            onStartQuickTimer={handleStartQuickTimer}
            onOpenClassManager={() => setIsClassManagerOpen(true)}
            onSaveToActiveClass={handleSaveToActiveClass}
          />
        </div>

        <div className={activeTab === 'groups' ? 'flex-1 flex flex-col' : 'hidden'}>
          <GroupSplitterTab
            studentCount={studentCount}
            isLightMode={isLightMode}
            customList={customList}
            activeClassId={activeClassId}
            absentStudents={absentStudents}
            onGroupsChange={setSplitGroups}
            onSyncToScoreboard={handleSyncSplitToScoreboard}
          />
        </div>

        <div className={activeTab === 'timer' ? 'flex-1 flex flex-col' : 'hidden'}>
          <CountdownTimerTab
            isLightMode={isLightMode}
            isActive={activeTab === 'timer'}
            onSnapshotChange={setTimerSnapshot}
            externalCommand={timerCommand}
          />
        </div>

        <div className={activeTab === 'scores' ? 'flex-1 flex flex-col' : 'hidden'}>
          <ScoreboardTab
            isLightMode={isLightMode}
            isActive={activeTab === 'scores'}
            activeClassName={activeClass?.name}
            groups={scoreGroups}
            onUpdateGroups={handleUpdateScoreGroups}
            canUndo={scoreUndoStack.length > 0}
            onUndo={handleUndoScore}
            onChangeGroupCount={handleChangeScoreGroupCount}
          />
        </div>
      </main>

      {/* Floating Mini-Timer when teacher is on another tab */}
      {activeTab !== 'timer' && (
        <FloatingMiniTimer
          snapshot={timerSnapshot}
          onTogglePlayPause={() => setTimerCommand({ id: Date.now(), type: 'toggle' })}
          onReset={() => setTimerCommand({ id: Date.now(), type: 'reset' })}
          onOpenTimerTab={() => setActiveTab('timer')}
          isLightMode={isLightMode}
        />
      )}

      {/* Class Manager Modal */}
      <ClassManagerModal
        isOpen={isClassManagerOpen}
        onClose={() => {
          setIsClassManagerOpen(false);
          const refreshed = classStorage.getClasses();
          setSavedClasses(refreshed);
          if (activeClass) {
            const latestActive = refreshed.find((c) => c.id === activeClass.id);
            if (latestActive) {
              setActiveClass(latestActive);
              setStudentCount(latestActive.studentCount);
              setCustomList(latestActive.students || []);
            } else if (refreshed.length > 0) {
              handleSelectClass(refreshed[0]);
            }
          }
        }}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
        isLightMode={isLightMode}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        activeClass={activeClass}
        students={customList}
        absentStudents={absentStudents}
        onChangeAbsent={handleChangeAbsent}
        isLightMode={isLightMode}
      />

      {/* Classroom Noise Meter Modal / Floating Pill */}
      <NoiseMeterModal
        isOpen={isNoiseMeterOpen}
        onClose={() => setIsNoiseMeterOpen(false)}
        isLightMode={isLightMode}
      />

      {/* Quiet Projector Footer */}
      <footer
        className={`py-2 px-6 border-t text-center text-xs transition-colors ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-600'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Trợ lý Lớp học THCS · Dành cho giáo viên trình chiếu màn hình lớn</span>
          <div className="flex items-center gap-4">
            <span>
              Phím tắt:{' '}
              <kbd className={`px-1.5 py-0.5 rounded font-mono ${isLightMode ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'}`}>
                1–4
              </kbd>{' '}
              chuyển thẻ ·{' '}
              <kbd className={`px-1.5 py-0.5 rounded font-mono ${isLightMode ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'}`}>
                Space / PageDown
              </kbd>{' '}
              Thao tác
            </span>
            <span>Đã lưu trên thiết bị</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
