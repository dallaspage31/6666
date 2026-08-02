import { PageHeading } from '../../components/ui/panel'

export default function InstallationDocs() {
  return (
    <div>
      <PageHeading title="Installation" description="Get the ROBHEROES project running locally." />
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white">Prerequisites</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-gray-300">
            <li>Node.js 18+ and npm</li>
            <li>PostgreSQL 14+</li>
            <li>A Solana RPC endpoint (mainnet-beta or devnet)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Clone and install</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 p-4">
            <code className="text-sm text-cyan-300">
              git clone https://github.com/robheroes/project.git{'\n'}
              cd project{'\n'}
              npm install
            </code>
          </pre>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Environment</h2>
          <p className="mt-3 text-gray-300">
            Copy <code className="rounded bg-gray-800 px-1.5 py-0.5 text-cyan-300">.env.example</code> to{' '}
            <code className="rounded bg-gray-800 px-1.5 py-0.5 text-cyan-300">.env.local</code> and fill in your
            database, Solana, and wallet credentials.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Run</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 p-4">
            <code className="text-sm text-cyan-300">
              npm run dev{'\n'}
              npm run build{'\n'}
              npm start
            </code>
          </pre>
        </section>
      </div>
    </div>
  )
}
