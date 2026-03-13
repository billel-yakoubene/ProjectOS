'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableTaskItem } from './SortableTaskItem';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Task {
    id: string;
    content: string;
    description: string | null;
    duration_minutes: number | null;
    metadata: any | null;
    status: 'todo' | 'doing' | 'done';
    project_id?: string;
}

interface TaskListProps {
    initialTasks: Task[];
    onTasksChange?: () => void;
    onToggle?: (id: string, currentStatus: string) => void;
}

export default function TaskList({ initialTasks, onTasksChange, onToggle }: TaskListProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [newTaskContent, setNewTaskContent] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Sync state with props when initialTasks changes
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = tasks.findIndex((i) => i.id === active.id);
            const newIndex = tasks.findIndex((i) => i.id === over.id);
            const newItems = arrayMove(tasks, oldIndex, newIndex);

            setTasks(newItems);

            // Update orders in database
            try {
                const updates = newItems.map((task, index) => ({
                    id: task.id,
                    content: task.content,
                    order: index + 1,
                    status: task.status,
                    project_id: task.project_id
                }));

                const { error } = await supabase
                    .from('tasks')
                    .upsert(updates as any);

                if (error) throw error;
                onTasksChange?.();
            } catch (error) {
                console.error('Error updating task orders:', error);
                // Revert on error
                setTasks(tasks);
            }
        }
    };

    const toggleTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Optimistic update
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, status: newStatus as any } : t
        );
        setTasks(newTasks);

        if (onToggle) {
            onToggle(id, task.status);
        }
    };

    const deleteTask = async (id: string) => {
        if (!confirm('Supprimer cette tâche ?')) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            onTasksChange?.();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleAddTask = async () => {
        if (!newTaskContent.trim() || isAdding) return;

        setIsAdding(true);
        try {
            const projectId = initialTasks[0]?.project_id;
            if (!projectId) return;

            const { error } = await supabase
                .from('tasks')
                .insert({
                    content: newTaskContent.trim(),
                    project_id: projectId,
                    order: tasks.length + 1,
                    status: 'todo'
                });

            if (error) throw error;
            setNewTaskContent('');
            onTasksChange?.();
        } catch (error) {
            console.error('Error adding task:', error);
        } finally {
            setIsAdding(false);
        }
    };
    const handleUpdateTask = async (id: string, content: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ content })
                .eq('id', id);

            if (error) throw error;
            onTasksChange?.();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <div className="space-y-3">
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onUpdate={handleUpdateTask}
                        />
                    ))}
                </SortableContext>

                <div className="flex gap-2 pt-2">
                    <div className="relative flex-1">
                        <Input
                            value={newTaskContent}
                            onChange={(e) => setNewTaskContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder="Ajouter une tâche..."
                            className="bg-zinc-50 dark:bg-zinc-900 border-dashed border-2 border-zinc-200 dark:border-zinc-800 focus-visible:border-purple-500 transition-colors pl-10"
                            disabled={isAdding}
                        />
                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    </div>
                    <Button
                        onClick={handleAddTask}
                        disabled={isAdding || !newTaskContent.trim()}
                        size="sm"
                        className="bg-zinc-900 dark:bg-zinc-100"
                    >
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
                    </Button>
                </div>
            </div>
        </DndContext>
    );
}
