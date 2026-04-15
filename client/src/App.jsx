import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TodoListCard } from './components/TodoListCard';
import { Greeting } from './components/Greeting';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { PrivacyPage } from './pages/PrivacyPage';

function TodoApp() {
    return (
        <>
            <Navbar bg="light" className="mb-3 px-3">
                <Navbar.Brand>Todo App</Navbar.Brand>
                <Nav className="ms-auto">
                    <Nav.Link as={Link} to="/profile">Mon profil</Nav.Link>
                </Nav>
            </Navbar>
            <Container>
                <Row>
                    <Col md={{ offset: 3, span: 6 }}>
                        <Greeting />
                        <TodoListCard />
                    </Col>
                </Row>
            </Container>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />

                    {/* Protected */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <TodoApp />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile/password"
                        element={
                            <ProtectedRoute>
                                <ChangePasswordPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
