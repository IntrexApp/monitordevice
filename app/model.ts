export class ConfigObject {
    db?: DatabaseConfig
    appearance?: AppearanceConfig
}

export class DatabaseConfig {
    host: string
    port: string
    username: string
    password: string
    database: string
}
export class AppearanceConfig {
    color: string
    title: string
}