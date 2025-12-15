import { useAuth } from '../context/AuthContext';
import { Users, ShieldCheck, Activity, Clock, Plus, Eye, Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ users: 0, active: 0, logs: 0 });
    const [recentLogs, setRecentLogs] = useState([]);

    // --- Pagination State ---
    const [recentLogsPage, setRecentLogsPage] = useState(1);
    const LOGS_PER_PAGE = 5;

    // --- Fetch Stats ---
    useEffect(() => {
        const fetchStats = async () => {
            if (user?.level === 'super_admin') {
                const usersData = await mockApi.getUsers();
                const logsData = await mockApi.getLogs();

                setStats({
                    users: usersData.length,
                    active: usersData.filter(u => u.status === 'active').length,
                    logs: logsData.length
                });
                setRecentLogs(logsData.slice(0, 50));
            }
        };
        fetchStats();
    }, [user]);

    const totalRecentPages = Math.ceil(recentLogs.length / LOGS_PER_PAGE);
    const displayLogs = recentLogs.slice((recentLogsPage - 1) * LOGS_PER_PAGE, recentLogsPage * LOGS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500">Welcome back, <span className="text-black font-semibold">{user.username}</span>.</p>
            </div>

            {user.level === 'super_admin' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-300 font-medium text-sm uppercase">Total Users</p>
                            <h2 className="text-4xl font-bold mt-2">{stats.users}</h2>
                        </div>
                        <Users className="absolute right-4 bottom-4 text-gray-400 w-16 h-16 opacity-50" />
                    </div>

                    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-500 font-medium text-sm uppercase">Active Sessions</p>
                            <h2 className="text-4xl font-bold mt-2 text-green-600">{stats.active}</h2>
                        </div>
                        <ShieldCheck className="absolute right-4 bottom-4 text-green-100 w-16 h-16" />
                    </div>

                    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-500 font-medium text-sm uppercase">Total Activities</p>
                            <h2 className="text-4xl font-bold mt-2">{stats.logs}</h2>
                        </div>
                        <Activity className="absolute right-4 bottom-4 text-gray-100 w-16 h-16" />
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center py-20">
                    <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-50 rounded-full mb-6">
                        <ShieldCheck size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Account Status: Active</h2>
                    {user.role === 'admin' ? (
                        <div className="mt-6">
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                You have administrative access to manage users based on your assigned restrictions.
                            </p>
                            <a href="/users" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all font-medium">
                                <Users size={20} />
                                Manage Users
                            </a>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <p className="text-gray-500 max-w-md mx-auto">
                                You have limited access. Contact the Super Admin if you need additional permissions.
                            </p>
                            {/* Conditional Buttons based on restrictions */}
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {user.restrictions?.includes('add') && (
                                    <button className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg cursor-not-allowed opacity-80" title="Permission: Add User">
                                        <Plus size={20} />
                                        Add
                                    </button>
                                )}
                                {user.restrictions?.includes('view') && (
                                    <button className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-200 px-6 py-3 rounded-lg cursor-not-allowed opacity-80" title="Permission: View Users">
                                        <Eye size={20} />
                                        View
                                    </button>
                                )}
                                {user.restrictions?.includes('edit') && (
                                    <button className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 px-6 py-3 rounded-lg cursor-not-allowed opacity-80" title="Permission: Edit Users">
                                        <Edit2 size={20} />
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- Recent Activity Mini Table --- */}
            {user.level === 'super_admin' && (
                <div className="pt-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock size={20} /> Recent System Activity
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Timestamp</th>
                                    <th className="px-6 py-3 font-medium">User</th>
                                    <th className="px-6 py-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayLogs.length === 0 ? (
                                    <tr><td colSpan="3" className="p-6 text-center text-gray-500">No recent activity.</td></tr>
                                ) : (
                                    displayLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3 text-gray-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 font-medium">
                                                {log.username_snapshot}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${log.action === 'Login' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    log.action.includes('Lock') ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* --- Pagination Controls --- */}
                        {totalRecentPages > 1 && (
                            <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50/50">
                                <span className="text-xs text-gray-500">Page {recentLogsPage} of {totalRecentPages}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setRecentLogsPage(p => Math.max(1, p - 1))}
                                        disabled={recentLogsPage === 1}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setRecentLogsPage(p => Math.min(totalRecentPages, p + 1))}
                                        disabled={recentLogsPage === totalRecentPages}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="p-3 bg-gray-50 text-center border-t border-gray-200">
                            <a href="/logs" className="text-sm font-medium text-black hover:underline">View All Activity</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


