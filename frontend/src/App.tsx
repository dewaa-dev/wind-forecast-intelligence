
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  Wind,
} from 'lucide-react'
import './index.css'

type Point = {
  startTime: string
  publishTime: string
  decisionCutoff: string
  forecast: number
  actual: number
  error: number
  absoluteError: number
}

type Analysis = {
  source: string
  period: string
  unit: string
  decisionRule: string
  actualIntervals: number
  forecastIntervalsAfterCutoff: number
  matchedIntervals: number
  metrics: {
    mae: number | null
    rmse: number | null
    bias: number | null
  }
  data: Point[]
}

const API_URL = `${window.location.protocol}//${window.location.hostname}:8000/api/analysis`

const numberFormat = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
})

const decimalFormat = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatMW(value: number | null) {
  return value == null ? '—' : `${decimalFormat.format(value)} MW`
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

function exportCSV(data: Point[]) {
  const columns = [
    'startTime',
    'publishTime',
    'decisionCutoff',
    'forecast_MW',
    'actual_MW',
    'error_MW',
    'absoluteError_MW',
  ]

  const rows = data.map((point) => [
    point.startTime,
    point.publishTime,
    point.decisionCutoff,
    point.forecast,
    point.actual,
    point.error,
    point.absoluteError,
  ])

  const csv = [columns, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\r\n')

  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'wind-forecast-analysis-january-2026.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'overview' | 'accuracy'>('overview')

  const pageSize = 12

  async function loadData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`)
      }

      const result: Analysis = await response.json()
      setAnalysis(result)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load data from the backend.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const chartData = useMemo(() => {
    if (!analysis) return []

    return analysis.data.map((point) => ({
      ...point,
      timeLabel: new Date(point.startTime).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }),
    }))
  }, [analysis])

  const filteredData = useMemo(() => {
    if (!analysis) return []

    const query = search.trim().toLowerCase()
    if (!query) return analysis.data

    return analysis.data.filter((point) =>
      `${point.startTime} ${point.publishTime}`.toLowerCase().includes(query),
    )
  }, [analysis, search])

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const visibleRows = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  useEffect(() => {
    setPage(1)
  }, [search])

  const averageActual = useMemo(() => {
    if (!analysis?.data.length) return null
    return (
      analysis.data.reduce((sum, point) => sum + point.actual, 0) /
      analysis.data.length
    )
  }, [analysis])

  const bias = analysis?.metrics.bias ?? null

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Wind size={23} /></div>
          <div>
            <div className="brand-name">AEROGRID</div>
            <div className="brand-subtitle">ENERGY INTELLIGENCE</div>
          </div>
        </div>

        <div className="nav-caption">WORKSPACE</div>
        <button
          className={`nav-item ${view === 'overview' ? 'active' : ''}`}
          onClick={() => setView('overview')}
        >
          <Activity size={18} /> Overview
        </button>
        <button
          className={`nav-item ${view === 'accuracy' ? 'active' : ''}`}
          onClick={() => setView('accuracy')}
        >
          <CheckCircle2 size={18} /> Forecast accuracy
        </button>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <div className="status-title">Data source</div>
            <div className="status-description">Elexon BMRS API</div>
          </div>
          <span className="live-tag">API</span>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">ENERGY MARKETS <span>/</span> WIND ANALYTICS</div>
          <div className="topbar-right">
            <span className="period-tag"><CalendarDays size={15} /> JAN 2026</span>
            <button className="icon-button" onClick={() => void loadData()} title="Refresh data">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <div className="avatar">EA</div>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span /> DAY-AHEAD PROCUREMENT</div>
              <h1>Wind forecast intelligence</h1>
              <p>Understand forecast performance before committing to energy purchases.</p>
            </div>
            <button
              className="primary-button"
              onClick={() => analysis && exportCSV(analysis.data)}
              disabled={!analysis || loading}
            >
              <Download size={16} /> Export data
            </button>
          </section>

          {errorMessage && (
            <div className="error-banner">
              <AlertCircle size={19} />
              <div>
                <strong>Unable to load analytics</strong>
                <p>{errorMessage}. Confirm the Python backend is running on port 8000.</p>
                <button onClick={() => void loadData()}>Try again</button>
              </div>
            </div>
          )}

          {loading && !analysis && (
            <div className="loading-panel">
              <RefreshCw className="spin" size={24} />
              <span>Loading January 2026 data from Elexon…</span>
            </div>
          )}

          {analysis && (
            <>
              <div className="notice">
                <Clock3 size={17} />
                <div>
                  <strong>Decision-time integrity</strong>
                  <span>{analysis.decisionRule}. Only forecasts published by this cutoff are evaluated.</span>
                </div>
                <span className="notice-badge">CUTOFF APPLIED</span>
              </div>

              <section className="metric-grid">
                <MetricCard
                  label="Mean absolute error"
                  value={formatMW(analysis.metrics.mae)}
                  description="Average absolute forecast error"
                  icon={<Activity size={18} />}
                  tone="blue"
                />
                <MetricCard
                  label="Root mean squared error"
                  value={formatMW(analysis.metrics.rmse)}
                  description="Penalises larger misses"
                  icon={<Wind size={18} />}
                  tone="purple"
                />
                <MetricCard
                  label="Forecast bias"
                  value={formatMW(bias)}
                  description={bias == null ? 'No matched data' : bias > 0 ? 'Forecast tends to overestimate' : bias < 0 ? 'Forecast tends to underestimate' : 'Forecast is unbiased on average'}
                  icon={bias != null && bias > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  tone="amber"
                />
                <MetricCard
                  label="Matched intervals"
                  value={`${numberFormat.format(analysis.matchedIntervals)} / ${numberFormat.format(analysis.actualIntervals)}`}
                  description="Forecast and actual intervals matched"
                  icon={<CheckCircle2 size={18} />}
                  tone="green"
                />
              </section>

              <section className="insight-row">
                <div className="insight-card">
                  <div className="insight-label">AVERAGE ACTUAL GENERATION</div>
                  <div className="insight-value">{formatMW(averageActual)}</div>
                  <div className="insight-foot">Across matched intervals</div>
                </div>
                <div className="insight-card">
                  <div className="insight-label">MATCHED DATA POINTS</div>
                  <div className="insight-value">
                    {analysis.actualIntervals
                      ? `${((analysis.matchedIntervals / analysis.actualIntervals) * 100).toFixed(1)}%`
                      : '—'}
                  </div>
                 <div className="insight-foot">Hourly forecast timestamps matched to actual generation</div>
                </div>
                <div className="insight-card">
                  <div className="insight-label">FORECAST PUBLICATIONS</div>
                  <div className="insight-value">{numberFormat.format(analysis.forecastIntervalsAfterCutoff)}</div>
                  <div className="insight-foot">Unique eligible target intervals</div>
                </div>
              </section>

              {view === 'overview' ? (
                <section className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Forecast vs actual generation</h2>
                      <p>Matched intervals · UTC · measured in megawatts</p>
                    </div>
                    <span className="chart-legend-note"><span /> Forecast <span /> Actual</span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 12, right: 14, left: 4, bottom: 4 }}>
                        <defs>
                          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4a83ec" stopOpacity={0.19} />
                            <stop offset="95%" stopColor="#4a83ec" stopOpacity={0.01} />
                          </linearGradient>
                          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#19a984" stopOpacity={0.14} />
                            <stop offset="95%" stopColor="#19a984" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e9edf3" vertical={false} />
                        <XAxis dataKey="timeLabel" tickLine={false} axisLine={false} minTickGap={50} />
                        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                        <Tooltip
                          labelFormatter={(label) => `Target: ${label} UTC`}
                          formatter={(value, name) => [`${numberFormat.format(Number(value))} MW`, name === 'forecast' ? 'Forecast' : 'Actual']}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#4a83ec" fill="url(#forecastFill)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="actual" name="Actual" stroke="#19a984" fill="url(#actualFill)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-footer">
                    <span>Source: Elexon BMRS</span>
                    <span>{numberFormat.format(analysis.matchedIntervals)} matched observations</span>
                  </div>
                </section>
              ) : (
                <section className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Hourly forecast error over time</h2>
                      <p>Positive values indicate over-forecasting · MW</p>
                    </div>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
                        <CartesianGrid stroke="#e9edf3" vertical={false} />
                        <XAxis dataKey="timeLabel" tickLine={false} axisLine={false} minTickGap={50} />
                        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                        <Tooltip
                          labelFormatter={(label) => `Target: ${label} UTC`}
                          formatter={(value) => [`${numberFormat.format(Number(value))} MW`, 'Error']}
                        />
                        <Line type="monotone" dataKey="error" name="Forecast error" stroke="#8b6bd6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-footer">
                    <span>Forecast error = forecast − actual</span>
                    <span>Positive = over-forecast</span>
                  </div>
                </section>
              )}

              <section className="panel table-panel">
                <div className="panel-heading table-heading">
                  <div>
                    <h2>Interval-level observations</h2>
                    <p>Inspect forecast, actual generation and forecast publication time.</p>
                  </div>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search date or timestamp…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Target interval (UTC)</th>
                        <th>Published at (UTC)</th>
                        <th>Forecast (MW)</th>
                        <th>Actual (MW)</th>
                        <th>Error (MW)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((point) => (
                        <tr key={point.startTime}>
                          <td className="time-cell">{formatTime(point.startTime)}</td>
                          <td>{formatTime(point.publishTime)}</td>
                          <td>{numberFormat.format(point.forecast)}</td>
                          <td>{numberFormat.format(point.actual)}</td>
                          <td>
                            <span className={`error-value ${point.error > 0 ? 'positive' : point.error < 0 ? 'negative' : ''}`}>
                              {point.error > 0 ? '+' : ''}{numberFormat.format(point.error)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!visibleRows.length && (
                        <tr><td colSpan={5} className="empty-state">No matching intervals found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <span>Showing {visibleRows.length} of {numberFormat.format(filteredData.length)} observations</span>
                  <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                    <span>Page {page} of {pageCount}</span>
                    <button disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button>
                  </div>
                </div>
              </section>

              <footer className="page-footer">
                <span>Wind Forecast Intelligence · January 2026</span>
                <span>Analysis source: Elexon BMRS API · All timestamps in UTC</span>
              </footer>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

type MetricCardProps = {
  label: string
  value: string
  description: string
  icon: React.ReactNode
  tone: 'blue' | 'purple' | 'amber' | 'green'
}

function MetricCard({ label, value, description, icon, tone }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon ${tone}`}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-description">{description}</div>
    </article>
  )
}

export default App
