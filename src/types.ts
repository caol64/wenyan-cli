export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export class AppError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = "AppError";
    }
}
