export interface Options {
    readonly width: number,
    readonly height: number,
    readonly epsilon: number,
    readonly steps: number,
    readonly bounces: number,
    readonly iterations: number,
    readonly memory: number,
    readonly cheapNormals: boolean,
    readonly stepFactor: number
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
    stepFactor?: number
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
        stepFactor: 0.9
    }, values || {});
}
