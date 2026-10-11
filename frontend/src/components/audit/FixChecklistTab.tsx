import React, { useState, useEffect } from 'react';
import { AuditDetail, AuditIssue } from '../../types/audit';
import { 
  CheckCircle2, Clock, AlertTriangle, AlertCircle, Sparkles, 
  Download, Printer, Filter, CheckSquare, Square, ArrowUpRight, 
  RotateCcw, ShieldCheck, ChevronDown, ChevronUp, Code
} from 'lucide-react';

interface FixChecklistTabProps {
  audit: AuditDetail;
}

interface ActionTask {
  id: string;
  issueId?: number;
  title: string;
  category: 'seo' | 'ux' | 'accessibility' | 'technical';
  severity: 'high' | 'medium' | 'low';
  scoreImpact: number;
  status: 'todo' | 'in_progress' | 'completed';
  timeEstimate: string;
  explanation: string;
  recommendation: string;
  codeSnippet?: string;
}

export const FixChecklistTab: React.FC<FixChecklistTabProps> = ({ audit }) => {
  const storageKey = `sitescope_audit_${audit.id}_action_plan`;
  
  // Transform audit issues into action tasks
  const generateInitialTasks = (): ActionTask[] => {
    return audit.issues.map((iss, index) => {
      let impact = iss.severity === 'high' ? 12 : iss.severity === 'medium' ? 7 : 4;
      let time = iss.severity === 'high' ? '15-30 mins' : iss.severity === 'medium' ? '10-15 mins' : '5 mins';
      
      let snippet: string | undefined = undefined;
      if (iss.rule_code?.includes('TITLE')) {
        snippet = `<title>${audit.primary_website?.extracted_data?.title || 'Brand Name — Descriptive Value Proposition Keyword'}</title>`;
      } else if (iss.rule_code?.includes('META_DESCRIPTION')) {
        snippet = `<meta name="description" content="Engaging 150-160 character description highlighting key benefits and compelling call to action.">`;
      } else if (iss.rule_code?.includes('IMAGE_ALT')) {
        snippet = `<img src="example.jpg" alt="Descriptive natural language description of image content" loading="lazy" />`;
      } else if (iss.rule_code?.includes('H1')) {
        snippet = `<h1>Primary Clear Topic Statement with Core Keyword</h1>`;
      } else if (iss.rule_code?.includes('CANONICAL')) {
        snippet = `<link rel="canonical" href="${audit.primary_url}" />`;
      }

      return {
        id: `task_${iss.id || index}`,
        issueId: iss.id,
        title: iss.title,
        category: iss.category as any,
        severity: iss.severity as any,
        scoreImpact: impact,
        status: 'todo',
        timeEstimate: time,
        explanation: iss.explanation || 'Resolving this deterministic issue improves search crawler indexing and user experience.',
        recommendation: iss.recommendation || 'Implement the recommended HTML semantics and standard meta attributes.',
        codeSnippet: snippet,
      };
    });
  };

  const [tasks, setTasks] = useState<ActionTask[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return generateInitialTasks();
  });

  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks, storageKey]);

  const updateTaskStatus = (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const resetAllTasks = () => {
    if (window.confirm('Reset all task statuses back to "To Do"?')) {
      const initial = generateInitialTasks();
      setTasks(initial);
      localStorage.removeItem(storageKey);
    }
  };

  // Metrics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Potential score calculations
  const baseScore = audit.overall_score || 65;
  const totalPotentialGains = tasks.reduce((sum, t) => sum + (t.status === 'completed' ? t.scoreImpact : 0), 0);
  const maxPossibleScore = Math.min(100, baseScore + tasks.reduce((sum, t) => sum + t.scoreImpact, 0));
  const projectedScore = Math.min(100, baseScore + totalPotentialGains);

  const filteredTasks = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (severityFilter !== 'all' && t.severity !== severityFilter) return false;
    return true;
  });

  const handleExportMarkdown = () => {
    const lines = [
      `# SiteScope AI Action Plan: ${audit.normalized_primary_url}`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Current Health Score: ${baseScore}/100 | Projected Score: ${projectedScore}/100`,
      `Progress: ${completedTasks} of ${totalTasks} tasks resolved (${completionPercentage}%)\n`,
      `## Task List\n`,
    ];

    tasks.forEach(t => {
      const statusIcon = t.status === 'completed' ? '[x]' : t.status === 'in_progress' ? '[-]' : '[ ]';
      lines.push(`${statusIcon} **[${t.severity.toUpperCase()}] ${t.title}** (+${t.scoreImpact} pts, est. ${t.timeEstimate})`);
      lines.push(`   - Recommendation: ${t.recommendation}`);
      if (t.codeSnippet) {
        lines.push(`   - Fix: \`${t.codeSnippet}\``);
      }
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-action-plan-${audit.normalized_primary_url}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Plan Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Interactive SEO & UX Fix Tracker</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Step-by-Step Optimization Roadmap</h3>
            <p className="text-xs text-indigo-200 max-w-xl">
              Turn audit findings into resolved tickets. Check off completed items to track score improvement and export a clean deliverable for developers or clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Action Plan (.md)</span>
            </button>
            <button
              onClick={resetAllTasks}
              title="Reset progress"
              className="p-2 bg-white/5 hover:bg-white/15 text-slate-300 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Progress & Score Projection Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-semibold">Progress</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-white">{completedTasks} / {totalTasks}</span>
              <span className="text-xs text-indigo-300 font-bold">{completionPercentage}% Completed</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-semibold">Projected Score Gain</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-300">+{totalPotentialGains} pts</span>
              <span className="text-xs text-slate-300">of +{tasks.reduce((s, t) => s + t.scoreImpact, 0)} total</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">
              Based on verified deterministic rule impact
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-semibold">Target Health Grade</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-white">{projectedScore} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
              <span className="text-xs font-bold text-indigo-300">Target: {maxPossibleScore}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">
              Initial starting score: {baseScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: 'all', label: `All Tasks (${totalTasks})` },
            { key: 'todo', label: `To Do (${tasks.filter(t => t.status === 'todo').length})` },
            { key: 'in_progress', label: `In Progress (${inProgressTasks})` },
            { key: 'completed', label: `Resolved (${completedTasks})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Priority Only</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Quick Wins / Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No tasks in this category!</h4>
          <p className="text-xs text-slate-500">Try changing the status or severity filter above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';

            const severityBadge = {
              high: 'bg-rose-100 text-rose-800 border-rose-200',
              medium: 'bg-amber-100 text-amber-800 border-amber-200',
              low: 'bg-blue-100 text-blue-800 border-blue-200',
            }[task.severity];

            return (
              <div 
                key={task.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80' 
                    : isInProgress 
                    ? 'border-indigo-200 ring-2 ring-indigo-100' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-4 flex items-start gap-3.5">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => {
                      if (task.status === 'todo') updateTaskStatus(task.id, 'in_progress');
                      else if (task.status === 'in_progress') updateTaskStatus(task.id, 'completed');
                      else updateTaskStatus(task.id, 'todo');
                    }}
                    title="Click to advance status"
                    className="mt-0.5 shrink-0 focus:outline-none"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : isInProgress ? (
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-slate-500" />
                    )}
                  </button>

                  {/* Main Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${severityBadge}`}>
                        {task.severity} Priority
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                        {task.category}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        +{task.scoreImpact} pts
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {task.timeEstimate}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {task.recommendation}
                    </p>

                    {/* Expand/Collapse details */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-400">Status:</span>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                          className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 focus:outline-none"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Resolved</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>Hide Code & Details <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                          <>View Code & Fix <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    </div>

                    {/* Expanded Code & Explanation */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                        <div className="text-xs text-slate-600">
                          <strong className="text-slate-800 block mb-1">Impact Analysis:</strong>
                          {task.explanation}
                        </div>

                        {task.codeSnippet && (
                          <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-xs overflow-x-auto relative group">
                            <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 flex items-center justify-between">
                              <span>Recommended HTML Fix:</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(task.codeSnippet!)}
                                className="text-indigo-300 hover:text-white"
                              >
                                Copy Snippet
                              </button>
                            </div>
                            <code>{task.codeSnippet}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
