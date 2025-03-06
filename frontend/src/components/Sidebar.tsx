import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Database, 
  FileText, 
  Bot, 
  Code2, 
  User, 
  LogOut,
  Upload,
  Menu,
  X,
  BarChart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Upload, label: 'Sources', path: '/sources' },
  { icon: Database, label: 'Data Base', path: '/database' },
  { icon: BarChart, label: 'Dashboards', path: '/dashboards' },
  { icon: Bot, label: 'N.O.A', path: '/noa' },
  { icon: Code2, label: 'Embedded Code', path: '/embedded' },
  { icon: User, label: 'Mi Perfil', path: '/profile' },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
      'hover:bg-purple-50',
      isActive 
        ? 'bg-purple-50 font-semibold' 
        : 'text-gray-900'
    );

  const mobileMenuClasses = clsx(
    'fixed inset-0 bg-white z-50 lg:hidden transition-transform duration-300',
    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
  );

  const renderNavContent = () => (
    <>
      <div className="mb-8">
        <h1 className={clsx(
          "text-2xl font-bold gradient-text",
          !isExpanded && "text-center"
        )}>
          {isExpanded ? "N.O.A" : "N"}
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={navLinkClasses}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className="w-5 h-5 text-gray-900" />
            {isExpanded && (
              <span className="gradient-text whitespace-nowrap">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <button 
        className={clsx(
          "flex items-center gap-3 px-4 py-3 text-gray-900 rounded-lg",
          "hover:bg-purple-50 transition-all duration-300 w-full"
        )}
        onClick={() => {/* Add logout logic */}}
      >
        <LogOut className="w-5 h-5" />
        {isExpanded && <span>Cerrar Sesión</span>}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        <Menu className="w-6 h-6 text-gray-900" />
      </button>

      {/* Mobile Sidebar */}
      <div className={mobileMenuClasses}>
        <div className="flex flex-col h-full p-4 pt-16">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>
          {renderNavContent()}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={clsx(
        "hidden lg:flex flex-col border-r border-gray-200 bg-white",
        "h-screen sticky top-0 px-4 py-6 transition-all duration-300 relative",
        isExpanded ? "w-64" : "w-20"
      )}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50"
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        {renderNavContent()}
      </aside>
    </>
  );
};

export default Sidebar;