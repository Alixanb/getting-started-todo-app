import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { updateMe, deleteAccount, logout } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
    const { user, updateUser, logoutUser } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    });
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSaving(true);
        try {
            const updated = await updateMe(form);
            updateUser(updated);
            setSuccess('Profil mis à jour avec succès');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAccount();
            await logout();
            logoutUser();
            navigate('/login');
        } catch (err) {
            setError(err.message);
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        logoutUser();
        navigate('/login');
    };

    return (
        <Container className="py-5" style={{ maxWidth: 560 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Mon profil</h4>
                <div>
                    <Link to="/" className="btn btn-outline-secondary btn-sm me-2">← Mes tâches</Link>
                    <Button variant="outline-danger" size="sm" onClick={handleLogout}>Se déconnecter</Button>
                </div>
            </div>

            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={handleSave}>
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
                        <Form.Group className="mb-4">
                            <Form.Label>Adresse e-mail</Form.Label>
                            <Form.Control type="email" value={form.email} onChange={set('email')} required />
                        </Form.Group>
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                        <Link to="/profile/password" className="btn btn-outline-secondary ms-2">
                            Changer le mot de passe
                        </Link>
                    </Form>
                </Card.Body>
            </Card>

            <Card border="danger">
                <Card.Body>
                    <h6 className="text-danger">Zone dangereuse</h6>
                    <p className="small text-muted mb-3">
                        La suppression est définitive. Toutes vos tâches seront effacées.
                    </p>
                    <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                        Supprimer mon compte
                    </Button>
                </Card.Body>
            </Card>

            <p className="text-center mt-3 small">
                <Link to="/privacy">Données collectées</Link>
            </p>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmer la suppression</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Êtes-vous sûr·e de vouloir supprimer votre compte ? Cette action est <strong>irréversible</strong>.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Suppression…' : 'Oui, supprimer'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
