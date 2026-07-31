import { Pool, PoolClient, QueryResult } from 'pg'
import fs from 'fs/promises'
import path from 'path'

const DATABASE_URL = process.env.DATABASE_URL

export interface Player {
  id: string
  wallet_address: string
  username: string | null
  level: number
  xp: number
  gold: number
  robheroes_balance: number
  last_active: string | null
  created_at: string
}

export interface Admin {
  id: string
  username: string
  password_hash: string
  totp_secret: string | null
  mfa_enabled: boolean
  created_at: string
  last_login: string | null
}

export interface Hero {
  id: string
  player_id: string
  class: string
  level: number
  xp: number
  hp: number
  atk: number
  def: number
  spd: number
}

export interface Item {
  id: string
  name: string
  slot: string
  rarity: string
  atk: number
  def: number
  hp: number
  spd: number
  sockets: number
  engraving_slots: number
}

export interface PlayerInventoryItem {
  id: string
  player_id: string
  item_id: string
  equipped: boolean
  gems: string[]
  engraving: string | null
}

export interface Pet {
  id: string
  player_id: string
  name: string
  bonus_type: string
  bonus_value: number
  equipped: boolean
}

export interface Rune {
  id: string
  player_id: string
  branch: string
  name: string
  points: number
}

export interface CraftingRecipe {
  id: string
  result_item_id: string
  materials: Record<string, number>
  result_count: number
}

export interface Wave {
  id: string
  stage: number
  wave_number: number
  monsters: string[]
  is_boss: boolean
}

export interface CombatSession {
  id: string
  player_id: string
  stage: number
  difficulty: string
  result: string | null
  xp_earned: number
  gold_earned: number
  rewards: Record<string, number>
  started_at: string
  ended_at: string | null
}

interface JsonData {
  players: Player[]
  admins: Admin[]
  heroes: Hero[]
  items: Item[]
  player_inventory: PlayerInventoryItem[]
  pets: Pet[]
  runes: Rune[]
  crafting_recipes: CraftingRecipe[]
  waves: Wave[]
  combat_sessions: CombatSession[]
}

class Database {
  private pool: Pool | null = null
  private useJson = false
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      if (DATABASE_URL) {
        try {
          this.pool = new Pool({ connectionString: DATABASE_URL })
          await this.pool.query('SELECT 1')
          await this.ensureTables()
          return
        } catch {
          this.pool = null
          this.useJson = true
        }
      } else {
        this.useJson = true
      }
      await this.ensureJsonFile()
    })()

    return this.initPromise
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) throw new Error('Database not initialized')
    return this.pool.connect()
  }

  private async ensureTables(): Promise<void> {
    if (!this.pool) return
    const statements = [
      `CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, wallet_address TEXT UNIQUE NOT NULL, username TEXT, level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0, gold INTEGER DEFAULT 0, robheroes_balance INTEGER DEFAULT 0, last_active TIMESTAMP, created_at TIMESTAMP DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, totp_secret TEXT, mfa_enabled BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT now(), last_login TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS heroes (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, class TEXT NOT NULL, level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0, hp INTEGER DEFAULT 100, atk INTEGER DEFAULT 10, def INTEGER DEFAULT 5, spd INTEGER DEFAULT 10)`,
      `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT NOT NULL, slot TEXT NOT NULL, rarity TEXT NOT NULL, atk INTEGER DEFAULT 0, def INTEGER DEFAULT 0, hp INTEGER DEFAULT 0, spd INTEGER DEFAULT 0, sockets INTEGER DEFAULT 0, engraving_slots INTEGER DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS player_inventory (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, item_id TEXT NOT NULL, equipped BOOLEAN DEFAULT false, gems JSONB DEFAULT '[]'::jsonb, engraving TEXT)`,
      `CREATE TABLE IF NOT EXISTS pets (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, name TEXT NOT NULL, bonus_type TEXT NOT NULL, bonus_value INTEGER DEFAULT 0, equipped BOOLEAN DEFAULT false)`,
      `CREATE TABLE IF NOT EXISTS runes (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, branch TEXT NOT NULL, name TEXT NOT NULL, points INTEGER DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS crafting_recipes (id TEXT PRIMARY KEY, result_item_id TEXT NOT NULL, materials JSONB NOT NULL, result_count INTEGER DEFAULT 1)`,
      `CREATE TABLE IF NOT EXISTS waves (id TEXT PRIMARY KEY, stage INTEGER NOT NULL, wave_number INTEGER NOT NULL, monsters JSONB NOT NULL, is_boss BOOLEAN DEFAULT false)`,
      `CREATE TABLE IF NOT EXISTS combat_sessions (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, stage INTEGER NOT NULL, difficulty TEXT NOT NULL, result TEXT, xp_earned INTEGER DEFAULT 0, gold_earned INTEGER DEFAULT 0, rewards JSONB DEFAULT '{}'::jsonb, started_at TIMESTAMP DEFAULT now(), ended_at TIMESTAMP)`,
    ]
    for (const sql of statements) {
      await this.pool.query(sql)
    }
  }

  private async ensureJsonFile(): Promise<void> {
    try {
      await fs.access(DB_PATH)
    } catch {
      const initial: JsonData = {
        players: [],
        admins: [],
        heroes: [],
        items: [],
        player_inventory: [],
        pets: [],
        runes: [],
        crafting_recipes: [],
        waves: [],
        combat_sessions: [],
      }
      await this.atomicWrite(DB_PATH, JSON.stringify(initial, null, 2))
    }
  }

  private async atomicWrite(filePath: string, data: string): Promise<void> {
    const dir = path.dirname(filePath)
    const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.writeFile(tmp, data, 'utf-8')
    await fs.rename(tmp, filePath)
  }

  private async readJson(): Promise<JsonData> {
    try {
      const raw = await fs.readFile(DB_PATH, 'utf-8')
      return JSON.parse(raw) as JsonData
    } catch {
      return {
        players: [],
        admins: [],
        heroes: [],
        items: [],
        player_inventory: [],
        pets: [],
        runes: [],
        crafting_recipes: [],
        waves: [],
        combat_sessions: [],
      }
    }
  }

  private mapRow<T>(row: Record<string, unknown>): T {
    return row as unknown as T
  }

  async query<T>(text: string, params?: unknown[]): Promise<T[]> {
    if (this.useJson || !this.pool) {
      return this.jsonQuery<T>(text, params)
    }
    const client = await this.getClient()
    try {
      const result: QueryResult<Record<string, unknown>> = await client.query(text, params)
      return result.rows.map((row) => this.mapRow<T>(row))
    } finally {
      client.release()
    }
  }

  private async jsonQuery<T>(text: string, _params?: unknown[]): Promise<T[]> {
    const data = await this.readJson()
    const lower = text.toLowerCase().trim()
    if (lower.startsWith('select')) {
      if (lower.includes('from players')) return data.players as T[]
      if (lower.includes('from admins')) return data.admins as T[]
      if (lower.includes('from heroes')) return data.heroes as T[]
      if (lower.includes('from items')) return data.items as T[]
      if (lower.includes('from player_inventory')) return data.player_inventory as T[]
      if (lower.includes('from pets')) return data.pets as T[]
      if (lower.includes('from runes')) return data.runes as T[]
      if (lower.includes('from crafting_recipes')) return data.crafting_recipes as T[]
      if (lower.includes('from waves')) return data.waves as T[]
      if (lower.includes('from combat_sessions')) return data.combat_sessions as T[]
    }
    return []
  }

  async players(): Promise<Player[]> {
    return this.query<Player>('SELECT * FROM players')
  }

  async playerByWallet(wallet: string): Promise<Player | null> {
    const rows = await this.query<Player>('SELECT * FROM players WHERE wallet_address = $1', [wallet])
    return rows[0] ?? null
  }

  async playerById(id: string): Promise<Player | null> {
    const rows = await this.query<Player>('SELECT * FROM players WHERE id = $1', [id])
    return rows[0] ?? null
  }

  async createPlayer(player: Player): Promise<Player> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      data.players.push(player)
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return player
    }
    const client = await this.getClient()
    try {
      await client.query('INSERT INTO players (id, wallet_address, username, level, xp, gold, robheroes_balance, last_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [player.id, player.wallet_address, player.username, player.level, player.xp, player.gold, player.robheroes_balance, player.last_active, player.created_at])
      return player
    } finally {
      client.release()
    }
  }

  async updatePlayer(id: string, patch: Partial<Player>): Promise<Player | null> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      const idx = data.players.findIndex((p) => p.id === id)
      if (idx === -1) return null
      data.players[idx] = { ...data.players[idx], ...patch }
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return data.players[idx]
    }
    const client = await this.getClient()
    try {
      const setClauses: string[] = ['id = $1']
      const values: unknown[] = [id]
      let i = 2
      for (const key of Object.keys(patch)) {
        if (key === 'id') continue
        setClauses.push(`${key} = $${i}`)
        values.push((patch as Record<string, unknown>)[key])
        i++
      }
      const result = await client.query(`UPDATE players SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`, values)
      return this.mapRow<Player>(result.rows[0] ?? {})
    } finally {
      client.release()
    }
  }

  async heroes(): Promise<Hero[]> {
    return this.query<Hero>('SELECT * FROM heroes')
  }

  async heroById(id: string): Promise<Hero | null> {
    const rows = await this.query<Hero>('SELECT * FROM heroes WHERE id = $1', [id])
    return rows[0] ?? null
  }

  async heroesByPlayer(playerId: string): Promise<Hero[]> {
    return this.query<Hero>('SELECT * FROM heroes WHERE player_id = $1', [playerId])
  }

  async createHero(hero: Hero): Promise<Hero> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      data.heroes.push(hero)
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return hero
    }
    const client = await this.getClient()
    try {
      await client.query('INSERT INTO heroes (id, player_id, class, level, xp, hp, atk, def, spd) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [hero.id, hero.player_id, hero.class, hero.level, hero.xp, hero.hp, hero.atk, hero.def, hero.spd])
      return hero
    } finally {
      client.release()
    }
  }

  async items(): Promise<Item[]> {
    return this.query<Item>('SELECT * FROM items')
  }

  async itemById(id: string): Promise<Item | null> {
    const rows = await this.query<Item>('SELECT * FROM items WHERE id = $1', [id])
    return rows[0] ?? null
  }

  async createItem(item: Item): Promise<Item> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      data.items.push(item)
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return item
    }
    const client = await this.getClient()
    try {
      await client.query('INSERT INTO items (id, name, slot, rarity, atk, def, hp, spd, sockets, engraving_slots) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [item.id, item.name, item.slot, item.rarity, item.atk, item.def, item.hp, item.spd, item.sockets, item.engraving_slots])
      return item
    } finally {
      client.release()
    }
  }

  async playerInventory(playerId: string): Promise<PlayerInventoryItem[]> {
    return this.query<PlayerInventoryItem>('SELECT * FROM player_inventory WHERE player_id = $1', [playerId])
  }

  async addInventoryItem(item: PlayerInventoryItem): Promise<PlayerInventoryItem> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      data.player_inventory.push(item)
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return item
    }
    const client = await this.getClient()
    try {
      await client.query('INSERT INTO player_inventory (id, player_id, item_id, equipped, gems, engraving) VALUES ($1, $2, $3, $4, $5, $6)', [item.id, item.player_id, item.item_id, item.equipped, JSON.stringify(item.gems), item.engraving])
      return item
    } finally {
      client.release()
    }
  }

  async updateInventoryItem(id: string, patch: Partial<PlayerInventoryItem>): Promise<PlayerInventoryItem | null> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      const idx = data.player_inventory.findIndex((item) => item.id === id)
      if (idx === -1) return null
      data.player_inventory[idx] = { ...data.player_inventory[idx], ...patch }
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return data.player_inventory[idx]
    }
    const client = await this.getClient()
    try {
      const setClauses: string[] = ['id = $1']
      const values: unknown[] = [id]
      let i = 2
      for (const key of Object.keys(patch)) {
        if (key === 'id') continue
        setClauses.push(`${key} = $${i}`)
        values.push((patch as Record<string, unknown>)[key])
        i++
      }
      const result = await client.query(`UPDATE player_inventory SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`, values)
      return this.mapRow<PlayerInventoryItem>(result.rows[0] ?? {})
    } finally {
      client.release()
    }
  }

  async pets(): Promise<Pet[]> {
    return this.query<Pet>('SELECT * FROM pets')
  }

  async petsByPlayer(playerId: string): Promise<Pet[]> {
    return this.query<Pet>('SELECT * FROM pets WHERE player_id = $1', [playerId])
  }

  async runes(): Promise<Rune[]> {
    return this.query<Rune>('SELECT * FROM runes')
  }

  async runesByPlayer(playerId: string): Promise<Rune[]> {
    return this.query<Rune>('SELECT * FROM runes WHERE player_id = $1', [playerId])
  }

  async craftingRecipes(): Promise<CraftingRecipe[]> {
    return this.query<CraftingRecipe>('SELECT * FROM crafting_recipes')
  }

  async waves(): Promise<Wave[]> {
    return this.query<Wave>('SELECT * FROM waves')
  }

  async wavesByStage(stage: number): Promise<Wave[]> {
    return this.query<Wave>('SELECT * FROM waves WHERE stage = $1', [stage])
  }

  async combatSessions(): Promise<CombatSession[]> {
    return this.query<CombatSession>('SELECT * FROM combat_sessions')
  }

  async combatSessionsByPlayer(playerId: string): Promise<CombatSession[]> {
    return this.query<CombatSession>('SELECT * FROM combat_sessions WHERE player_id = $1 ORDER BY started_at DESC', [playerId])
  }

  async createCombatSession(session: CombatSession): Promise<CombatSession> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      data.combat_sessions.push(session)
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return session
    }
    const client = await this.getClient()
    try {
      await client.query('INSERT INTO combat_sessions (id, player_id, stage, difficulty, result, xp_earned, gold_earned, rewards, started_at, ended_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [session.id, session.player_id, session.stage, session.difficulty, session.result, session.xp_earned, session.gold_earned, JSON.stringify(session.rewards), session.started_at, session.ended_at])
      return session
    } finally {
      client.release()
    }
  }

  async updateCombatSession(id: string, patch: Partial<CombatSession>): Promise<CombatSession | null> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      const idx = data.combat_sessions.findIndex((s) => s.id === id)
      if (idx === -1) return null
      data.combat_sessions[idx] = { ...data.combat_sessions[idx], ...patch }
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return data.combat_sessions[idx]
    }
    const client = await this.getClient()
    try {
      const setClauses: string[] = ['id = $1']
      const values: unknown[] = [id]
      let i = 2
      for (const key of Object.keys(patch)) {
        if (key === 'id') continue
        let val = (patch as Record<string, unknown>)[key]
        if (key === 'rewards') val = JSON.stringify(val)
        setClauses.push(`${key} = $${i}`)
        values.push(val)
        i++
      }
      const result = await client.query(`UPDATE combat_sessions SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`, values)
      return this.mapRow<CombatSession>(result.rows[0] ?? {})
    } finally {
      client.release()
    }
  }

  async admins(): Promise<Admin[]> {
    return this.query<Admin>('SELECT * FROM admins')
  }

  async adminByUsername(username: string): Promise<Admin | null> {
    const rows = await this.query<Admin>('SELECT * FROM admins WHERE username = $1', [username])
    return rows[0] ?? null
  }

  async adminById(id: string): Promise<Admin | null> {
    const rows = await this.query<Admin>('SELECT * FROM admins WHERE id = $1', [id])
    return rows[0] ?? null
  }

  async createAdmin(admin: Admin): Promise<Admin> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      data.admins.push(admin)
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return admin
    }
    const client = await this.getClient()
    try {
      await client.query('INSERT INTO admins (id, username, password_hash, totp_secret, mfa_enabled, created_at, last_login) VALUES ($1, $2, $3, $4, $5, $6, $7)', [admin.id, admin.username, admin.password_hash, admin.totp_secret, admin.mfa_enabled, admin.created_at, admin.last_login])
      return admin
    } finally {
      client.release()
    }
  }

  async updateAdmin(id: string, patch: Partial<Admin>): Promise<Admin | null> {
    if (this.useJson || !this.pool) {
      const data = await this.readJson()
      const idx = data.admins.findIndex((a) => a.id === id)
      if (idx === -1) return null
      data.admins[idx] = { ...data.admins[idx], ...patch }
      await this.atomicWrite(DB_PATH, JSON.stringify(data, null, 2))
      return data.admins[idx]
    }
    const client = await this.getClient()
    try {
      const setClauses: string[] = ['id = $1']
      const values: unknown[] = [id]
      let i = 2
      for (const key of Object.keys(patch)) {
        if (key === 'id') continue
        setClauses.push(`${key} = $${i}`)
        values.push((patch as Record<string, unknown>)[key])
        i++
      }
      const result = await client.query(`UPDATE admins SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`, values)
      return this.mapRow<Admin>(result.rows[0] ?? {})
    } finally {
      client.release()
    }
  }
}

export const db = new Database()
