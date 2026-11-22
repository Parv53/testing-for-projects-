import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {
  Activity, BriefcaseBusiness, CalendarDays, Users, UserRoundX,
  TrendingUp, RefreshCw, Search
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const number = (value) => new Intl.NumberFormat('en-MY', { maximumFractionDigits: 1 }).format(value ?? 0)
const percent = (value) => `${Number(value ?? 0).toFixed(1)}%`
const monthLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { month: 'short', year: '2-digit' })

function MetricCard({ title, value, subtitle, icon: Icon, change, suffix = '' }) {
  const positive = change > 0
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-title">{title}</span>
        <span className="metric-icon"><Icon size={19} /></span>
      </div>
      <div className="metric-value">{value}{suffix}</div>
      <div className="metric-bottom">
        <span className={`change ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
          {change == null ? '—' : `${change > 0 ? '+' : ''}${number(change)}${suffix}`}
        </span>
        <span>{subtitle}</span>
      </div>
    </article>
  )
}

function ChartCard({ title, description, children, className = '' }) {
  return (
    <section className={`panel chart-panel ${className}`}>
      <div className="panel-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [summary, setSummary] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('all')
  const [search, setSearch] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const [summaryResponse, dataResponse] = await Promise.all([
        fetch(`${API_URL}/api/summary`),
        fetch(`${API_URL}/api/timeseries`)
      ])
      if (!summaryResponse.ok || !dataResponse.ok) throw new Error('Could not load dashboard data. Check that the Python API is running.')
      setSummary(await summaryResponse.json())
      setData(await dataResponse.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const chartData = useMemo(() => {
    if (period === 'all') return data
    const months = Number(period)
    return data.slice(-months)
  }, [data, period])

  const latest = summary?.latest
  const filteredTable = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...chartData].reverse().filter(row =>
      !term || row.date.includes(term) || monthLabel(row.date).toLowerCase().includes(term)
    )
  }, [chartData, search])

  if (loading) return <div className="center-state"><div className="loader" /><p>Loading labour force data…</p></div>

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Activity size={22} /></div>
          <div><strong>Labour<span>Lens</span></strong><small>Malaysia · Monthly labour force insights</small></div>
        </div>
        <button className="refresh-button" onClick={loadDashboard}><RefreshCw size={16} /> Refresh data</button>
      </header>

      {error ? (
        <div className="error-panel"><strong>Unable to connect to the backend</strong><p>{error}</p><code>Start FastAPI at http://127.0.0.1:8000</code></div>
      ) : (
        <>
          <section className="hero">
            <div>
              <div className="eyebrow">LABOUR MARKET OVERVIEW</div>
              <h1>Understanding Malaysia’s<br /><span>labour force</span></h1>
              <p>Explore monthly changes in employment, unemployment and labour market participation.</p>
            </div>
            <div className="latest-date"><CalendarDays size={17} /><div><small>Latest available month</small><strong>{summary?.latest_date ? new Date(`${summary.latest_date}T00:00:00`).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' }) : '—'}</strong></div></div>
          </section>

          <section className="metric-grid">
            <MetricCard title="Labour force" value={number(latest?.lf)} subtitle="Change from previous month" icon={Users} change={summary?.month_change?.lf} />
            <MetricCard title="Employed persons" value={number(latest?.lf_employed)} subtitle="Change from previous month" icon={BriefcaseBusiness} change={summary?.month_change?.lf_employed} />
            <MetricCard title="Unemployed persons" value={number(latest?.lf_unemployed)} subtitle="Change from previous month" icon={UserRoundX} change={summary?.month_change?.lf_unemployed} />
            <MetricCard title="Unemployment rate" value={percent(latest?.u_rate)} subtitle="Change from previous month" icon={TrendingUp} change={summary?.month_change?.u_rate} suffix=" pp" />
          </section>

          <div className="section-toolbar">
            <div><h2>Labour market trends</h2><p>{summary?.total_months} monthly observations · {summary?.first_date?.slice(0, 4)}–{summary?.latest_date?.slice(0, 4)}</p></div>
            <div className="period-select">
              <label htmlFor="period">Time period</label>
              <select id="period" value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="all">All data</option>
                <option value="60">Last 5 years</option>
                <option value="36">Last 3 years</option>
                <option value="12">Last 12 months</option>
              </select>
            </div>
          </div>

          <section className="chart-grid">
            <ChartCard title="Employment & labour force" description="Monthly number of people in the labour market" className="wide-chart">
              <div className="legend"><span className="legend-dot blue" /> Labour force <span className="legend-dot teal" /> Employed persons</div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="labourFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5277e8" stopOpacity={0.2} /><stop offset="100%" stopColor="#5277e8" stopOpacity={0} /></linearGradient>
                      <linearGradient id="employedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20a994" stopOpacity={0.18} /><stop offset="100%" stopColor="#20a994" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf4" />
                    <XAxis dataKey="date" tickFormatter={monthLabel} minTickGap={35} tick={{ fill: '#8993a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#8993a5', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip labelFormatter={monthLabel} formatter={(v) => [number(v), '']} contentStyle={{ border: '1px solid #e8edf4', borderRadius: 12, boxShadow: '0 8px 24px #182b4b12' }} />
                    <Area type="monotone" dataKey="lf" name="Labour force" stroke="#5277e8" strokeWidth={2.5} fill="url(#labourFill)" />
                    <Area type="monotone" dataKey="lf_employed" name="Employed persons" stroke="#20a994" strokeWidth={2.5} fill="url(#employedFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Unemployment rate" description="Monthly unemployment rate (%)">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf4" />
                    <XAxis dataKey="date" tickFormatter={monthLabel} minTickGap={35} tick={{ fill: '#8993a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={v => `${v}%`} tick={{ fill: '#8993a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip labelFormatter={monthLabel} formatter={v => [percent(v), 'Unemployment rate']} />
                    <Line type="monotone" dataKey="u_rate" name="Unemployment rate" stroke="#e58b4c" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="small-stat"><span>Latest unemployment rate</span><strong>{percent(latest?.u_rate)}</strong></div>
            </ChartCard>

            <ChartCard title="Participation & employment ratio" description="Share of the population, shown as percentages">
              <div className="legend"><span className="legend-dot purple" /> Participation rate <span className="legend-dot orange" /> Employment-to-population</div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf4" />
                    <XAxis dataKey="date" tickFormatter={monthLabel} minTickGap={35} tick={{ fill: '#8993a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={v => `${v}%`} tick={{ fill: '#8993a5', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip labelFormatter={monthLabel} formatter={v => [percent(v), '']} />
                    <Line type="monotone" dataKey="p_rate" name="Participation rate" stroke="#8066d8" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="ep_ratio" name="Employment-to-population ratio" stroke="#e58b4c" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>

          <section className="panel table-panel">
            <div className="table-heading">
              <div><h2>Monthly data</h2><p>Browse the observations included in the dataset</p></div>
              <div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search month or year…" /></div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Month</th><th>Labour force</th><th>Employed</th><th>Unemployed</th><th>Outside labour force</th><th>Participation</th><th>Employment ratio</th><th>Unemployment</th></tr></thead>
                <tbody>
                  {filteredTable.slice(0, 30).map(row => (
                    <tr key={row.date}>
                      <td>{new Date(`${row.date}T00:00:00`).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}</td>
                      <td>{number(row.lf)}</td><td>{number(row.lf_employed)}</td><td>{number(row.lf_unemployed)}</td><td>{number(row.lf_outside)}</td>
                      <td>{percent(row.p_rate)}</td><td>{percent(row.ep_ratio)}</td><td><span className="rate-pill">{percent(row.u_rate)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTable.length === 0 && <div className="empty-table">No matching months found.</div>}
              {filteredTable.length > 30 && <div className="table-note">Showing the latest 30 matching months.</div>}
            </div>
          </section>

          <footer><span>LabourLens · Malaysia monthly labour force dashboard</span><span>Data range: {summary?.first_date} to {summary?.latest_date}</span></footer>
          <p className="disclaimer">Note: Population count units are not specified in the supplied CSV. Confirm the original source's unit and definitions before using the figures in a report or presentation.</p>
        </>
      )}
    </main>
  )
}
