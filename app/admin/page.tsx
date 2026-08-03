const stats = [
  { name: 'Total Players', value: '12,847', change: '+12%', positive: true },
  { name: 'Active Sessions', value: '1,234', change: '+5%', positive: true },
  { name: 'Daily Revenue', value: '$4,821', change: '-2%', positive: false },
  { name: 'Items Minted', value: '89,432', change: '+18%', positive: true },
]

const recentPlayers = [
  {
    id: 1,
    name: 'CyberWolf_99',
    level: 42,
    wallet: '7xK2...9f3A',
    lastActive: '2m ago',
  },
  {
    id: 2,
    name: 'NeonBlade',
    level: 67,
    wallet: '3pQ1...2b8D',
    lastActive: '5m ago',
  },
  {
    id: 3,
    name: 'PixelRogue',
    level: 23,
    wallet: '9mN4...1c5E',
    lastActive: '12m ago',
  },
  {
    id: 4,
    name: 'TitanCore',
    level: 89,
    wallet: '5rL8...4d7F',
    lastActive: '18m ago',
  },
  {
    id: 5,
    name: 'GlitchX',
    level: 15,
    wallet: '8sB3...6a2G',
    lastActive: '24m ago',
  },
]

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-400">
        Server overview and key metrics.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-lg border border-gray-800 bg-gray-900 p-5"
          >
            <dt className="truncate text-sm font-medium text-gray-400">
              {stat.name}
            </dt>
            <dd className="mt-1 flex items-baseline justify-between">
              <div className="text-2xl font-semibold text-white">
                {stat.value}
              </div>
              <div
                className={`text-sm font-medium ${
                  stat.positive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stat.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-semibold text-white">Recent Players</h3>
          <p className="mt-1 text-sm text-gray-400">
            Latest authenticated player sessions.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                  Wallet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-white">
                    {player.name}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-300">
                    {player.level}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm whitespace-nowrap text-gray-400">
                    {player.wallet}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-400">
                    {player.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
