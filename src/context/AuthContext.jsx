import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { mockApi } from '../services/mockApi';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Session Timeout (5 mins) ---
    const TIMEOUT_DURATION = 5 * 60 * 1000;
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (user) {
            timerRef.current = setTimeout(() => {
                logout('Session expired due to inactivity');
            }, TIMEOUT_DURATION);
        }
    };

    // --- Initialization ---
    useEffect(() => {
        mockApi.init();
        const storedUser = localStorage.getItem('active_session_user');
        if (storedUser) setUser(JSON.parse(storedUser));
        setLoading(false);
    }, []);

    // --- Activity Monitor ---
    useEffect(() => {
        if (!user) return;
        resetTimer();

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => resetTimer();

        events.forEach(e => window.addEventListener(e, handleActivity));

        return () => {
            events.forEach(e => window.removeEventListener(e, handleActivity));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [user]);

    // --- Auth Actions ---
    const login = async (username, password) => {
        try {
            const result = await mockApi.login(username, password);
            if (result.success) {
                setUser(result.user);
                localStorage.setItem('active_session_user', JSON.stringify(result.user));
                toast.success(`Welcome back, ${result.user.username}`);
                return true;
            }
            toast.error(result.error);
            return false;
        } catch (err) {
            toast.error('Login failed');
            return false;
        }
    };

    const logout = (reason) => {
        setUser(null);
        localStorage.removeItem('active_session_user');
        if (timerRef.current) clearTimeout(timerRef.current);
        if (reason) toast.warning(reason);
        else toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};


