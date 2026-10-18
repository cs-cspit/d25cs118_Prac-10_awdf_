import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Heavy component: recharts adds a large amount of JS. It is lazy-loaded from
// Tasks.jsx, so the chart library downloads only when the user opens statistics.
const STATUS_COLORS = ['#22c55e', '#f59e0b']
const PRIORITY_COLORS = { low: '#22c55e', medium: '#eab308', high: '#ef4444' }

function TaskStats({ tasks }) {
  const completed = tasks.filter((t) => t.completed).length
  const statusData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: tasks.length - completed },
  ]

  const priorityData = ['low', 'medium', 'high'].map((p) => ({
    name: p,
    count: tasks.filter((t) => (t.priority || 'medium') === p).length,
  }))

  if (tasks.length === 0) {
    return <p className="empty-state">Add some tasks to see statistics.</p>
  }

  return (
    <div className="stats-grid">
      <div className="stats-card">
        <h4>Status</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
              {statusData.map((entry, i) => (
                <Cell key={entry.name} fill={STATUS_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="stats-card">
        <h4>By priority</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priorityData}>
            <XAxis dataKey="name" stroke="currentColor" />
            <YAxis allowDecimals={false} stroke="currentColor" />
            <Tooltip />
            <Bar dataKey="count">
              {priorityData.map((entry) => (
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TaskStats
