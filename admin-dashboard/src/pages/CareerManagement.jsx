import { useState, useEffect, useCallback } from 'react';
import {
  getCareerNodes, getCareerPrograms, getEntranceExams, getColleges,
  getCareerAnalytics, featureCareerNode, deleteCareerNode,
  publishCareerProgram, archiveCareerProgram, publishEntranceExam, archiveEntranceExam, archiveCollege,
  updateCareerNode,
} from '../services/careerService';

function Spinner() {
  return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    archived: 'bg-cream-200 text-ink-500 border-cream-300',
    pending: 'bg-gold-50 text-gold-700 border-gold-300',
  };
  const cls = styles[status?.toLowerCase()] || 'bg-cream-200 text-ink-500';
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-overline font-medium border rounded ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/40 backdrop-blur-sm">
      <div className="bg-cream-50 border border-cream-300 p-8 w-full max-w-md">
        <h3 className="font-display text-xl text-night-800 mb-2">{title}</h3>
        <p className="text-sm text-ink-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-cream-300 text-sm text-night-800 hover:border-night-400 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white transition-colors ${danger ? 'bg-wine hover:bg-wine/90' : 'bg-gold-600 hover:bg-gold-700'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function EditNodeModal({ node, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: node?.title || '',
    description: node?.description || '',
    difficultyLevel: node?.difficultyLevel || 'moderate',
    isFeatured: node?.isFeatured || false,
    status: node?.status || 'active',
  });

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/40 backdrop-blur-sm">
      <div className="bg-cream-50 border border-cream-300 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-xl text-night-800 mb-6">Edit Career Node</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-overline text-gold-600 mb-1">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border-b border-cream-300 bg-transparent py-2 text-sm text-night-800 focus:border-gold-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-overline text-gold-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full border border-cream-300 bg-transparent py-2 px-3 text-sm text-night-800 focus:border-gold-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-overline text-gold-600 mb-1">Difficulty</label>
              <select value={form.difficultyLevel} onChange={e => setForm(f => ({ ...f, difficultyLevel: e.target.value }))}
                className="w-full border border-cream-300 bg-cream-50 py-2 px-3 text-sm text-night-800 focus:border-gold-500 focus:outline-none">
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="very_hard">Very Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-overline text-gold-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-cream-300 bg-cream-50 py-2 px-3 text-sm text-night-800 focus:border-gold-500 focus:outline-none">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-cream-300 text-sm text-night-800 hover:border-night-400 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-gold-600 text-white text-sm font-medium hover:bg-gold-700 transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, color = 'border-l-gold-500' }) {
  return (
    <div className={`bg-cream-50 border border-cream-300 p-5 border-l-4 ${color}`}>
      <p className="text-[10px] uppercase tracking-overline text-gold-600 mb-1">{label}</p>
      <p className="font-display text-[28px] text-night-800">{value ?? '—'}</p>
    </div>
  );
}

export default function CareerManagement({ token }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [nodes, setNodes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [exams, setExams] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodePage, setNodePage] = useState(1);
  const [nodeTotal, setNodeTotal] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [editingNode, setEditingNode] = useState(null);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'nodes', label: 'Career Nodes' },
    { id: 'programs', label: 'Programs' },
    { id: 'exams', label: 'Entrance Exams' },
    { id: 'colleges', label: 'Colleges' },
  ];

  const loadNodes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getCareerNodes({ page, limit: 20 });
      const items = data.nodes || data;
      setNodes(items);
      setNodePage(page);
      setNodeTotal(data.pagination?.total || items.length);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try { setPrograms(await getCareerPrograms({ limit: 50 })); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try { setExams(await getEntranceExams({ limit: 50 })); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const loadColleges = useCallback(async () => {
    setLoading(true);
    try { setColleges(await getColleges({ limit: 50 })); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCareerAnalytics();
      setAnalytics(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'overview') loadAnalytics();
    else if (activeTab === 'nodes') loadNodes(nodePage);
    else if (activeTab === 'programs') loadPrograms();
    else if (activeTab === 'exams') loadExams();
    else if (activeTab === 'colleges') loadColleges();
  }, [activeTab, nodePage]);

  const handleFeature = async (nodeId, featured) => {
    try {
      if (featured) await featureCareerNode(nodeId);
      await updateCareerNode(nodeId, { isFeatured: !featured });
      setNodes(nodes => nodes.map(n => n._id === nodeId ? { ...n, isFeatured: !featured } : n));
    } catch { /* ignore */ }
  };

  const handleDelete = async (nodeId) => {
    try {
      await deleteCareerNode(nodeId);
      setNodes(nodes => nodes.filter(n => n._id !== nodeId));
      setConfirm(null);
    } catch { /* ignore */ }
  };

  const handleSaveNode = async (form) => {
    try {
      const updated = await updateCareerNode(editingNode._id, form);
      setNodes(nodes => nodes.map(n => n._id === editingNode._id ? { ...n, ...updated } : n));
      setEditingNode(null);
    } catch { /* ignore */ }
  };

  const handlePublish = async (id, type) => {
    try {
      if (type === 'program') {
        await publishCareerProgram(id);
        setPrograms(programs => programs.map(p => p._id === id ? { ...p, status: 'published' } : p));
      } else if (type === 'exam') {
        await publishEntranceExam(id);
        setExams(exams => exams.map(e => e._id === id ? { ...e, status: 'published' } : e));
      }
    } catch { /* ignore */ }
  };

  const handleArchive = async (id, type) => {
    try {
      if (type === 'program') {
        await archiveCareerProgram(id);
        setPrograms(programs => programs.filter(p => p._id !== id));
      } else if (type === 'exam') {
        await archiveEntranceExam(id);
        setExams(exams => exams.filter(e => e._id !== id));
      } else if (type === 'college') {
        await archiveCollege(id);
        setColleges(colleges => colleges.filter(c => c._id !== id));
      }
      setConfirm(null);
    } catch { /* ignore */ }
  };

  const stats = analytics || {};
  const totalNodes = stats.nodes?.total || 0;
  const totalPrograms = 0; // loaded separately in Programs tab
  const totalExams = 0; // loaded separately in Exams tab
  const totalColleges = 0; // loaded separately in Colleges tab
  const recentNodes = stats.popularity?.topViewed || [];

  return (
    <div className="p-10 bg-cream min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-1">Career Management</h2>
          <p className="text-sm text-ink-500">Manage career nodes, programs, exams, and colleges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-cream-300 mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-ink-400 hover:text-night-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && !loading && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Career Nodes" value={totalNodes} color="border-l-gold-500" />
            <StatsCard label="Programs" value={totalPrograms} color="border-l-emerald-600" />
            <StatsCard label="Entrance Exams" value={totalExams} color="border-l-purple-600" />
            <StatsCard label="Colleges" value={totalColleges} color="border-l-blue-600" />
          </div>

          {/* Quick overview of recent nodes */}
          <div className="bg-cream-50 border border-cream-300">
            <div className="p-6 border-b border-cream-300">
              <h3 className="font-display text-lg text-night-800">Recent Career Nodes</h3>
            </div>
            <div className="divide-y divide-cream-200">
              {(recentNodes || []).slice(0, 10).map(node => (
                <div key={node._id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-night-800 truncate">{node.title}</p>
                    <p className="text-[11px] text-ink-400 capitalize">{node.nodeType?.replace('_', ' ')}</p>
                  </div>
                  <StatusBadge status={node.status} />
                </div>
              ))}
              {(recentNodes || []).length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-ink-400">No career nodes yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nodes Tab */}
      {activeTab === 'nodes' && (
        <div>
          <div className="bg-cream-50 border border-cream-300">
            <div className="divide-y divide-cream-200">
              {loading ? <Spinner /> : nodes.length === 0 ? (
                <div className="py-16 text-center text-sm text-ink-400">No career nodes found.</div>
              ) : nodes.map(node => (
                <div key={node._id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-night-800 truncate">{node.title}</p>
                      {node.isFeatured && <span className="px-2 py-0.5 bg-gold-50 text-gold-600 text-[10px] border border-gold-300 rounded">Featured</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-ink-400 capitalize">{node.nodeType?.replace('_', ' ')}</span>
                      {node.difficultyLevel && <span className="text-[11px] text-ink-400">{node.difficultyLevel.replace('_', ' ')}</span>}
                      {node.level !== undefined && <span className="text-[11px] text-ink-400">Level {node.level}</span>}
                    </div>
                  </div>
                  <StatusBadge status={node.status} />
                  <button onClick={() => setEditingNode(node)} className="px-3 py-1.5 border border-cream-300 text-[11px] text-night-800 hover:border-gold-500 hover:text-gold-600 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleFeature(node._id, node.isFeatured)} className="px-3 py-1.5 border border-cream-300 text-[11px] text-night-800 hover:border-gold-500 transition-colors">
                    {node.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => setConfirm({ id: node._id, type: 'node', label: node.title })} className="px-3 py-1.5 border border-wine/30 text-[11px] text-wine hover:bg-wine/5 transition-colors">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {nodeTotal > 20 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[11px] text-ink-400">Showing {(nodePage - 1) * 20 + 1}–{Math.min(nodePage * 20, nodeTotal)} of {nodeTotal}</p>
              <div className="flex gap-2">
                <button disabled={nodePage === 1} onClick={() => setNodePage(p => p - 1)} className="px-4 py-2 border border-cream-300 text-sm text-night-800 hover:border-night-400 disabled:opacity-40 transition-colors">← Prev</button>
                <button disabled={nodePage * 20 >= nodeTotal} onClick={() => setNodePage(p => p + 1)} className="px-4 py-2 border border-cream-300 text-sm text-night-800 hover:border-night-400 disabled:opacity-40 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="bg-cream-50 border border-cream-300">
          <div className="divide-y divide-cream-200">
            {loading ? <Spinner /> : programs.length === 0 ? (
              <div className="py-16 text-center text-sm text-ink-400">No programs found.</div>
            ) : programs.map(p => (
              <div key={p._id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-night-800 truncate">{p.title}</p>
                  <p className="text-[11px] text-ink-400">{p.category}</p>
                </div>
                <StatusBadge status={p.status} />
                {p.status !== 'published' && (
                  <button onClick={() => handlePublish(p._id, 'program')} className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 transition-colors">
                    Publish
                  </button>
                )}
                <button onClick={() => setConfirm({ id: p._id, type: 'program', label: p.title })} className="px-3 py-1.5 border border-wine/30 text-[11px] text-wine hover:bg-wine/5 transition-colors">
                  Archive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <div className="bg-cream-50 border border-cream-300">
          <div className="divide-y divide-cream-200">
            {loading ? <Spinner /> : exams.length === 0 ? (
              <div className="py-16 text-center text-sm text-ink-400">No entrance exams found.</div>
            ) : exams.map(e => (
              <div key={e._id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-night-800 truncate">{e.name}</p>
                  <p className="text-[11px] text-ink-400">{e.type}</p>
                </div>
                <StatusBadge status={e.status} />
                {e.status !== 'published' && (
                  <button onClick={() => handlePublish(e._id, 'exam')} className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 transition-colors">
                    Publish
                  </button>
                )}
                <button onClick={() => setConfirm({ id: e._id, type: 'exam', label: e.name })} className="px-3 py-1.5 border border-wine/30 text-[11px] text-wine hover:bg-wine/5 transition-colors">
                  Archive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Colleges Tab */}
      {activeTab === 'colleges' && (
        <div className="bg-cream-50 border border-cream-300">
          <div className="divide-y divide-cream-200">
            {loading ? <Spinner /> : colleges.length === 0 ? (
              <div className="py-16 text-center text-sm text-ink-400">No colleges found.</div>
            ) : colleges.map(c => (
              <div key={c._id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-night-800 truncate">{c.name}</p>
                  <p className="text-[11px] text-ink-400">{c.location?.city}</p>
                </div>
                <StatusBadge status={c.status} />
                <button onClick={() => setConfirm({ id: c._id, type: 'college', label: c.name })} className="px-3 py-1.5 border border-wine/30 text-[11px] text-wine hover:bg-wine/5 transition-colors">
                  Archive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title="Confirm Action"
          message={`Are you sure you want to archive "${confirm.label}"?`}
          onConfirm={() => handleArchive(confirm.id, confirm.type)}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      {/* Edit Node Modal */}
      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onSave={handleSaveNode}
          onCancel={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}
