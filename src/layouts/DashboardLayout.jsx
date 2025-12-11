import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, FileClock } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        // Only Super Admin sends Settings/Users/Logs
        ...(user.level === 'super_admin' ? [
            { icon: Users, label: 'User Management', path: '/users' },
            { icon: FileClock, label: 'Activity Logs', path: '/logs' },
        ] : []),
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold tracking-tight">SecureSystem</h1>
                    <button onClick={toggleSidebar} className="lg:hidden p-1 rounded hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? 'bg-white text-black font-medium'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{user.username}</p>
                            <p className="text-xs text-gray-400 capitalize">
                                {user.level === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Regular User'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg shadow-red-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-4 flex items-center lg:hidden">
                    <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-md hover:bg-gray-100">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-auto p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
