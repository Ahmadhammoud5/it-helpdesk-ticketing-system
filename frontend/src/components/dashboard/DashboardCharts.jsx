import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const pieColors = [
  '#2563eb',
  '#f59e0b',
  '#8b5cf6',
  '#10b981',
  '#ef4444',
  '#64748b',
]

function EmptyChart() {
  return (
    <div className="flex h-72 items-center justify-center text-sm font-medium text-slate-400">
      No ticket data available.
    </div>
  )
}

function DashboardCharts({ charts }) {
  const ticketsByStatus =
    charts?.ticketsByStatus ?? []

  const ticketsByPriority =
    charts?.ticketsByPriority ?? []

  const ticketsByCategory =
    charts?.ticketsByCategory ?? []

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Ticket analytics
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Visual breakdown of the tickets in your current view.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <div>
            <h3 className="font-bold text-slate-900">
              Tickets by status
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Current ticket workflow distribution.
            </p>
          </div>

          {ticketsByStatus.length > 0 ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={ticketsByStatus}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                      fill: '#64748b',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 12,
                      fill: '#64748b',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={{
                      fill: '#f8fafc',
                    }}
                  />

                  <Bar
                    dataKey="count"
                    name="Tickets"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <div>
            <h3 className="font-bold text-slate-900">
              Tickets by priority
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Distribution across priority levels.
            </p>
          </div>

          {ticketsByPriority.length > 0 ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={ticketsByPriority}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    label={({ name, value }) =>
                      `${name}: ${value}`
                    }
                  >
                    {ticketsByPriority.map(
                      (item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            pieColors[
                              index %
                                pieColors.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div>
          <h3 className="font-bold text-slate-900">
            Tickets by category
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Categories generating the most support requests.
          </p>
        </div>

        {ticketsByCategory.length > 0 ? (
          <div className="mt-5 h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={ticketsByCategory}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b',
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b',
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{
                    fill: '#f8fafc',
                  }}
                />

                <Bar
                  dataKey="count"
                  name="Tickets"
                  fill="#4f46e5"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </article>
    </section>
  )
}

export default DashboardCharts
