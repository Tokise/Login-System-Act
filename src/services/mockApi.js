const API_URL = 'http://localhost:3000/api';

const getHeaders = () => {
    const userStr = localStorage.getItem('active_session_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
        'Content-Type': 'application/json',
        'x-user-id': user ? user.id : ''
    };
};

export const mockApi = {
    // --- Init ---
    init: () => { },

    // --- Auth ---
    login: async (username, password) => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, error: 'Connection error' };
        }
    },

    // --- User Management ---
    getUsers: async () => {
        const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch users');
        return await res.json();
    },

    createUser: async (userData) => {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
    },

    updateUser: async (id, updates) => {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
    },

    // --- Logs ---
    getLogs: async () => {
        const res = await fetch(`${API_URL}/logs`, { headers: getHeaders() });
        if (!res.ok) return [];
        return await res.json();
    },

    getLatestLog: async (userId) => {
        const res = await fetch(`${API_URL}/users/${userId}/logs/latest`, { headers: getHeaders() });
        if (!res.ok) return null;
        return await res.json();
    },

    logActivity: async (logData) => {
        // Handled by backend.
    }
};

