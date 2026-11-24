import React, { useState, useEffect } from 'react';
import { Users2, Shuffle, Star, Copy, Check, Maximize2, X, Hash, FileText, Crown, GripVertical, Trophy, ArrowRightLeft } from 'lucide-react';
import { GroupItem } from '../types';
import { soundManager } from '../services/sound';
import { classroomStateStorage } from '../services/classroomStateStorage';

interface GroupSplitterTabProps {
  studentCount: number;
  isLightMode: boolean;
  customList: string[];
  activeClassId?: string;
  absentStudents?: string[];
  onGroupsChange?: (groups: GroupItem[]) => void;
  onUserMutate?: () => void;
  onSyncToScoreboard?: (groups: GroupItem[]) => void;
}

const GROUP_PALETTES = [
  { name: 'Xanh dương', color: 'indigo', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', headerBg: 'bg-blue-600' },
  { name: 'Xanh lá', color: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', headerBg: 'bg-emerald-600' },
  { name: 'Hổ phách', color: 'amber', border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', headerBg: 'bg-amber-600' },
  { name: 'Hồng đỏ', color: 'rose', border: 'border-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', headerBg: 'bg-rose-600' },
  { name: 'Tím mộng', color: 'purple', border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', headerBg: 'bg-purple-600' },
  { name: 'Lam ngọc', color: 'cyan', border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-500', headerBg: 'bg-cyan-600' },
  { name: 'Cam cháy', color: 'orange', border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500', headerBg: 'bg-orange-600' },
  { name: 'Hồng phấn', color: 'pink', border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-500', headerBg: 'bg-pink-600' },
  { name: 'Chanh', color: 'lime', border: 'border-lime-500', bg: 'bg-lime-500/10', text: 'text-lime-500', headerBg: 'bg-lime-600' },
  { name: 'Xích thổ', color: 'teal', border: 'border-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-500', headerBg: 'bg-teal-600' },
  { name: 'Chàm', color: 'indigo', border: 'border-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-500', headerBg: 'bg-indigo-600' },
  { name: 'Tím hồng', color: 'fuchsia', border: 'border-fuchsia-500', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500', headerBg: 'bg-fuchsia-600' },
];

export const GroupSplitterTab: React.FC<GroupSplitterTabProps> = ({
  studentCount,
  isLightMode,
  customList,
  activeClassId = 'default_class',
  absentStudents = [],
  onGroupsChange,
  onUserMutate,
  onSyncToScoreboard,
}) => {
  const [sourceType, setSourceType] = useState<'numbers' | 'customList'>(() =>
    customList.length > 0 ? 'customList' : 'numbers'
  );
  const [groupCount, setGroupCount] = useState<number>(() => {
    const saved = classroomStateStorage.getSplitGroupsForClass(activeClassId);
    return saved ? saved.length : 8;
  });
  const [assignLeader, setAssignLeader] = useState<boolean>(true);
  const [groups, setGroups] = useState<GroupItem[]>(
    () => classroomStateStorage.getSplitGroupsForClass(activeClassId) || []
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [syncedNotice, setSyncedNotice] = useState<boolean>(false);
  const [spotlightGroup, setSpotlightGroup] = useState<GroupItem | null>(null);

  // Drag and drop states
  const [draggedMember, setDraggedMember] = useState<{
    member: number | string;
    sourceGroupId: number;
  } | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);

  // Touch / Smartboard tap-to-move state
  const [touchMoveTarget, setTouchMoveTarget] = useState<{
    member: number | string;
    sourceGroupId: number;
  } | null>(null);

  const presentCustomList = customList.filter((s) => !absentStudents.includes(s));
  const presentNumbers = Array.from({ length: studentCount }, (_, i) => i + 1).filter(
    (n) => !absentStudents.includes(customList[n - 1] || '')
  );

  // Helper to split items into groups
  const performSplit = (
    overrideCount = groupCount,
    overrideSource = sourceType,
    playSound = true
  ) => {
    if (playSound) soundManager.playWheelTick(1.2);

    const pool: (number | string)[] =
      overrideSource === 'numbers' ? [...presentNumbers] : [...presentCustomList];

    if (pool.length === 0) {
      setGroups([]);
      return;
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const newGroups: GroupItem[] = Array.from({ length: overrideCount }, (_, i) => {
      const palette = GROUP_PALETTES[i % GROUP_PALETTES.length];
      return {
        id: i + 1,
        name: `Nhóm ${i + 1}`,
        color: palette.color,
        borderColor: palette.border,
        bgColor: palette.bg,
        textColor: palette.text,
        members: [],
      };
    });

    pool.forEach((item, index) => {
      const targetGroup = index % overrideCount;
      newGroups[targetGroup].members.push(item);
    });

    newGroups.forEach((g) => {
      if (overrideSource === 'numbers') {
        g.members.sort((a, b) => (a as number) - (b as number));
      }
      if (assignLeader && g.members.length > 0) {
        const randomLeaderIndex = Math.floor(Math.random() * g.members.length);
        g.leader = g.members[randomLeaderIndex];
      }
    });

    setGroups(newGroups);
    setTouchMoveTarget(null);
    classroomStateStorage.saveSplitGroupsForClass(activeClassId, newGroups);
    if (playSound) {
      soundManager.playWinner();
      onUserMutate?.();
    }
  };

  // Load saved groups when switching classes; only auto-split if class has none saved
  useEffect(() => {
    const saved = classroomStateStorage.getSplitGroupsForClass(activeClassId);
    if (saved && saved.length > 0) {
      setGroups(saved);
      setGroupCount(saved.length);
      const firstMember = saved.find((g) => g.members.length > 0)?.members[0];
      if (typeof firstMember === 'string') setSourceType('customList');
      else if (typeof firstMember === 'number') setSourceType('numbers');
    } else {
      const nextSource = customList.length > 0 ? 'customList' : 'numbers';
      setSourceType(nextSource);
      performSplit(groupCount, nextSource, false);
    }
    setTouchMoveTarget(null);
  }, [activeClassId]);

  // If current class list changes (e.g. edited roster or attendance changed), filter out absent students from current groups or split if empty
  useEffect(() => {
    if (groups.length === 0) {
      performSplit(groupCount, sourceType, false);
      return;
    }
    if (absentStudents.length > 0) {
      setGroups((prev) =>
        prev.map((g) => {
          const filtered = g.members.filter((m) => {
            if (typeof m === 'string') return !absentStudents.includes(m);
            const name = customList[m - 1] || '';
            return !absentStudents.includes(name);
          });
          return {
            ...g,
            members: filtered,
            leader: g.leader !== undefined && filtered.includes(g.leader) ? g.leader : filtered[0],
          };
        })
      );
    }
  }, [absentStudents]);

  // Persist & notify parent whenever groups change
  useEffect(() => {
    if (groups.length > 0) {
      classroomStateStorage.saveSplitGroupsForClass(activeClassId, groups);
    }
    onGroupsChange?.(groups);
    if (spotlightGroup) {
      const found = groups.find((g) => g.id === spotlightGroup.id);
      if (found) setSpotlightGroup(found);
    }
  }, [groups]);

  const handleChangeGroupCount = (nextCount: number) => {
    const clamped = Math.max(2, Math.min(12, nextCount));
    setGroupCount(clamped);
    performSplit(clamped, sourceType, true);
  };

  const handleChangeSourceType = (nextSource: 'numbers' | 'customList') => {
    setSourceType(nextSource);
    performSplit(groupCount, nextSource, true);
  };

  // Move a member from source group to target group
  const moveMemberToGroup = (
    member: number | string,
    sourceGroupId: number,
    targetGroupId: number
  ) => {
    if (sourceGroupId === targetGroupId) return;

    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === sourceGroupId) {
          const idx = group.members.indexOf(member);
          const nextMembers =
            idx === -1
              ? group.members
              : [...group.members.slice(0, idx), ...group.members.slice(idx + 1)];
          const nextLeader =
            group.leader === member && !nextMembers.includes(member)
              ? undefined
              : group.leader;
          return {
            ...group,
            members: nextMembers,
            leader: nextLeader,
          };
        }
        if (group.id === targetGroupId) {
          if (sourceType === 'numbers' && group.members.includes(member)) return group;
          const nextMembers = [...group.members, member];
          if (sourceType === 'numbers') {
            nextMembers.sort((a, b) => (a as number) - (b as number));
          }
          return {
            ...group,
            members: nextMembers,
          };
        }
        return group;
      })
    );

    setTouchMoveTarget(null);
    soundManager.playPointAdd();
    onUserMutate?.();
  };

  // Drag & drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    member: number | string,
    sourceGroupId: number
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ member, sourceGroupId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedMember({ member, sourceGroupId });
  };

  const handleDragOver = (e: React.DragEvent, targetGroupId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== targetGroupId) {
      setDragOverGroupId(targetGroupId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetGroupId: number) => {
    const related = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget || !related || !currentTarget.contains(related)) {
      if (dragOverGroupId === targetGroupId) {
        setDragOverGroupId(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: number) => {
    e.preventDefault();
    setDragOverGroupId(null);

    let member = draggedMember?.member;
    let sourceGroupId = draggedMember?.sourceGroupId;

    if (member === undefined || sourceGroupId === undefined) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          member = parsed.member;
          sourceGroupId = parsed.sourceGroupId;
        }
      } catch {
        // ignore
      }
    }

    if (member !== undefined && sourceGroupId !== undefined) {
      moveMemberToGroup(member, sourceGroupId, targetGroupId);
    }
    setDraggedMember(null);
  };

  const handleDragEnd = () => {
    setDraggedMember(null);
    setDragOverGroupId(null);
  };

  // Teacher manual leader selection
  const handleToggleLeader = (groupId: number, member: number | string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          leader: g.leader === member ? undefined : member,
        };
      })
    );
    soundManager.playPointAdd();
    onUserMutate?.();
  };

  const handleSelectLeaderDropdown = (groupId: number, selectedValue: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (!selectedValue) return { ...g, leader: undefined };
        const found = g.members.find((m) => String(m) === selectedValue);
        return {
          ...g,
          leader: found !== undefined ? found : undefined,
        };
      })
    );
    soundManager.playPointAdd();
    onUserMutate?.();
  };

  const handleCopy = () => {
    if (groups.length === 0) return;
    const total = groups.reduce((acc, g) => acc + g.members.length, 0);
    const textLines = [
      `DANH SÁCH CHIA ${groups.length} NHÓM (${total} học sinh):`,
      ...groups.map(
        (g) =>
          `${g.name} (${g.members.length} em): ${g.members.join(', ')}${
            g.leader ? ` [Nhóm trưởng: ${g.leader}]` : ''
          }`
      ),
    ];
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncScoreboardClick = () => {
    if (!onSyncToScoreboard || groups.length === 0) return;
    onSyncToScoreboard(groups);
    soundManager.playWinner();
    setSyncedNotice(true);
    setTimeout(() => setSyncedNotice(false), 2500);
  };

  const totalPoolSize =
    sourceType === 'numbers' ? presentNumbers.length : presentCustomList.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5">
      {/* Control Panel */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border flex flex-col gap-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-3 sm:gap-5">
            {/* Source selector */}
            <div
              className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <button
                onClick={() => handleChangeSourceType('numbers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'numbers'
                    ? 'bg-indigo-600 text-white shadow'
                    : isLightMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Số (1–{studentCount})</span>
              </button>
              <button
                onClick={() => handleChangeSourceType('customList')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'customList'
                    ? 'bg-emerald-600 text-white shadow'
                    : isLightMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Danh sách tên ({presentCustomList.length} em)</span>
              </button>
            </div>

            {/* Group count selector */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Số nhóm:
              </span>
              <div className="flex items-center gap-1">
                {[4, 6, 8, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleChangeGroupCount(count)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-display font-black text-sm sm:text-base transition-all cursor-pointer ${
                      groupCount === count
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : isLightMode
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div
                className={`flex items-center ml-1 border rounded-lg p-0.5 ${
                  isLightMode ? 'border-slate-300 bg-slate-50' : 'border-slate-700'
                }`}
              >
                <button
                  onClick={() => handleChangeGroupCount(groupCount - 1)}
                  className="w-7 h-7 flex items-center justify-center font-bold text-slate-400 hover:text-indigo-500 cursor-pointer"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-bold text-indigo-500">{groupCount}</span>
                <button
                  onClick={() => handleChangeGroupCount(groupCount + 1)}
                  className="w-7 h-7 flex items-center justify-center font-bold text-slate-400 hover:text-indigo-500 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Toggle Leader */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold">
              <input
                type="checkbox"
                checked={assignLeader}
                onChange={(e) => setAssignLeader(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                Tự chọn nhóm trưởng
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {onSyncToScoreboard && (
              <button
                onClick={handleSyncScoreboardClick}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                  syncedNotice
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                    : isLightMode
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                }`}
                title="Đồng bộ số nhóm và tên Nhóm trưởng sang Bảng điểm thi đua"
              >
                <Trophy className="w-4 h-4" />
                <span>{syncedNotice ? 'Đã đưa sang Bảng điểm!' : 'Đưa sang Bảng điểm'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border cursor-pointer ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Sao chép danh sách vào bộ nhớ đệm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
            </button>

            <button
              onClick={() => performSplit(groupCount, sourceType, true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black font-display text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <Shuffle className="w-5 h-5" />
              <span>CHIA LẠI NGẪU NHIÊN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Kicker & Touch/Drag Hint */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm px-2 ${
          isLightMode ? 'text-slate-600' : 'text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Chia{' '}
            <strong className={isLightMode ? 'text-slate-900 font-black' : 'text-white font-bold'}>
              {totalPoolSize} học sinh có mặt
            </strong>{' '}
            thành{' '}
            <strong className={isLightMode ? 'text-slate-900 font-black' : 'text-white font-bold'}>
              {groups.length} nhóm
            </strong>
            {absentStudents.length > 0 && (
              <span className="text-rose-500 font-bold ml-1">(Đã trừ {absentStudents.length} HS vắng)</span>
            )}
          </span>
          <span className="hidden sm:inline opacity-50">•</span>
          <span>
            ~{groups.length > 0 ? Math.floor(totalPoolSize / groups.length) : 0}–
            {groups.length > 0 ? Math.ceil(totalPoolSize / groups.length) : 0} em/nhóm
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full w-fit border font-semibold ${
            isLightMode
              ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
              : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30'
          }`}
        >
          <GripVertical className="w-3.5 h-3.5" />
          <span>Kéo thả chuột hoặc chạm tên trên Tivi cảm ứng để đổi nhóm • Bấm 👑 chọn trưởng nhóm</span>
        </div>
      </div>

      {/* Groups Grid */}
      <div
        className={`grid gap-4 sm:gap-5 ${
          groups.length <= 4
            ? 'grid-cols-1 md:grid-cols-2'
            : groups.length <= 8
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}
      >
        {groups.map((group) => {
          const isDragOver = dragOverGroupId === group.id;
          const palette = GROUP_PALETTES[(group.id - 1) % GROUP_PALETTES.length];
          const activeMoveInThisGroup =
            touchMoveTarget && touchMoveTarget.sourceGroupId === group.id ? touchMoveTarget : null;

          return (
            <div
              key={group.id}
              onDragOver={(e) => handleDragOver(e, group.id)}
              onDragLeave={(e) => handleDragLeave(e, group.id)}
              onDrop={(e) => handleDrop(e, group.id)}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 flex flex-col ${
                isDragOver
                  ? 'ring-4 ring-indigo-500 scale-[1.02] border-indigo-400 bg-indigo-950/30'
                  : isLightMode
                    ? 'bg-white shadow-md border-slate-300 hover:border-slate-400'
                    : 'bg-slate-900/90 shadow-xl border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Group Header */}
              <div className={`px-4 py-3 flex items-center justify-between text-white ${palette.headerBg}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center font-black font-display text-sm">
                    {group.id}
                  </div>
                  <h4 className="font-black font-display text-lg tracking-wide uppercase">
                    {group.name}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {group.members.length} em
                  </span>
                  <button
                    onClick={() => setSpotlightGroup(group)}
                    className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                    title="Phóng to nhóm này lên máy chiếu"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Members */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="flex flex-wrap gap-2 items-center min-h-[50px]">
                  {group.members.map((member, idx) => {
                    const isLeader = group.leader === member;
                    const isNumber = typeof member === 'number';
                    const isBeingDragged =
                      draggedMember?.member === member && draggedMember?.sourceGroupId === group.id;
                    const isSelectedForTouchMove =
                      touchMoveTarget?.member === member && touchMoveTarget?.sourceGroupId === group.id;

                    return (
                      <div
                        key={`${String(member)}_${idx}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, member, group.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() =>
                          setTouchMoveTarget(
                            isSelectedForTouchMove ? null : { member, sourceGroupId: group.id }
                          )
                        }
                        className={`group relative rounded-xl font-display font-black flex items-center gap-1.5 transition-all select-none cursor-grab active:cursor-grabbing hover:scale-105 ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed' : ''
                        } ${
                          isSelectedForTouchMove ? 'ring-2 ring-indigo-500 scale-105' : ''
                        } ${
                          isNumber
                            ? 'px-3 py-1.5 text-xl sm:text-2xl'
                            : 'px-2.5 py-1.5 text-xs sm:text-sm font-sans font-bold'
                        } ${
                          isLeader
                            ? isLightMode
                              ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 ring-2 ring-amber-300/50 shadow-md'
                              : 'bg-amber-950/80 text-amber-300 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                            : isLightMode
                              ? 'bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200'
                              : 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Kéo thả chuột hoặc chạm để chuyển sang nhóm khác"
                      >
                        <GripVertical className="w-3 h-3 opacity-35 group-hover:opacity-80 transition-opacity -ml-0.5" />
                        <span className={isNumber ? 'tabular-nums' : 'truncate max-w-[135px]'}>
                          {member}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLeader(group.id, member);
                          }}
                          className={`p-1 rounded-full transition-transform hover:scale-125 cursor-pointer ${
                            isLeader
                              ? 'text-amber-500 bg-amber-400/20'
                              : 'text-slate-400 opacity-45 hover:opacity-100 hover:text-amber-400'
                          }`}
                          title={isLeader ? 'Hủy nhóm trưởng' : 'Đặt làm nhóm trưởng'}
                        >
                          <Crown className={`w-3.5 h-3.5 ${isLeader ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>
                    );
                  })}

                  {isDragOver && (
                    <div className="w-full py-2 border-2 border-dashed border-indigo-400 rounded-xl bg-indigo-500/10 text-center text-xs font-bold text-indigo-400 animate-pulse">
                      📥 Thả học sinh vào đây
                    </div>
                  )}
                </div>

                {/* Touch / Smartboard Quick Move Bar */}
                {activeMoveInThisGroup && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 animate-in fade-in duration-150 ${
                      isLightMode
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                        : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold">
                      <span className="flex items-center gap-1 truncate">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">Chuyển &ldquo;{activeMoveInThisGroup.member}&rdquo; sang:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setTouchMoveTarget(null)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {groups
                        .filter(( targetG ) => targetG.id !== group.id)
                        .map((targetG) => (
                          <button
                            key={targetG.id}
                            type="button"
                            onClick={() =>
                              moveMemberToGroup(
                                activeMoveInThisGroup.member,
                                group.id,
                                targetG.id
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] cursor-pointer active:scale-95"
                          >
                            N.{targetG.id}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Footer with Group Leader Selector */}
                <div
                  className={`pt-2 border-t flex items-center justify-between gap-2 text-xs ${
                    isLightMode ? 'border-slate-200' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-amber-500 min-w-fit">
                    <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>Trưởng nhóm:</span>
                  </div>
                  <select
                    value={group.leader !== undefined ? String(group.leader) : ''}
                    onChange={(e) => handleSelectLeaderDropdown(group.id, e.target.value)}
                    className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer truncate ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-slate-200 focus:bg-slate-700'
                    }`}
                  >
                    <option value="">-- Chưa chọn --</option>
                    {group.members.map((m, idx) => (
                      <option key={`${String(m)}_${idx}`} value={String(m)}>
                        {typeof m === 'number' ? `Số ${m}` : m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spotlight Group Modal */}
      {spotlightGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl border-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white border-indigo-500 text-slate-900' : 'bg-slate-900 border-indigo-400 text-white'
            }`}
          >
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users2 className="w-8 h-8" />
                <h3 className="text-3xl font-black font-display uppercase tracking-wider">
                  {spotlightGroup.name} · {spotlightGroup.members.length} THÀNH VIÊN
                </h3>
              </div>
              <button
                onClick={() => setSpotlightGroup(null)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 sm:p-12 text-center">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                DANH SÁCH THÀNH VIÊN TRONG NHÓM
              </span>
              <p className="text-xs text-amber-500 font-bold mb-6">
                💡 Bấm trực tiếp vào thành viên để đặt hoặc đổi Nhóm trưởng 👑
              </p>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 my-6">
                {spotlightGroup.members.map((member, idx) => {
                  const isLeader = spotlightGroup.leader === member;
                  const isNumber = typeof member === 'number';

                  return (
                    <button
                      type="button"
                      key={`${String(member)}_${idx}`}
                      onClick={() => handleToggleLeader(spotlightGroup.id, member)}
                      className={`relative rounded-2xl font-black font-display shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                        isNumber
                          ? 'px-8 py-6 text-5xl sm:text-7xl tabular-nums'
                          : 'px-6 py-4 text-xl sm:text-2xl font-sans'
                      } ${
                        isLeader
                          ? 'bg-amber-400 text-amber-950 ring-8 ring-amber-300'
                          : isLightMode
                            ? 'bg-slate-100 text-slate-900 border-2 border-slate-300 hover:border-amber-400'
                            : 'bg-slate-800 text-white border-2 border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isLeader && <Crown className="w-6 h-6 fill-amber-950 text-amber-950 inline-block" />}
                        <span>{member}</span>
                      </div>
                      {isLeader && (
                        <span className="absolute -top-3 -right-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shadow">
                          Nhóm trưởng
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setSpotlightGroup(null)}
                className="mt-6 px-8 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg cursor-pointer"
              >
                Đóng chế độ phóng to
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
