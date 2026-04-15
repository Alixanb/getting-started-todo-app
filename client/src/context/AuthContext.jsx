import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // null = loading, false = not logged in, object = logged in user
    const [user, setUser] = useState(null);

    // Try to restore session on mount
    useEffect(() => {
        getMe()
            .then(setUser)
            .catch(() => setUser(false));
    }, []);

    const loginUser = useCallback((userData) => {
        setUser(userData);
    }, []);

    const logoutUser = useCallback(() => {
        setUser(false);
    }, []);

    const updateUser = useCallback((userData) => {
        setUser((prev) => ({ ...prev, ...userData }));
    }, []);

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useAuth() {
    return useContext(AuthContext);
}
