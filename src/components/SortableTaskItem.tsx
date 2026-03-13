'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, GripVertical, Trash2, ExternalLink, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
    id: string;
    content: string;
    description: string | null;
    duration_minutes: number | null;
    metadata: any | null;
    status: 'todo' | 'doing' | 'done';
}

interface SortableTaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate?: (id: string, content: string) => void;
}

export function SortableTaskItem({ task, onToggle, onDelete, onUpdate }: SortableTaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasDetails = task.description || (task.metadata?.links && task.metadata.links.length > 0);

    return (
        <div ref={setNodeRef} style={style} className="touch-none">
            <Card className={`group border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm transition-all duration-200 ${task.status === 'done' ? 'bg-zinc-50/50 dark:bg-zinc-900/20' : 'bg-white/50 dark:bg-zinc-950/50 hover:border-purple-500/30'
                }`}>
                <CardContent className="p-0">
                    <div className="p-4 flex items-center gap-4">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                            <GripVertical className="w-4 h-4 text-zinc-400" />
                        </div>

                        <button
                            onClick={() => onToggle(task.id)}
                            className={`flex-shrink-0 transition-colors ${task.status === 'done' ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-700 hover:text-green-400'
                                }`}
                        >
                            <CheckCircle2 className="w-6 h-6" />
                        </button>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <input
                                    autoFocus
                                    className="w-full bg-transparent border-none focus:ring-0 font-medium text-zinc-700 dark:text-zinc-300 outline-none"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onBlur={() => {
                                        setIsEditing(false);
                                        if (editContent.trim() && editContent !== task.content) {
                                            onUpdate?.(task.id, editContent.trim());
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setIsEditing(false);
                                            if (editContent.trim() && editContent !== task.content) {
                                                onUpdate?.(task.id, editContent.trim());
                                            }
                                        }
                                        if (e.key === 'Escape') {
                                            setIsEditing(false);
                                            setEditContent(task.content);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <p
                                        onDoubleClick={() => task.status !== 'done' && setIsEditing(true)}
                                        className={`font-medium transition-all truncate ${task.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300 cursor-text'
                                            }`}>
                                        {task.content}
                                    </p>
                                    {task.duration_minutes && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                                            <Clock className="w-2.5 h-2.5" />
                                            {task.duration_minutes} min
                                        </div>
                                    )}
                                    {hasDetails && (
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => onDelete(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {isExpanded && hasDetails && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
                            >
                                <div className="p-4 pl-14 space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                                    {task.description && (
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                            {task.description}
                                        </div>
                                    )}
                                    {task.metadata?.links && task.metadata.links.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {task.metadata.links.map((link: any, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:border-purple-500/50 transition-all shadow-sm"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {link.title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
