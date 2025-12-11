import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [showForgot, setShowForgot] = useState(false);
    const [resetUsername, setResetUsername] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [forgotMsg, setForgotMsg] = useState('');

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

    if (user) return <Navigate to="/" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setLoading(true);
        const success = await login(username, password);
        setLoading(false);

        if (success) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    };

    const handleDirectReset = async (e) => {
        e.preventDefault();

        const isValid = checkPassword(newPass);
        if (!isValid) {
            setForgotMsg('Password must meet all requirements (Exactly 8 chars, Upper, Lower, Num, Special)');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/reset-password-direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: resetUsername, email: resetEmail, newPassword: newPass })
            });
            const data = await res.json();
            if (res.ok) {
                setForgotMsg('Success! Password updated.');
                setTimeout(() => {
                    setShowForgot(false);
                    setForgotMsg('');
                    setResetUsername('');
                    setResetEmail('');
                    setNewPass('');
                    setPasswordRequirements({ length: false, upper: false, lower: false, number: false, special: false });
                }, 2000);
            } else {
                setForgotMsg(data.error);
            }
        } catch (err) {
            setForgotMsg('Request failed');
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen">
            {/* --- Left Side: Visual --- */}
            <div className="hidden lg:flex w-1/2 bg-black text-white items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="relative z-10 max-w-md space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="text-black w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-bold tracking-tight leading-tight">AuthNexus</h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Advanced security monitoring, user management, and activity logging in one centralized platform.
                    </p>
                </div>
            </div>

            {/* --- Right Side: Form --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-sm space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Username or Email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                                <span>Remember me</span>
                            </label>
                            <button type="button" onClick={() => setShowForgot(true)} className="text-gray-500 hover:text-black font-medium cursor-pointer">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* --- Forgot Password Modal --- */}
                <AnimatePresence>
                    {showForgot && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="w-full max-w-sm bg-white shadow-2xl rounded-2xl p-8 border border-gray-100"
                            >
                                <h3 className="text-xl font-bold mb-2">Reset Password</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Verify your identity to change your password instantly.
                                </p>

                                {forgotMsg && (
                                    <div className={`text-xs p-2 rounded mb-4 ${forgotMsg.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {forgotMsg}
                                    </div>
                                )}

                                <form onSubmit={handleDirectReset} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={resetUsername}
                                        onChange={(e) => setResetUsername(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
                                        required
                                    />
                                    <div className="space-y-2">
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={newPass}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewPass(val);
                                                checkPassword(val);
                                            }}
                                            maxLength={8}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black"
                                            required
                                        />

                                        {/* Strength UI */}
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className={`font-medium ${Object.values(passwordRequirements).filter(Boolean).length === 5 ? 'text-green-600' : 'text-gray-500'}`}>
                                                        Strength: {['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][Object.values(passwordRequirements).filter(Boolean).length]}
                                                    </span>
                                                    <span className="text-gray-400">{newPass.length}/8 chars</span>
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
                                    <div className="flex gap-2 justify-end">
                                        <button type="button" onClick={() => setShowForgot(false)} className="text-gray-500 text-sm hover:text-black px-3 py-2 cursor-pointer">Cancel</button>
                                        <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 cursor-pointer">
                                            {loading ? 'Processing...' : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


