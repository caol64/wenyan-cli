export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export interface ThemeOptions {
    list?: boolean;
    add?: boolean;
    name?: string;
    path?: string;
    rm?: string;
}
