import { Panel, PageHeading } from '../../components/ui/panel'

export default function ApiReference() {
  return (
    <div>
      <PageHeading title="API Reference" description="Player, session, and admin endpoints." />
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white">Player Auth</h2>
          <div className="mt-4 space-y-4">
            <Endpoint
              method="POST"
              path="/api/auth/player/register"
              description="Register a new player with wallet signature."
            />
            <Endpoint
              method="POST"
              path="/api/auth/player/login"
              description="Authenticate a player and return a session token."
            />
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Heartbeat & Session</h2>
          <div className="mt-4 space-y-4">
            <Endpoint
              method="POST"
              path="/api/player/heartbeat"
              description="Send heartbeat to keep session alive."
            />
            <Endpoint
              method="GET"
              path="/api/player/session"
              description="Retrieve current player session data."
            />
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Admin</h2>
          <div className="mt-4 space-y-4">
            <Endpoint
              method="POST"
              path="/api/admin/auth"
              description="Admin login with MFA challenge."
            />
            <Endpoint
              method="GET"
              path="/api/admin/players"
              description="List all players (paginated)."
            />
            <Endpoint
              method="POST"
              path="/api/admin/players"
              description="Create a new player record."
            />
            <Endpoint
              method="PUT"
              path="/api/admin/players/[id]"
              description="Update player profile or status."
            />
            <Endpoint
              method="DELETE"
              path="/api/admin/players/[id]"
              description="Delete a player record."
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const color = METHOD_COLORS[method] ?? METHOD_COLORS.DELETE

  return (
    <Panel className="p-4">
      <div className="flex items-center gap-3">
        <span className={`rounded border px-2 py-0.5 text-xs font-mono ${color}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-gray-300">{path}</code>
      </div>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </Panel>
  )
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-400 border-green-400/30 bg-green-400/10',
  POST: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  PUT: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  DELETE: 'text-red-400 border-red-400/30 bg-red-400/10',
}
