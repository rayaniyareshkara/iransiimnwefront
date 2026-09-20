/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../router';
import {
  LayoutDashboard,
  DollarSign,
  Wifi,
  Truck,
  ShoppingBag,
  Tag,
  Settings,
  FileText,
  Users,
  BarChart3,
  Menu,
  X,
  Store,
  Bell,
  ChevronLeft,
  UserCheck,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { title: 'داشبورد', path: '/admin', icon: LayoutDashboard },
  { title: 'مدیریت قیمت‌ها', path: '/admin/pricing', icon: DollarSign },
  { title: 'بسته‌های اینترنت', path: '/admin/packages', icon: Wifi },
  { title: 'روش‌های ارسال', path: '/admin/shipping', icon: Truck },
  { title: 'سفارش‌ها', path: '/admin/orders', icon: ShoppingBag },
  { title: 'کدهای تخفیف', path: '/admin/discounts', icon: Tag },
  { title: 'تنظیمات فروشگاه', path: '/admin/settings', icon: Settings },
  { title: 'مدیریت محتوا', path: '/admin/content', icon: FileText },
  { title: 'کاربران پنل', path: '/admin/users', icon: Users },
  { title: 'گزارش‌ها و آمار', path: '/admin/reports', icon: BarChart3 },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
}) => {
  const { path, navigate } = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleNavClick = (destPath: string) => {
    navigate(destPath);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-['Vazirmatn',sans-serif]">
      {/* Desktop Sidebar (RTL Right side) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-l border-slate-800 flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              IR
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">پنل مدیریت فروشگاه</div>
              <div className="text-xs text-slate-400">نمایندگی رسمی ایرانسل</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? path === '/admin'
                : path.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 truncate">{item.title}</span>
                {isActive && <ChevronLeft className="w-3.5 h-3.5 text-blue-200" />}
              </button>
            );
          })}
        </nav>

        {/* Return to Customer Store button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 rounded-lg transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            مشاهده سایت مشتری (Store)
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              IR
            </div>
            <span className="font-bold text-sm text-white">پنل مدیریت ایران‌سیم</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? path === '/admin'
                : path.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => handleNavClick('/')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 bg-amber-400/10 rounded-lg"
          >
            <Store className="w-3.5 h-3.5" />
            مشاهده سایت مشتری
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">
                {pageTitle || 'داشبورد مدیریت'}
              </h2>
              {pageSubtitle && (
                <p className="text-xs text-slate-400 hidden sm:block">{pageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>فروشگاه اصلی</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">مدیر سیستم</div>
                <div className="text-[10px] text-slate-400">Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
