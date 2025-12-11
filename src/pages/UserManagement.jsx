import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { toast } from 'sonner';
import {
    Search, Plus, MoreVertical, Shield, ShieldAlert,
    Edit2, Archive, Unlock, Lock, User as UserIcon, X, Eye, FileClock, ShieldCheck
} from 'lucide-react';

export default function UserManagement() {
    const { user: loggedInUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // --- Form State ---
    const [responseData, setResponseData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        restrictions: []
    });

    // --- Password Validation ---
    const [passwordError, setPasswordError] = useState(null);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false, upper: false, lower: false, number: false, special: false
    });

    const checkPassword = (pass) => {
        const reqs = {
            length: pass.length === 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
        };
        setPasswordRequirements(reqs);
        return Object.values(reqs).every(Boolean);
    };

    // --- Fetch Users ---
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await mockApi.getUsers();
            if (Array.isArray(data)) setUsers(data);
            else {
                setUsers([]);
                toast.error('Invalid data received');
            }
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Modal Logic ---
    const handleOpenModal = (user = null) => {
        setPasswordError(null);
        setPasswordRequirements({ length: false, upper: false, lower: false, number: false, special: false });

        if (user) {
            setCurrentUser(user);
            const currentRes = user.restrictions || [];
            const safeRes = currentRes.includes('view') ? currentRes : ['view', ...currentRes];

            setResponseData({
                username: user.username,
                email: user.email,
                password: '',
                role: user.role,
                restrictions: safeRes
            });
        } else {
            setCurrentUser(null);
            setResponseData({
                username: '',
                email: '',
                password: '',
                role: 'user',
                restrictions: ['view']
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (currentUser) {
                await mockApi.updateUser(currentUser.id, {
                    email: responseData.email,
                    role: responseData.role,
                    restrictions: responseData.restrictions
                });
                toast.success('User updated successfully');
            } else {
                if (!responseData.password) return toast.error('Password is required');
                const isValid = checkPassword(responseData.password);
                if (!isValid) return toast.error('Password does not meet requirements');

                await mockApi.createUser({
                    username: responseData.username,
                    email: responseData.email,
                    password: responseData.password,
                    role: responseData.role,
                    level: 'regular',
                    restrictions: responseData.restrictions
                });
                toast.success('User created successfully');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleRestriction = (res) => {
        if (res === 'view') return;

        setResponseData(prev => {
            const current = new Set(prev.restrictions);
            if (current.has(res)) {
                current.delete(res);
            } else {
                if (res === 'add') current.delete('edit');
                if (res === 'edit') current.delete('add');
                current.add(res);
            }
            return { ...prev, restrictions: Array.from(current) };
        });
    };

    // --- User Actions ---
    const handleUnlock = async (id) => {
        try {
            await mockApi.updateUser(id, { status: 'active', failedAttempts: 0, lockUntil: null });
            toast.success('User unlocked');
            fetchUsers();
        } catch (err) { toast.error('Failed to unlock'); }
    };

    const handleToggleArchive = async (user) => {
        try {
            const newStatus = user.status === 'archived' ? 'active' : 'archived';
            await mockApi.updateUser(user.id, { status: newStatus });
            toast.success(`User ${newStatus === 'active' ? 'Restored' : 'Archived'}`);
            fetchUsers();
        } catch (err) { toast.error('Action failed'); }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- View Details Logic ---
    const [viewData, setViewData] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const handleViewUser = async (user) => {
        try {
            const allLogs = await mockApi.getLogs();
            const userLogs = allLogs.filter(log => log.username_snapshot === user.username);
            const latestLog = userLogs.length > 0 ? userLogs[0] : null;

            setViewData({ user, latestLog });
            setIsViewModalOpen(true);
        } catch (err) {
            toast.error("Failed to load user details");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-gray-500">Manage access, roles, and account status.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Restrictions</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.username}</p>
                                                    <p className="text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.level === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {user.level === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Regular User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {(() => {
                                                if (user.level === 'super_admin') return 'All Access';
                                                let safeRes = [];
                                                try {
                                                    safeRes = typeof user.restrictions === 'string'
                                                        ? JSON.parse(user.restrictions)
                                                        : (user.restrictions || []);
                                                } catch (e) { }
                                                return Array.isArray(safeRes) ? safeRes.join(', ') : 'None';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.status === 'locked' ? (
                                                <span className="flex items-center gap-1.5 text-red-600 bg-red-50 w-fit px-2 py-1 rounded-md font-medium text-xs">
                                                    <Lock size={12} /> Locked
                                                </span>
                                            ) : user.status === 'archived' ? (
                                                <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 w-fit px-2 py-1 rounded-md font-medium text-xs">
                                                    <Archive size={12} /> Archived
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded-md font-medium text-xs">
                                                    <ShieldCheck size={12} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.level !== 'super_admin' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.status === 'locked' && (
                                                        <button onClick={() => handleUnlock(user.id)} title="Unlock Account" className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg cursor-pointer">
                                                            <Unlock size={18} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleViewUser(user)} title="View Detail" className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button onClick={() => handleOpenModal(user)} title="Edit" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleToggleArchive(user)} title={user.status === 'archived' ? 'Restore' : 'Archive'} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
                                                        {user.status === 'archived' ? <ShieldCheck size={18} /> : <Archive size={18} />}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Add/Edit Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{currentUser ? 'Edit User' : 'Create User'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-md cursor-pointer"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Username</label>
                                    <input
                                        type="text"
                                        value={responseData.username}
                                        onChange={e => setResponseData({ ...responseData, username: e.target.value })}
                                        disabled={!!currentUser}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        value={responseData.email}
                                        onChange={e => setResponseData({ ...responseData, email: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {!currentUser && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <input
                                        type="password"
                                        value={responseData.password}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setResponseData({ ...responseData, password: val });
                                            checkPassword(val);
                                        }}
                                        maxLength={8}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                                        required
                                        placeholder="Exactly 8 characters"
                                    />
                                    {/* Strength UI */}
                                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`font-medium ${Object.values(passwordRequirements).filter(Boolean).length === 5 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    Strength: {['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][Object.values(passwordRequirements).filter(Boolean).length]}
                                                </span>
                                                <span className="text-gray-400">{responseData.password.length}/8 chars</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${Object.values(passwordRequirements).filter(Boolean).length === 5 ? 'bg-green-500' :
                                                        Object.values(passwordRequirements).filter(Boolean).length > 2 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${(Object.values(passwordRequirements).filter(Boolean).length / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                            <div className={`flex items-center gap-1 ${passwordRequirements.length ? 'text-green-600' : ''}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.length ? 'bg-green-500' : 'bg-gray-300'}`} /> Exactly 8 Chars
                                            </div>
                                            <div className={`flex items-center gap-1 ${passwordRequirements.upper ? 'text-green-600' : ''}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.upper ? 'bg-green-500' : 'bg-gray-300'}`} /> 1 Uppercase
                                            </div>
                                            <div className={`flex items-center gap-1 ${passwordRequirements.lower ? 'text-green-600' : ''}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.lower ? 'bg-green-500' : 'bg-gray-300'}`} /> 1 Lowercase
                                            </div>
                                            <div className={`flex items-center gap-1 ${passwordRequirements.number ? 'text-green-600' : ''}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.number ? 'bg-green-500' : 'bg-gray-300'}`} /> 1 Number
                                            </div>
                                            <div className={`flex items-center gap-1 ${passwordRequirements.special ? 'text-green-600' : ''}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.special ? 'bg-green-500' : 'bg-gray-300'}`} /> 1 Special
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <div className="flex gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={responseData.role === 'user'}
                                            onChange={() => setResponseData({ ...responseData, role: 'user' })}
                                            className="rounded text-black focus:ring-black"
                                        />
                                        <span className="text-sm font-medium">Regular User</span>
                                    </label>
                                    {loggedInUser?.level === 'super_admin' && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={responseData.role === 'admin'}
                                                onChange={() => setResponseData({ ...responseData, role: 'admin' })}
                                                className="rounded text-black focus:ring-black"
                                            />
                                            <span className="text-sm font-medium">Admin</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Restrictions</label>
                                <div className="flex gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                    {['view', 'add', 'edit'].map((res) => {
                                        const isChecked = responseData.restrictions.includes(res);
                                        const isView = res === 'view';
                                        let isDisabled = isView;
                                        if (res === 'add' && responseData.restrictions.includes('edit')) isDisabled = true;
                                        if (res === 'edit' && responseData.restrictions.includes('add')) isDisabled = true;

                                        return (
                                            <label key={res} className={`flex items-center gap-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => !isDisabled && toggleRestriction(res)}
                                                    disabled={isDisabled}
                                                    className="rounded text-black focus:ring-black"
                                                />
                                                <span className="capitalize text-sm font-medium">{res}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400">* 'View' is mandatory. 'Add' and 'Edit' cannot be assigned together.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- View Details Modal --- */}
            {isViewModalOpen && viewData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="text-lg font-bold">User Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-md cursor-pointer"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-3xl font-bold">
                                    {viewData.user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{viewData.user.username}</h3>
                                    <p className="text-gray-500">{viewData.user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${viewData.user.level === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                            viewData.user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {viewData.user.level === 'super_admin' ? 'Super Admin' : viewData.user.role === 'admin' ? 'Admin' : 'Regular User'}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${viewData.user.status === 'active' ? 'bg-teal-100 text-teal-800' :
                                            viewData.user.status === 'locked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {viewData.user.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Latest Activity</h4>
                                {viewData.latestLog ? (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-md shadow-sm text-black">
                                                <FileClock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{viewData.latestLog.action}</p>
                                                <p className="text-xs text-gray-500 mt-1">{viewData.latestLog.details}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 font-mono">
                                                    {new Date(viewData.latestLog.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <p className="text-sm text-gray-400">No recent activity recorded.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium cursor-pointer">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
