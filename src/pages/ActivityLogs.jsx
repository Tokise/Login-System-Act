import { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { Clock, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // --- Fetch Logs ---
    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const data = await mockApi.getLogs();
            setLogs(data);
            setLoading(false);
        };
        fetchLogs();
    }, []);

    const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
    const currentLogs = logs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
                    <p className="text-gray-500">Monitor system access and user actions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                            ) : currentLogs.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No activity recorded yet.</td></tr>
                            ) : (
                                currentLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {log.username_snapshot || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${log.action === 'Login' ? 'bg-green-50 text-green-700 border-green-200' :
                                                log.action.includes('Lock') ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-md truncate">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination --- */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50/50">
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


