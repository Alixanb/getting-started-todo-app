import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
    const { user } = useAuth();

    // Still loading session — show nothing (avoid flash of redirect)
    if (user === null) return null;

    if (user === false) return <Navigate to="/login" replace />;

    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};
