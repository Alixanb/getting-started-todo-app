import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';

export function PrivacyPage() {
    return (
        <Container className="py-5" style={{ maxWidth: 680 }}>
            <h4 className="mb-4">Données collectées</h4>

            <Card className="mb-4">
                <Card.Body>
                    <h6>Données de compte</h6>
                    <p className="small text-muted mb-2">
                        Lors de la création de votre compte, nous collectons :
                    </p>
                    <ul className="small">
                        <li><strong>Adresse e-mail</strong> — utilisée comme identifiant unique</li>
                        <li><strong>Prénom et nom</strong> — affichés dans l'interface</li>
                        <li><strong>Mot de passe</strong> — stocké sous forme de hash bcrypt (jamais en clair)</li>
                        <li><strong>Date de création du compte</strong></li>
                    </ul>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Body>
                    <h6>Données d'utilisation</h6>
                    <p className="small text-muted mb-2">
                        Vos <strong>tâches (todos)</strong> sont stockées et associées à votre compte.
                        Chaque tâche contient :
                    </p>
                    <ul className="small">
                        <li>Le libellé de la tâche</li>
                        <li>Son statut (complétée ou non)</li>
                        <li>Un identifiant unique</li>
                    </ul>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Body>
                    <h6>Stockage et sécurité</h6>
                    <ul className="small">
                        <li>Les données sont stockées localement dans la base de données de l'application (SQLite ou MySQL)</li>
                        <li>Aucune donnée n'est partagée avec des tiers</li>
                        <li>Aucun cookie de tracking ni analytics</li>
                        <li>L'authentification utilise un token JWT stocké dans un cookie <code>httpOnly</code> (non accessible par JavaScript)</li>
                    </ul>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Body>
                    <h6>Vos droits</h6>
                    <ul className="small">
                        <li><strong>Accès et modification</strong> — depuis votre page profil</li>
                        <li><strong>Suppression</strong> — depuis votre page profil → "Supprimer mon compte". Toutes vos données (compte et tâches) sont effacées immédiatement et définitivement</li>
                    </ul>
                </Card.Body>
            </Card>

            <p className="small text-center mt-3">
                <Link to="/login">← Retour à la connexion</Link>
            </p>
        </Container>
    );
}
