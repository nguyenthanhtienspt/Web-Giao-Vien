import React from 'react';
import { Dice5, Users2, Timer, Trophy } from 'lucide-react';
import { TabId } from '../types';

interface TabsNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isLightMode: boolean;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  setActiveTab,
  isLightMode,
}) => {
  const tabs = [
    {
      id: 'random' as TabId,
      number: '1',
      label: 'CHỌN NGẪU NHIÊN',
      icon: Dice5,
      accentColor: 'indigo',
    },
    {
      id: 'groups' as TabId,
      number: '2',
      label: 'CHIA NHÓM NHANH',
      icon: Users2,
      accentColor: 'emerald',
    },
    {
      id: 'timer' as TabId,
      number: '3',
      label: 'ĐỒNG HỒ ĐẾM NGƯỢC',
      icon: Timer,
      accentColor: 'amber',
    },
    {
      id: 'scores' as TabId,
      number: '4',
      label: 'BẢNG ĐIỂM 8 NHÓM',
      icon: Trophy,
      accentColor: 'rose',
    },
  ];

  return (
    <nav className="w-full px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 p-1.5 rounded-2xl border ${
          isLightMode 
            ? 'bg-slate-100 border-slate-200' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2.5 py-3 px-3 sm:px-4 rounded-xl font-display font-bold text-sm sm:text-base tracking-wide transition-all duration-200 whitespace-nowrap active:scale-[0.98] ${
                  isActive
                    ? isLightMode
                      ? 'bg-white text-indigo-900 shadow-md border-b-4 border-indigo-600 scale-[1.01]'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-b-4 border-indigo-400 scale-[1.01]'
                    : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive 
                    ? isLightMode ? 'bg-indigo-100 text-indigo-700' : 'bg-white/20 text-white' 
                    : isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
