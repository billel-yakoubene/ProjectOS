'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import SmartCapture from "@/components/SmartCapture";
import ProjectList from "@/components/ProjectList";
import NextAction from "@/components/NextAction";
import NotificationCenter from "@/components/NotificationCenter";
import TaskList from "@/components/TaskList";
import ProgressBar from "@/components/ProgressBar";
import UserStats from "@/components/UserStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MomentumChart from "@/components/MomentumChart";
import AdviceFlashcard from "@/components/AdviceFlashcard";
import { Zap, ListTodo, PlusCircle, RefreshCw, Trash2, ArrowLeft, BarChart3, Lightbulb, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Auth from '@/components/Auth';
import { User } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

// Types for the real data
interface DbProject {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  tasks: DbTask[];
}

interface DbTask {
  id: string;
  content: string;
  description: string | null;
  duration_minutes: number | null;
  metadata: any | null;
  status: 'todo' | 'doing' | 'done';
  order: number;
  project_id: string;
}

interface AdviceCard {
  id: string;
  projectId: string;
  projectTitle: string;
  content: {
    action: string;
    rationale: string;
    tip: string;
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('focus');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<{ day: string; count: number }[]>([]);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [advices, setAdvices] = useState<AdviceCard[]>([]);
  const [stats, setStats] = useState({ xp: 0, level: 1, streak: 0 });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStats({ xp: data.xp, level: data.level, streak: data.streak });
      } else {
        // Initialize stats if not exist
        const { error: insertError } = await (supabase as any)
          .from('user_stats')
          .insert({ user_id: user.id, xp: 0, level: 1, streak: 0 });
        if (insertError) console.error('Error initializing stats:', insertError);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  const addXP = async (amount: number) => {
    if (!user) return;
    const newXP = stats.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;

    try {
      const { error } = await (supabase as any)
        .from('user_stats')
        .upsert({
          user_id: user.id,
          xp: newXP,
          level: newLevel,
          last_activity_at: new Date().toISOString()
        });

      if (error) throw error;

      if (newLevel > stats.level) {
        toast.success(`NIVEAU SUPÉRIEUR ! Vous êtes maintenant niveau ${newLevel} ! 🏆`, {
          icon: '🎉',
          duration: 5000
        });
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setStats(prev => ({ ...prev, xp: newXP, level: newLevel }));
    } catch (error) {
      console.error('Error updating XP:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setSessionLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Déconnecté avec succès");
  };

  const removeAdvice = (id: string) => {
    setAdvices(prev => prev.filter(a => a.id !== id));
  };

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('activity_logs')
        .select('timestamp')
        .eq('user_id', user.id)
        .eq('action_type', 'task_completed')
        .gte('timestamp', sevenDaysAgo.toISOString());

      if (error) throw error;

      // Group by day
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
      }).reverse();

      const counts = (data || []).reduce((acc: any, log: any) => {
        const day = new Date(log.timestamp).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const chartData = last7Days.map(day => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        count: counts[day] || 0
      }));

      setActivityData(chartData);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      fetchActivity();
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id, title, description, status, created_at,
          tasks (id, content, description, duration_minutes, metadata, status, "order", project_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sortedProjects = (projectsData as any[]).map(p => ({
        ...p,
        tasks: (p.tasks || []).sort((a: DbTask, b: DbTask) => a.order - b.order)
      }));

      setProjects(sortedProjects);
      fetchStats();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors de la récupération des données");
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchActivity]);

  useEffect(() => {
    if (user) {
      fetchData();

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` },
          () => fetchData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchData]);

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    if (!user) return;
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      fetchData();

      if (newStatus === 'done') {
        // Call n8n workflow via our API proxy
        await fetch('/api/task-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            userId: user.id,
            actionType: 'task_completed'
          })
        });

        fetchActivity();
        addXP(50); // Give 50 XP for completing a task
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Erreur lors de la mise à jour de la tâche");
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce projet et toutes ses tâches ?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      if (selectedProjectId === projectId) setSelectedProjectId(null);
      fetchData();
      toast.success("Projet supprimé");
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Erreur lors de la suppression du projet");
    }
  };

  const requestAdvice = async (project: DbProject) => {
    setIsGettingAdvice(true);
    try {
      const completedTasks = project.tasks.filter(t => t.status === 'done').map(t => t.content);
      const currentTask = project.tasks.find(t => t.status === 'todo')?.content || 'Aucune tâche détectée';

      const response = await fetch('/api/generate-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: project.title,
          description: project.description,
          completedTasks,
          currentTask
        })
      });

      const data = await response.json();
      if (data.advice) {
        toast.success("Conseil reçu ! Regardez en haut du tableau de bord.");
        const newAdvice = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: project.id,
          projectTitle: project.title,
          content: data.advice
        };
        setAdvices(prev => [newAdvice, ...prev]);
      }
    } catch (error) {
      console.error('Error getting advice:', error);
      toast.error("Impossible d'obtenir un conseil");
    } finally {
      setIsGettingAdvice(false);
    }
  };

  const nextGlobalTask = useMemo(() => {
    let targetProject = null;

    if (selectedProjectId) {
      targetProject = projects.find(p => p.id === selectedProjectId);
      const pendingTask = targetProject?.tasks.find(t => t.status === 'todo');
      if (pendingTask) {
        return {
          id: pendingTask.id,
          content: pendingTask.content,
          projectTitle: targetProject!.title,
          duration_minutes: pendingTask.duration_minutes,
          description: pendingTask.description
        };
      }
    }

    const projectsWithPending = projects
      .map(p => ({
        ...p,
        pendingTask: p.tasks.find(t => t.status === 'todo')
      }))
      .filter(p => p.pendingTask)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (projectsWithPending.length === 0) return null;

    const topProject = projectsWithPending[0];
    return {
      id: topProject.pendingTask!.id,
      content: topProject.pendingTask!.content,
      projectTitle: topProject.title,
      duration_minutes: topProject.pendingTask!.duration_minutes,
      description: topProject.pendingTask!.description
    };
  }, [projects, selectedProjectId]);

  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'done').length || 0), 0);

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-12 transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img src="/logo.png" alt="ProjectOS Logo" className="relative w-12 h-12 rounded-2xl shadow-2xl border border-white/10 object-cover" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter">ProjectOS <span className="text-purple-500 font-mono text-xs uppercase px-2 py-1 bg-purple-500/10 rounded ml-2">v1.2</span></h1>
              <p className="text-zinc-500 font-medium">Cockpit de gestion de projets intelligent</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <UserStats xp={stats.xp} level={stats.level} streak={stats.streak} />
            <div className="flex items-center gap-3 mr-1">
              {user.user_metadata.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800" />
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 hover:text-red-500 rounded-full">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            <NotificationCenter />
            <div className="text-right">
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Global Progress</p>
              <div className="w-48 mt-1">
                <ProgressBar total={totalTasks} completed={completedTasks} />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={isLoading}
              className="mt-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
          <MomentumChart data={activityData} />
        </div>

        <AdviceFlashcard
          advices={advices}
          onRemove={removeAdvice}
          onAction={(projectId) => {
            setSelectedProjectId(projectId);
            setActiveTab('focus');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-1 rounded-2xl h-16 shadow-lg">
              <TabsTrigger value="capture" className="rounded-xl px-8 gap-2 h-14 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md transition-all">
                <PlusCircle className="w-5 h-5" /> <span className="hidden sm:inline">Capture</span>
              </TabsTrigger>
              <TabsTrigger value="focus" className="rounded-xl px-8 gap-2 h-14 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md transition-all">
                <Zap className="w-5 h-5 text-purple-500" /> <span className="hidden sm:inline">Focus Mode</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-xl px-8 gap-2 h-14 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md transition-all">
                <ListTodo className="w-5 h-5" /> <span className="hidden sm:inline">Projets</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="capture" className="focus-visible:ring-0">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SmartCapture onProjectCreated={() => {
                fetchData();
                setActiveTab('tasks');
              }} />
            </div>
          </TabsContent>

          <TabsContent value="focus" className="focus-visible:ring-0">
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NextAction
                task={nextGlobalTask}
                onComplete={(id) => handleTaskToggle(id, 'todo')}
                onRequestAdvice={() => {
                  const project = projects.find(p => p.title === nextGlobalTask?.projectTitle);
                  if (project) requestAdvice(project);
                }}
                isGettingAdvice={isGettingAdvice}
                onBackToProjects={() => {
                  setSelectedProjectId(null);
                  setActiveTab('tasks');
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="focus-visible:ring-0">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedProjectId ? (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-center justify-between group">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProjectId(null)}
                      className="gap-2 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleProjectDelete(selectedProjectId)}
                      className="text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {selectedProject && (
                    <div className="space-y-10">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tight">{selectedProject.title}</h2>
                        <p className="text-zinc-500 font-medium text-lg leading-relaxed">{selectedProject.description}</p>
                        <Button
                          onClick={() => requestAdvice(selectedProject)}
                          disabled={isGettingAdvice}
                          className="mt-4 gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 transition-all duration-300 transform active:scale-95"
                        >
                          <Lightbulb className={`w-4 h-4 ${isGettingAdvice ? 'animate-pulse' : ''}`} />
                          {isGettingAdvice ? 'Analyse...' : 'Besoin d\'aide ?'}
                        </Button>
                      </div>

                      <div className="bg-white/30 dark:bg-zinc-900/30 p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                        <TaskList
                          initialTasks={selectedProject.tasks}
                          onTasksChange={fetchData}
                          onToggle={(id, status) => handleTaskToggle(id, status)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ProjectList
                  projects={projects}
                  onProjectClick={setSelectedProjectId}
                  onDelete={handleProjectDelete}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="mt-24 py-12 border-t border-zinc-100 dark:border-zinc-900 text-center text-zinc-400 text-xs font-medium tracking-widest uppercase">
        <p>ProjectOS &copy; 2026 • Performance & Intelligence</p>
      </footer>
    </main>
  );
}
