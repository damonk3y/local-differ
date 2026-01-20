import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

export interface Settings {
  projectPath: string | null
}

const defaultSettings: Settings = {
  projectPath: null
}

export class SettingsService {
  private settingsPath: string
  private settings: Settings

  constructor() {
    const userDataPath = app.getPath('userData')
    this.settingsPath = join(userDataPath, 'settings.json')
    this.settings = this.load()
  }

  private load(): Settings {
    try {
      if (existsSync(this.settingsPath)) {
        const data = readFileSync(this.settingsPath, 'utf-8')
        return { ...defaultSettings, ...JSON.parse(data) }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
    return { ...defaultSettings }
  }

  private save(): void {
    try {
      const dir = join(this.settingsPath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2))
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  getAll(): Settings {
    return { ...this.settings }
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key]
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings[key] = value
    this.save()
  }

  setProjectPath(path: string | null): void {
    this.set('projectPath', path)
  }

  getProjectPath(): string | null {
    return this.get('projectPath')
  }
}
