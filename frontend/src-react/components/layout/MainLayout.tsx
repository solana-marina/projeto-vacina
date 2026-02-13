import React from 'react';
import {
  Activity,
  Calendar,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  ShieldAlert,
  Syringe,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ROLE_LABELS } from '../../lib/constants';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/api';
import { Button } from '../ui/core';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  section: 'Operação' | 'Monitoramento';
  testId?: string;
}

const PATH_LABELS: Record<string, string> = {
  admin: 'Admin',
  school: 'Escola',
  health: 'Saúde',
  students: 'Estudantes',
  student: 'Estudante',
  schools: 'Escolas',
  users: 'Usuários',
  schedule: 'Calendário',
  dashboards: 'Dashboards',
  monitoring: 'Auditoria e Logs',
  pending: 'Pendências',
  search: 'Busca Ativa',
  auth: 'Autenticação',
  login: 'Login',
};

const MENU_BY_ROLE: Record<UserRole, MenuItem[]> = {
  ADMIN: [
    { label: 'Estudantes', path: '/admin/students', icon: Users, section: 'Operação', testId: 'admin-nav-students' },
    { label: 'Escolas', path: '/admin/schools', icon: School, section: 'Operação' },
    { label: 'Usuários', path: '/admin/users', icon: ShieldAlert, section: 'Operação', testId: 'admin-nav-users' },
    { label: 'Calendário', path: '/admin/schedule', icon: Calendar, section: 'Operação', testId: 'admin-nav-schedule' },
    { label: 'Dashboards', path: '/admin/dashboards', icon: LayoutDashboard, section: 'Monitoramento', testId: 'admin-nav-dashboards' },
    { label: 'Auditoria e logs', path: '/admin/monitoring', icon: ClipboardList, section: 'Monitoramento', testId: 'admin-nav-monitoring' },
  ],
  ESCOLA: [
    { label: 'Estudantes', path: '/school/students', icon: Users, section: 'Operação' },
    { label: 'Pendências', path: '/school/pending', icon: FileSearch, section: 'Monitoramento', testId: 'school-go-pending' },
  ],
  SAUDE: [
    { label: 'Busca ativa', path: '/health/search', icon: FileSearch, section: 'Operação' },
    { label: 'Dashboards', path: '/health/dashboards', icon: Activity, section: 'Monitoramento', testId: 'health-go-dashboards' },
  ],
};

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export function MainLayout({ children, currentPath }: MainLayoutProps) {
  const { session, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  if (!session) {
    return null;
  }

  const menuItems = MENU_BY_ROLE[session.role] ?? [];
  const operationItems = menuItems.filter((item) => item.section === 'Operação');
  const monitoringItems = menuItems.filter((item) => item.section === 'Monitoramento');

  const renderMenuItems = (items: MenuItem[]) =>
    items.map((item) => {
      const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
      return (
        <button
          key={item.path}
          data-testid={item.testId}
          onClick={() => {
            navigate(item.path);
            setIsMobileMenuOpen(false);
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive ? 'bg-[#0B5D7A]/10 text-[#0B5D7A]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#0B5D7A]',
          )}
        >
          <item.icon className={cn('h-5 w-5', isActive ? 'text-[#0B5D7A]' : 'text-gray-400')} />
          {item.label}
        </button>
      );
    });

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex font-sans text-slate-800">
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      ) : null}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#0B5D7A]">
            <Syringe className="h-6 w-6" />
            <span className="font-poppins font-bold text-lg tracking-tight">Projeto de Vacinação Contra o HPV</span>
          </div>
        </div>

        <div className="p-4 space-y-5">
          <section>
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Operação</div>
            <div className="space-y-1">{renderMenuItems(operationItems)}</div>
          </section>
          {monitoringItems.length > 0 ? (
            <section>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Monitoramento</div>
              <div className="space-y-1">{renderMenuItems(monitoringItems)}</div>
            </section>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100 bg-gray-50/60">
          <div className="mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{session.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[session.role]}</p>
          </div>
          <Button
            data-testid="logout-button"
            variant="outline"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
            onClick={() => {
              logout();
              navigate('/auth/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex min-w-0 flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden sm:flex items-center text-sm text-gray-500">
              <span className="font-medium text-gray-700">Sistema HPV</span>
              {currentPath
                .split('/')
                .filter(Boolean)
                .map((part, index) => (
                  <React.Fragment key={`${part}-${index}`}>
                    <span className="mx-2">/</span>
                    <span className="capitalize font-medium text-gray-900">{PATH_LABELS[part] || part.replace('-', ' ')}</span>
                  </React.Fragment>
                ))}
            </nav>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-[#0B5D7A]">Projeto de Vacinação Contra o HPV</span>
            <span className="text-[10px] text-gray-500">Protótipo funcional</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
