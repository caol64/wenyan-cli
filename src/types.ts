export interface RenderOptions {
    file?: string;
    theme?: string;
    customTheme?: string;
    highlight: string;
    macStyle: boolean;
    footnote: boolean;
}

export interface PublishOptions extends RenderOptions {
    server?: string;
    apiKey?: string;
    clientVersion?: string;
}

export class AppError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = "AppError";
    }
}
