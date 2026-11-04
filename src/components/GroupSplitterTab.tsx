import React, { useState, useEffect } from 'react';
import { Users2, Shuffle, Star, Copy, Check, Sparkles, Maximize2, X, Hash, FileText, Crown, GripVertical } from 'lucide-react';
import { GroupItem } from '../types';
import { soundManager } from '../services/sound';

interface GroupSplitterTabProps {
  studentCount: number;
  isLightMode: boolean;
  customList: string[];
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
];

export const GroupSplitterTab: React.FC<GroupSplitterTabProps> = ({
  studentCount,
  isLightMode,
  customList,
}) => {
  // Source choice: numbers (1-N) or customList
  const [sourceType, setSourceType] = useState<'numbers' | 'customList'>('numbers');
  const [groupCount, setGroupCount] = useState<number>(8);
  const [assignLeader, setAssignLeader] = useState<boolean>(true);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [spotlightGroup, setSpotlightGroup] = useState<GroupItem | null>(null);

  // Drag and drop states for moving student cards between groups
  const [draggedMember, setDraggedMember] = useState<{
    member: number | string;
    sourceGroupId: number;
  } | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);

  // Helper to split items into groups
  const performSplit = () => {
    soundManager.playWheelTick(1.2);

    // Source elements
    let pool: (number | string)[] = [];
    if (sourceType === 'numbers') {
      pool = Array.from({ length: studentCount }, (_, i) => i + 1);
    } else {
      pool = [...customList];
    }

    if (pool.length === 0) return;

    // Shuffle with Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Distribute into groupCount groups
    const newGroups: GroupItem[] = Array.from({ length: groupCount }, (_, i) => {
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
      const targetGroup = index % groupCount;
      newGroups[targetGroup].members.push(item);
    });

    // Sort member items for clean readability
    newGroups.forEach((g) => {
      if (sourceType === 'numbers') {
        g.members.sort((a, b) => (a as number) - (b as number));
      }
      if (assignLeader && g.members.length > 0) {
        const randomLeaderIndex = Math.floor(Math.random() * g.members.length);
        g.leader = g.members[randomLeaderIndex];
      }
    });

    setGroups(newGroups);
    soundManager.playWinner();
  };

  // Re-run split when parameters change
  useEffect(() => {
    performSplit();
  }, [studentCount, groupCount, sourceType]);

  // Sync spotlightGroup when groups change
  useEffect(() => {
    if (spotlightGroup) {
      const found = groups.find((g) => g.id === spotlightGroup.id);
      if (found) setSpotlightGroup(found);
    }
  }, [groups]);

  // Move a member from source group to target group
  const moveMemberToGroup = (
    member: number | string,
    sourceGroupId: number,
    targetGroupId: number
  ) => {
    if (sourceGroupId === targetGroupId) return;

    setGroups((prevGroups) => {
      return prevGroups.map((group) => {
        if (group.id === sourceGroupId) {
          const nextMembers = group.members.filter((m) => m !== member);
          const nextLeader = group.leader === member ? undefined : group.leader;
          return {
            ...group,
            members: nextMembers,
            leader: nextLeader,
          };
        }
        if (group.id === targetGroupId) {
          if (group.members.includes(member)) return group;
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
      });
    });

    soundManager.playPointAdd();
  };

  // Drag & drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    member: number | string,
    sourceGroupId: number
  ) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ member, sourceGroupId })
    );
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

    if (!member || sourceGroupId === undefined) {
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
        const isCurrentLeader = g.leader === member;
        return {
          ...g,
          leader: isCurrentLeader ? undefined : member,
        };
      })
    );
    soundManager.playPointAdd();
  };

  const handleSelectLeaderDropdown = (
    groupId: number,
    selectedValue: string
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (!selectedValue) {
          return { ...g, leader: undefined };
        }
        const found = g.members.find((m) => String(m) === selectedValue);
        return {
          ...g,
          leader: found !== undefined ? found : undefined,
        };
      })
    );
    soundManager.playPointAdd();
  };

  const handleCopy = () => {
    if (groups.length === 0) return;
    const countLabel = sourceType === 'numbers' ? `${studentCount} học sinh` : `${customList.length} mục`;
    const textLines = [
      `DANH SÁCH CHIA ${groups.length} NHÓM (${countLabel}):`,
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

  const totalPoolSize = sourceType === 'numbers' ? studentCount : customList.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* Control Panel */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col gap-4 ${
        isLightMode 
          ? 'bg-white border-slate-200 shadow-sm' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-4 sm:gap-6">
            {/* Source selector: Numbers vs Custom List */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700">
              <button
                onClick={() => setSourceType('numbers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'numbers'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Số thứ tự (1–{studentCount})</span>
              </button>
              <button
                onClick={() => setSourceType('customList')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'customList'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Danh sách tên nhập ({customList.length} em)</span>
              </button>
            </div>

            {/* Group count selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">Số nhóm:</span>
              <div className="flex items-center gap-1">
                {[4, 6, 8, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setGroupCount(count)}
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

              {/* Custom group adjust */}
              <div className="flex items-center ml-1 border border-slate-700 rounded-lg p-0.5">
                <button
                  onClick={() => setGroupCount(Math.max(2, groupCount - 1))}
                  className="w-7 h-7 flex items-center justify-center font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-bold text-indigo-400">{groupCount}</span>
                <button
                  onClick={() => setGroupCount(Math.min(12, groupCount + 1))}
                  className="w-7 h-7 flex items-center justify-center font-bold text-slate-400 hover:text-white cursor-pointer"
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
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                Chọn nhóm trưởng ⭐
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border cursor-pointer ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Sao chép danh sách vào bộ nhớ đệm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
            </button>

            <button
              onClick={performSplit}
              className="px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black font-display text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <Shuffle className="w-5 h-5" />
              <span>CHIA LẠI NGẪU NHIÊN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Kicker & Teacher Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-400 px-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Chia ngẫu nhiên <strong className="text-white font-bold">{totalPoolSize} {sourceType === 'numbers' ? 'học sinh' : 'mục'}</strong> thành <strong className="text-white font-bold">{groups.length} nhóm</strong>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>
            Trung bình ~{Math.floor(totalPoolSize / groups.length)}–{Math.ceil(totalPoolSize / groups.length)} thành viên / nhóm
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full w-fit">
          <GripVertical className="w-3.5 h-3.5" />
          <span>Kéo thả thẻ học sinh để đổi nhóm • Bấm 👑 để chọn nhóm trưởng</span>
        </div>
      </div>

      {/* 8 Groups Grid (Optimized for Projector) */}
      <div className={`grid gap-4 sm:gap-5 ${
        groups.length <= 4 
          ? 'grid-cols-1 md:grid-cols-2' 
          : groups.length <= 8 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {groups.map((group) => {
          const isDragOver = dragOverGroupId === group.id;

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
              <div className={`px-4 py-3 flex items-center justify-between text-white ${
                group.id === 1 ? 'bg-blue-600' :
                group.id === 2 ? 'bg-emerald-600' :
                group.id === 3 ? 'bg-amber-600' :
                group.id === 4 ? 'bg-rose-600' :
                group.id === 5 ? 'bg-purple-600' :
                group.id === 6 ? 'bg-cyan-600' :
                group.id === 7 ? 'bg-orange-600' :
                group.id === 8 ? 'bg-pink-600' : 'bg-indigo-600'
              }`}>
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

              {/* Group Member Numbers / Names */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="flex flex-wrap gap-2 items-center min-h-[50px]">
                  {group.members.map((member, idx) => {
                    const isLeader = group.leader === member;
                    const isNumber = typeof member === 'number';
                    const isBeingDragged =
                      draggedMember?.member === member &&
                      draggedMember?.sourceGroupId === group.id;

                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, member, group.id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative rounded-xl font-display font-black flex items-center gap-1.5 transition-all select-none cursor-grab active:cursor-grabbing hover:scale-105 ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed' : ''
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
                              : 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-750'
                        }`}
                        title="Kéo thả sang nhóm khác hoặc bấm biểu tượng vương miện để chọn nhóm trưởng"
                      >
                        <GripVertical className="w-3 h-3 opacity-30 group-hover:opacity-80 transition-opacity -ml-0.5" />
                        <span className={isNumber ? 'tabular-nums' : 'truncate max-w-[130px]'}>
                          {member}
                        </span>
                        
                        {/* Quick Crown button to toggle leader */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLeader(group.id, member);
                          }}
                          className={`p-1 rounded-full transition-transform hover:scale-125 cursor-pointer ${
                            isLeader 
                              ? 'text-amber-500 bg-amber-400/20' 
                              : 'text-slate-400 opacity-40 hover:opacity-100 hover:text-amber-400'
                          }`}
                          title={isLeader ? 'Hủy nhóm trưởng' : 'Đặt làm nhóm trưởng'}
                        >
                          <Crown className={`w-3.5 h-3.5 ${isLeader ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Visual Drop Target Placeholder */}
                  {isDragOver && (
                    <div className="w-full py-2 border-2 border-dashed border-indigo-400 rounded-xl bg-indigo-500/10 text-center text-xs font-bold text-indigo-300 animate-pulse">
                      📥 Thả học sinh vào đây
                    </div>
                  )}
                </div>

                {/* Footer with Group Leader Selector */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
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
                      <option key={idx} value={String(m)}>
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
          <div className={`w-full max-w-2xl rounded-3xl border-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
            isLightMode ? 'bg-white border-indigo-500' : 'bg-slate-900 border-indigo-400'
          }`}>
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
              <p className="text-xs text-amber-400 mb-6">
                💡 Bấm trực tiếp vào thành viên để đặt hoặc đổi Nhóm trưởng 👑
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 my-6">
                {spotlightGroup.members.map((member, idx) => {
                  const isLeader = spotlightGroup.leader === member;
                  const isNumber = typeof member === 'number';

                  return (
                    <button
                      type="button"
                      key={idx}
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
                      title={isLeader ? 'Bấm để hủy nhóm trưởng' : 'Bấm để chọn làm nhóm trưởng'}
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
