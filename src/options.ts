
export type Options = {
    width: number,
    height: number,
    epsilon: number,
    steps: number,
    bounces: number,
    iterations: number,
    memory: number,
    cheapNormals: boolean
}

export function options(values?: {
    width?: number,
    height?: number,
    epsilon?: number,
    steps?: number,
    bounces?: number,
    iterations?: number,
    memory?: number,
    cheapNormals?: boolean
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
        cheapNormals: false
    }, values || {});
}
