export interface Options {
    /** Render target width in pixels */
    readonly width: number;
    /** Render target height in pixels */
    readonly height: number;
    readonly epsilon: number;
    readonly steps: number;
    readonly bounces: number;
    readonly iterations: number;
    readonly memory: number;
    readonly cheapNormals: boolean;
    readonly stepFactor: number;
    readonly gamma: number;
}

export function options(values?: {
    width?: number,
    height?: number,
    epsilon?: number,
    steps?: number,
    bounces?: number,
    iterations?: number,
    memory?: number,
    cheapNormals?: boolean,
    stepFactor?: number,
    gamma?: number
}): Options {
    values = values || {};
    return Object.assign({
        width: 256,
        height: 256,
        epsilon: 1e-5,
        steps: 100,
        bounces: 8,
        iterations: 1,
        memory: 1.0,
        cheapNormals: false,
        stepFactor: 0.9,
        gamma: 2.2
    }, values || {});
}
