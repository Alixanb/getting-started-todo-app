import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const user = await login(email, password);
            loginUser(user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '100%', maxWidth: 420 }}>
                <Card.Body className="p-4">
                    <h4 className="mb-4 text-center">Connexion</h4>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Adresse e-mail</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Mot de passe</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                            {loading ? 'Connexion…' : 'Se connecter'}
                        </Button>
                    </Form>
                    <p className="text-center mt-3 mb-0 small">
                        Pas encore de compte ?{' '}
                        <Link to="/register">Créer un compte</Link>
                    </p>
                    <p className="text-center mt-2 mb-0 small">
                        <Link to="/privacy">Données collectées</Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
}
