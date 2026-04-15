import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { changePassword } from '../api/authApi';

export function ChangePasswordPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (form.next !== form.confirm) {
            setError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }
        if (form.next.length < 8) {
            setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
            return;
        }
        setLoading(true);
        try {
            await changePassword(form.current, form.next);
            navigate('/profile', { state: { success: 'Mot de passe modifié avec succès' } });
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
                    <h5 className="mb-4 text-center">Changer le mot de passe</h5>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mot de passe actuel</Form.Label>
                            <Form.Control
                                type="password"
                                value={form.current}
                                onChange={set('current')}
                                required
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nouveau mot de passe <small className="text-muted">(8 caractères min.)</small></Form.Label>
                            <Form.Control
                                type="password"
                                value={form.next}
                                onChange={set('next')}
                                required
                                minLength={8}
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                            <Form.Control
                                type="password"
                                value={form.confirm}
                                onChange={set('confirm')}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                            {loading ? 'Modification…' : 'Modifier le mot de passe'}
                        </Button>
                    </Form>
                    <p className="text-center mt-3 mb-0 small">
                        <Link to="/profile">← Retour au profil</Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
}
