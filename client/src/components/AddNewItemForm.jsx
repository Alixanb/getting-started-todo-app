import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { createItem } from '../api/todoApi';

export function AddItemForm({ onNewItem }) {
    const [newItem, setNewItem] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const submitNewItem = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const item = await createItem(newItem);
            onNewItem(item);
            setNewItem('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form onSubmit={submitNewItem}>
            <InputGroup className="mb-3">
                <Form.Control
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    type="text"
                    placeholder="New Item"
                    aria-label="New item"
                    maxLength={255}
                />
                <Button
                    type="submit"
                    variant="success"
                    disabled={!newItem.length || submitting}
                >
                    {submitting ? 'Adding...' : 'Add Item'}
                </Button>
            </InputGroup>
            {error && <p className="text-danger small">{error}</p>}
        </Form>
    );
}

AddItemForm.propTypes = {
    onNewItem: PropTypes.func,
};
