import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from './api';
import { REFRESH_TOKEN, ACCESS_TOKEN } from './constant';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }) {
    const [isAuthorized, setAuthorized] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await auth();
            } catch {
                setAuthorized(false);
            }
        };
        checkAuth();
    });

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
            setAuthorized(false);
            return;
        }

        try {
            const res = await api.post('/api/token/refresh', { refresh: refreshToken });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setAuthorized(true);
            } else {
                setAuthorized(false);
            }
        } catch (error) {
            console.log(error);
            setAuthorized(false);
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setAuthorized(false);
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;

            if (decoded.exp < now) {
                await refreshToken();
            } else {
                setAuthorized(true);
            }
        } catch (e) {
            console.log('Invalid token', e);
            setAuthorized(false);
        }
    };

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    return isAuthorized ? children : <Navigate to={'/login'} />;
}

export default ProtectedRoute;