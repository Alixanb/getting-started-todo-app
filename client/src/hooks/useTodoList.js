import { useCallback, useEffect, useState } from 'react';
import { fetchItems } from '../api/todoApi';

export function useTodoList() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchItems().then(setItems).catch(setError);
    }, []);

    const onNewItem = useCallback((newItem) => {
        setItems((prev) => [...prev, newItem]);
    }, []);

    const onItemUpdate = useCallback((updated) => {
        setItems((prev) =>
            prev.map((i) => (i.id === updated.id ? updated : i)),
        );
    }, []);

    const onItemRemoval = useCallback((removed) => {
        setItems((prev) => prev.filter((i) => i.id !== removed.id));
    }, []);

    return { items, error, onNewItem, onItemUpdate, onItemRemoval };
}
