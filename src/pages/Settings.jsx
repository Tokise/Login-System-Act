import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Check, X, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);

    // --- Password Validation ---
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

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passData.new !== passData.confirm) return toast.error("Passwords don't match");

        const isValid = checkPassword(passData.new);
        if (!isValid) return toast.error("Password does not meet requirements");

        try {
            await mockApi.updateUser(user.id, { password: passData.new });

            mockApi.logActivity({
                user: user.username,
                action: 'Password Change',
                details: 'User updated their password'
            });

            toast.success("Password updated successfully");
            setPassData({ current: '', new: '', confirm: '' });
            setPasswordRequirements({ length: false, upper: false, lower: false, number: false, special: false });
        } catch (err) {
            toast.error("Failed to update password");
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-500">Manage your account preferences and security.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* --- Profile Card --- */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{user?.username}</h2>
                            <p className="text-gray-500 capitalize">
                                {user?.level === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Regular User'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Email</p>
                            <p className="font-medium">{user.email}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Account ID</p>
                            <p className="font-medium font-mono text-sm">{user.id}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-green-600" size={18} />
                                <span className="font-medium">Active & Secure</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Change Password --- */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Lock size={20} />
                        Change Password
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Current Password</label>
                            <input
                                type="password"
                                value={passData.current}
                                onChange={e => setPassData({ ...passData, current: e.target.value })}
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={passData.new}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setPassData({ ...passData, new: val });
                                        checkPassword(val);
                                    }}
                                    maxLength={8}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none pr-10"
                                    required
                                    placeholder="Exactly 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Strength Meter */}
                            <div className="mt-3 bg-gray-50 p-3 rounded-lg space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`font-medium ${Object.values(passwordRequirements).filter(Boolean).length === 5 ? 'text-green-600' : 'text-gray-500'}`}>
                                            Strength: {['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][Object.values(passwordRequirements).filter(Boolean).length]}
                                        </span>
                                        <span className="text-gray-400">{passData.new.length}/8 chars</span>
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

                        <div>
                            <label className="text-sm font-medium mb-1 block">Confirm Password</label>
                            <input
                                type="password"
                                value={passData.confirm}
                                onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button type="submit" className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


