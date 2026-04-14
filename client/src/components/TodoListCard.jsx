import { useTodoList } from '../hooks/useTodoList';
import { AddItemForm } from './AddNewItemForm';
import { ItemDisplay } from './ItemDisplay';

export function TodoListCard() {
    const { items, error, onNewItem, onItemUpdate, onItemRemoval } =
        useTodoList();

    if (error) return <p className="text-danger">Failed to load items.</p>;
    if (items === null) return 'Loading...';

    return (
        <>
            <AddItemForm onNewItem={onNewItem} />
            {items.length === 0 && (
                <p className="text-center">No items yet! Add one above!</p>
            )}
            {items.map((item) => (
                <ItemDisplay
                    key={item.id}
                    item={item}
                    onItemUpdate={onItemUpdate}
                    onItemRemoval={onItemRemoval}
                />
            ))}
        </>
    );
}
