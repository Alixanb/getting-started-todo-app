import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { register } from '../api/authApi';

export function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (form.password !== form.confirm) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        if (form.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }
        setLoading(true);
        try {
            await register(form.email, form.firstName, form.lastName, form.password);
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '100%', maxWidth: 480 }}>
                <Card.Body className="p-4">
                    <h4 className="mb-4 text-center">Créer un compte</h4>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-3">
                            <Col>
                                <Form.Label>Prénom</Form.Label>
                                <Form.Control value={form.firstName} onChange={set('firstName')} required maxLength={100} />
                            </Col>
                            <Col>
                                <Form.Label>Nom</Form.Label>
                                <Form.Control value={form.lastName} onChange={set('lastName')} required maxLength={100} />
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Adresse e-mail</Form.Label>
                            <Form.Control type="email" value={form.email} onChange={set('email')} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mot de passe <small className="text-muted">(8 caractères minimum)</small></Form.Label>
                            <Form.Control type="password" value={form.password} onChange={set('password')} required minLength={8} />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Confirmer le mot de passe</Form.Label>
                            <Form.Control type="password" value={form.confirm} onChange={set('confirm')} required />
                        </Form.Group>
                        <Button type="submit" variant="success" className="w-100" disabled={loading}>
                            {loading ? 'Création…' : 'Créer mon compte'}
                        </Button>
                    </Form>
                    <p className="text-center mt-3 mb-0 small">
                        Déjà un compte ? <Link to="/login">Se connecter</Link>
                    </p>
                    <p className="text-center mt-2 mb-0 small">
                        <Link to="/privacy">Données collectées</Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
}
