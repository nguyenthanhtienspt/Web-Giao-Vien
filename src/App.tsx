/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { TabsNav } from './components/TabsNav';
import { RandomPickerTab } from './components/RandomPickerTab';
import { GroupSplitterTab } from './components/GroupSplitterTab';
import { CountdownTimerTab, ExternalTimerCommand } from './components/CountdownTimerTab';
import { ScoreboardTab } from './components/ScoreboardTab';
import { FloatingMiniTimer } from './components/FloatingMiniTimer';
import {
  TabId,
  SavedClass,
  GroupItem,
  GroupScore,
  TimerSnapshot,
  ClassMonthlyStudentScores,
  ClassMonthlyGradeDates,
} from './types';
import { classStorage } from './services/classStorage';
import {
  classroomStateStorage,
  createDefaultScoreGroups,
  convertSplitGroupsToScoreGroups,
  SCORE_GROUP_PALETTES,
  getCurrentMonthKey,
  formatMonthLabel,
  getTodayShortLabel,
} from './services/classroomStateStorage';
import { googleSheetSync } from './services/googleSheetSync';

const ClassManagerModal = lazy(() =>
  import('./components/ClassManagerModal').then((m) => ({ default: m.ClassManagerModal }))
);
const NoiseMeterModal = lazy(() =>
  import('./components/NoiseMeterModal').then((m) => ({ default: m.NoiseMeterModal }))
);
const GoogleSheetModal = lazy(() =>
  import('./components/GoogleSheetModal').then((m) => ({ default: m.GoogleSheetModal }))
);

interface StudentUndoSnapshot {
  scores: ClassMonthlyStudentScores;
  dates: ClassMonthlyGradeDates;
}

export default function App() {
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>(() => classStorage.getClasses());
  const [activeClass, setActiveClass] = useState<SavedClass | null>(() => {
    const classes = classStorage.getClasses();
    const activeId = classStorage.getActiveClassId();
    return classes.find((c) => c.id === activeId) || classes[0] || null;
  });

  const activeClassId = activeClass?.id || 'default_class';

  // Modals
  const [isClassManagerOpen, setIsClassManagerOpen] = useState<boolean>(false);
  const [isNoiseMeterOpen, setIsNoiseMeterOpen] = useState<boolean>(false);
  const [isGoogleSheetOpen, setIsGoogleSheetOpen] = useState<boolean>(false);

  // Smooth Toast notification replacing jarring browser alert()
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Google Sheet background sync status
  const [sheetSyncStatus, setSheetSyncStatus] = useState<
    'locked' | 'idle' | 'syncing' | 'synced' | 'error'
  >(() => (googleSheetSync.isReadyForSync() ? 'synced' : 'locked'));
  const debounceSyncTimerRef = useRef<number | null>(null);

  // Global states synced with active class
  const [studentCount, setStudentCount] = useState<number>(() => activeClass?.studentCount || 40);
  const [customList, setCustomList] = useState<string[]>(() =>
    activeClass?.students && activeClass.students.length > 0 ? activeClass.students : []
  );

  // Per-class Split Groups & Group Scoreboard + Undo stack
  const [splitGroups, setSplitGroups] = useState<GroupItem[]>(
    () => classroomStateStorage.getSplitGroupsForClass(activeClassId) || []
  );
  const [scoreGroups, setScoreGroups] = useState<GroupScore[]>(() =>
    classroomStateStorage.getScoreboardForClass(activeClassId)
  );
  const [scoreUndoStack, setScoreUndoStack] = useState<GroupScore[][]>([]);

  // Per-class Monthly Individual Student Scores + Dates + Undo stack
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [monthlyScores, setMonthlyScores] = useState<ClassMonthlyStudentScores>(() =>
    classroomStateStorage.getMonthlyScoresForClass(activeClassId)
  );
  const [monthlyGradeDates, setMonthlyGradeDates] = useState<ClassMonthlyGradeDates>(() =>
    classroomStateStorage.getMonthlyGradeDatesForClass(activeClassId)
  );
  const [studentScoreUndoStack, setStudentScoreUndoStack] = useState<StudentUndoSnapshot[]>([]);

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

  const reloadFromLocalStorage = () => {
    const classes = classStorage.getClasses();
    setSavedClasses(classes);
    const activeId = classStorage.getActiveClassId();
    const targetClass = classes.find((c) => c.id === activeId) || classes[0] || null;
    setActiveClass(targetClass);
    if (targetClass) {
      setStudentCount(targetClass.studentCount);
      setCustomList([...(targetClass.students || [])]);
      setSplitGroups(classroomStateStorage.getSplitGroupsForClass(targetClass.id) || []);
      setScoreGroups(classroomStateStorage.getScoreboardForClass(targetClass.id));
      setMonthlyScores(classroomStateStorage.getMonthlyScoresForClass(targetClass.id));
      setMonthlyGradeDates(classroomStateStorage.getMonthlyGradeDatesForClass(targetClass.id));
    }
  };

  useEffect(() => {
    if (googleSheetSync.isReadyForSync()) {
      setSheetSyncStatus('syncing');
      googleSheetSync.pullFromSheet().then((res) => {
        if (res.ok) {
          reloadFromLocalStorage();
          setSheetSyncStatus('synced');
        } else {
          setSheetSyncStatus('error');
        }
      });
    }
    return () => {
      if (debounceSyncTimerRef.current) window.clearTimeout(debounceSyncTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const scheduleBackgroundSheetPush = () => {
    if (!googleSheetSync.isReadyForSync() || !googleSheetSync.isAutoSyncEnabled()) {
      return;
    }
    if (debounceSyncTimerRef.current) {
      window.clearTimeout(debounceSyncTimerRef.current);
    }
    debounceSyncTimerRef.current = window.setTimeout(async () => {
      setSheetSyncStatus('syncing');
      const res = await googleSheetSync.pushToSheet();
      setSheetSyncStatus(res.ok ? 'synced' : 'error');
    }, 2500);
  };

  const refreshSheetBadge = () => {
    setSheetSyncStatus(googleSheetSync.isReadyForSync() ? 'synced' : 'locked');
  };

  useEffect(() => {
    setSplitGroups(classroomStateStorage.getSplitGroupsForClass(activeClassId) || []);
    setScoreGroups(classroomStateStorage.getScoreboardForClass(activeClassId));
    setMonthlyScores(classroomStateStorage.getMonthlyScoresForClass(activeClassId));
    setMonthlyGradeDates(classroomStateStorage.getMonthlyGradeDatesForClass(activeClassId));
    setScoreUndoStack([]);
    setStudentScoreUndoStack([]);
  }, [activeClassId]);

  const handleSelectClass = (cls: SavedClass) => {
    setActiveClass(cls);
    classStorage.setActiveClassId(cls.id);
    setStudentCount(cls.studentCount);
    setCustomList(cls.students || []);
  };

  const handleUpdateScoreGroups = (next: GroupScore[], recordUndo = true) => {
    if (recordUndo) {
      setScoreUndoStack((prev) => [...prev.slice(-19), scoreGroups]);
    }
    setScoreGroups(next);
    classroomStateStorage.saveScoreboardForClass(activeClassId, next);
    scheduleBackgroundSheetPush();
  };

  const handleUndoScore = () => {
    if (scoreUndoStack.length === 0) return;
    const previous = scoreUndoStack[scoreUndoStack.length - 1];
    setScoreUndoStack((prev) => prev.slice(0, -1));
    setScoreGroups(previous);
    classroomStateStorage.saveScoreboardForClass(activeClassId, previous);
    scheduleBackgroundSheetPush();
  };

  // Add an individual grade (0..10) + date stamp to a student's monthly record
  const handleAddStudentGrade = (
    studentName: string,
    grade: number,
    monthKey: string = selectedMonth
  ) => {
    const cleanGrade = Math.round(Math.max(0, Math.min(10, grade)) * 100) / 100;
    setStudentScoreUndoStack((prev) => [
      ...prev.slice(-29),
      { scores: monthlyScores, dates: monthlyGradeDates },
    ]);

    const monthRecord = { ...(monthlyScores[monthKey] || {}) };
    const existingGrades = [...(monthRecord[studentName] || [])];
    monthRecord[studentName] = [...existingGrades, cleanGrade];
    const nextAllMonths: ClassMonthlyStudentScores = {
      ...monthlyScores,
      [monthKey]: monthRecord,
    };

    const dateRecord = { ...(monthlyGradeDates[monthKey] || {}) };
    const existingDates = [...(dateRecord[studentName] || [])];
    while (existingDates.length < existingGrades.length) {
      existingDates.push('');
    }
    dateRecord[studentName] = [...existingDates, getTodayShortLabel()];
    const nextAllDates: ClassMonthlyGradeDates = {
      ...monthlyGradeDates,
      [monthKey]: dateRecord,
    };

    setMonthlyScores(nextAllMonths);
    setMonthlyGradeDates(nextAllDates);
    classroomStateStorage.saveMonthlyScoresForClass(activeClassId, nextAllMonths);
    classroomStateStorage.saveMonthlyGradeDatesForClass(activeClassId, nextAllDates);
    scheduleBackgroundSheetPush();
  };

  // Replace the most recently added grade for a student (prevents accidental double-grading on same turn)
  const handleReplaceLastStudentGrade = (
    studentName: string,
    newGrade: number,
    monthKey: string = selectedMonth
  ) => {
    const monthRecord = { ...(monthlyScores[monthKey] || {}) };
    const existingGrades = [...(monthRecord[studentName] || [])];
    if (existingGrades.length === 0) {
      handleAddStudentGrade(studentName, newGrade, monthKey);
      return;
    }

    const cleanGrade = Math.round(Math.max(0, Math.min(10, newGrade)) * 100) / 100;
    setStudentScoreUndoStack((prev) => [
      ...prev.slice(-29),
      { scores: monthlyScores, dates: monthlyGradeDates },
    ]);

    existingGrades[existingGrades.length - 1] = cleanGrade;
    monthRecord[studentName] = existingGrades;
    const nextAllMonths: ClassMonthlyStudentScores = {
      ...monthlyScores,
      [monthKey]: monthRecord,
    };

    setMonthlyScores(nextAllMonths);
    classroomStateStorage.saveMonthlyScoresForClass(activeClassId, nextAllMonths);
    scheduleBackgroundSheetPush();
  };

  const handleRemoveStudentGrade = (
    studentName: string,
    gradeIndex: number,
    monthKey: string = selectedMonth
  ) => {
    const monthRecord = { ...(monthlyScores[monthKey] || {}) };
    const existingGrades = [...(monthRecord[studentName] || [])];
    if (gradeIndex < 0 || gradeIndex >= existingGrades.length) return;

    setStudentScoreUndoStack((prev) => [
      ...prev.slice(-29),
      { scores: monthlyScores, dates: monthlyGradeDates },
    ]);

    existingGrades.splice(gradeIndex, 1);
    if (existingGrades.length > 0) {
      monthRecord[studentName] = existingGrades;
    } else {
      delete monthRecord[studentName];
    }
    const nextAllMonths: ClassMonthlyStudentScores = {
      ...monthlyScores,
      [monthKey]: monthRecord,
    };

    const dateRecord = { ...(monthlyGradeDates[monthKey] || {}) };
    const existingDates = [...(dateRecord[studentName] || [])];
    if (gradeIndex < existingDates.length) {
      existingDates.splice(gradeIndex, 1);
    }
    if (existingGrades.length > 0) {
      dateRecord[studentName] = existingDates;
    } else {
      delete dateRecord[studentName];
    }
    const nextAllDates: ClassMonthlyGradeDates = {
      ...monthlyGradeDates,
      [monthKey]: dateRecord,
    };

    setMonthlyScores(nextAllMonths);
    setMonthlyGradeDates(nextAllDates);
    classroomStateStorage.saveMonthlyScoresForClass(activeClassId, nextAllMonths);
    classroomStateStorage.saveMonthlyGradeDatesForClass(activeClassId, nextAllDates);
    scheduleBackgroundSheetPush();
  };

  const handleResetMonthScores = (monthKey: string) => {
    setStudentScoreUndoStack((prev) => [
      ...prev.slice(-29),
      { scores: monthlyScores, dates: monthlyGradeDates },
    ]);
    const nextAllMonths: ClassMonthlyStudentScores = {
      ...monthlyScores,
      [monthKey]: {},
    };
    const nextAllDates: ClassMonthlyGradeDates = {
      ...monthlyGradeDates,
      [monthKey]: {},
    };
    setMonthlyScores(nextAllMonths);
    setMonthlyGradeDates(nextAllDates);
    classroomStateStorage.saveMonthlyScoresForClass(activeClassId, nextAllMonths);
    classroomStateStorage.saveMonthlyGradeDatesForClass(activeClassId, nextAllDates);
    scheduleBackgroundSheetPush();
  };

  const handleUndoStudentMonthlyScore = () => {
    if (studentScoreUndoStack.length === 0) return;
    const previous = studentScoreUndoStack[studentScoreUndoStack.length - 1];
    setStudentScoreUndoStack((prev) => prev.slice(0, -1));
    setMonthlyScores(previous.scores);
    setMonthlyGradeDates(previous.dates);
    classroomStateStorage.saveMonthlyScoresForClass(activeClassId, previous.scores);
    classroomStateStorage.saveMonthlyGradeDatesForClass(activeClassId, previous.dates);
    scheduleBackgroundSheetPush();
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

  const handleSyncSplitToScoreboard = (groupsToSync: GroupItem[]) => {
    const converted = convertSplitGroupsToScoreGroups(groupsToSync, scoreGroups);
    handleUpdateScoreGroups(converted, true);
    setActiveTab('scores');
    showToast(`Đã đồng bộ ${converted.length} nhóm sang Bảng điểm!`);
  };

  const handleQuickAwardScore = (groupId: number, delta: number) => {
    const next = scoreGroups.map((g) =>
      g.id === groupId ? { ...g, score: Math.max(0, g.score + delta) } : g
    );
    handleUpdateScoreGroups(next, true);
  };

  const handleStartQuickTimer = (seconds: number) => {
    setTimerCommand({ id: Date.now(), type: 'startSeconds', seconds });
    showToast(`Đã bắt đầu đếm ngược ${seconds} giây!`);
  };

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
    scheduleBackgroundSheetPush();
    showToast(`Đã lưu danh sách ${students.length} học sinh vào "${updated.name}"!`);
  };

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
      {/* Smooth Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-emerald-500/50 shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        onOpenNoiseMeter={() => setIsNoiseMeterOpen(true)}
        sheetSyncStatus={sheetSyncStatus}
        onOpenGoogleSheet={() => setIsGoogleSheetOpen(true)}
      />

      {/* 4 Feature Tabs Navigation */}
      <TabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLightMode={isLightMode}
        scoreGroupCount={scoreGroups.length}
        isTimerRunning={timerSnapshot.isRunning}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col pb-10">
        <div className={activeTab === 'random' ? 'flex-1 flex flex-col' : 'hidden'}>
          <RandomPickerTab
            studentCount={studentCount}
            isLightMode={isLightMode}
            isActive={activeTab === 'random'}
            customList={customList}
            setCustomList={setCustomList}
            activeClass={activeClass}
            scoreGroups={scoreGroups}
            splitGroups={splitGroups}
            onQuickAwardScore={handleQuickAwardScore}
            selectedMonthLabel={formatMonthLabel(selectedMonth)}
            currentMonthStudentScores={monthlyScores[selectedMonth] || {}}
            onQuickAwardStudentScore={(stName, grade) =>
              handleAddStudentGrade(stName, grade, selectedMonth)
            }
            onReplaceLastStudentScore={(stName, newGrade) =>
              handleReplaceLastStudentGrade(stName, newGrade, selectedMonth)
            }
            onStartQuickTimer={handleStartQuickTimer}
            onQuestionBankChanged={scheduleBackgroundSheetPush}
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
            onGroupsChange={setSplitGroups}
            onUserMutate={scheduleBackgroundSheetPush}
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
            savedClasses={savedClasses}
            students={customList}
            groups={scoreGroups}
            onUpdateGroups={handleUpdateScoreGroups}
            canUndoGroups={scoreUndoStack.length > 0}
            onUndoGroups={handleUndoScore}
            onChangeGroupCount={handleChangeScoreGroupCount}
            monthlyScores={monthlyScores}
            monthlyGradeDates={monthlyGradeDates}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onAddStudentGrade={handleAddStudentGrade}
            onRemoveStudentGrade={handleRemoveStudentGrade}
            onResetMonthScores={handleResetMonthScores}
            canUndoStudentScore={studentScoreUndoStack.length > 0}
            onUndoStudentScore={handleUndoStudentMonthlyScore}
            onNotify={showToast}
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

      {/* Lazy-Loaded Modals */}
      <Suspense fallback={null}>
        {isClassManagerOpen && (
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
              scheduleBackgroundSheetPush();
            }}
            activeClass={activeClass}
            onSelectClass={handleSelectClass}
            isLightMode={isLightMode}
          />
        )}

        {isNoiseMeterOpen && (
          <NoiseMeterModal
            isOpen={isNoiseMeterOpen}
            onClose={() => setIsNoiseMeterOpen(false)}
            isLightMode={isLightMode}
          />
        )}

        {isGoogleSheetOpen && (
          <GoogleSheetModal
            isOpen={isGoogleSheetOpen}
            onClose={() => setIsGoogleSheetOpen(false)}
            isLightMode={isLightMode}
            syncStatus={sheetSyncStatus === 'locked' ? 'idle' : sheetSyncStatus}
            onAfterPull={() => {
              reloadFromLocalStorage();
              setSheetSyncStatus('synced');
              showToast('Đã đồng bộ dữ liệu từ Google Sheet thành công!');
            }}
            onSyncStateChanged={refreshSheetBadge}
          />
        )}
      </Suspense>

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
              <kbd
                className={`px-1.5 py-0.5 rounded font-mono ${
                  isLightMode ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                1–4
              </kbd>{' '}
              chuyển thẻ ·{' '}
              <kbd
                className={`px-1.5 py-0.5 rounded font-mono ${
                  isLightMode ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'
                }`}
              >
                Space / PageDown
              </kbd>{' '}
              Quay &amp; Bấm giờ
            </span>
            <span>
              {sheetSyncStatus === 'synced' ? '📊 Đã kết nối Google Sheet' : 'Lưu cục bộ trên thiết bị'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
