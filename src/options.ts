/** Rendering configuration */
export interface Options {
    /** Render target width in pixels */
    readonly width: number;
    /** Render target height in pixels */
    readonly height: number;
    /** A value close to 0 */
    readonly epsilon: number;
    /** Raymarching iteration count */
    readonly steps: number;
    /** Total light bounces */
    readonly bounces: number;
    /** Iterations per frame */
    readonly iterations: number;
    /** 
     * Percentage of scene that remains after each iteration. 
     * Use a value less than 1 for an animated scene */
    readonly memory: number;
    /** Use cheaper normal calculation */
    readonly cheapNormals: boolean;
    /** 
     * Step factor used to determine rate or raymarching advancement. 
     * 0 to 1. Smaller numbers can reduce artifacts.  */
    readonly stepFactor: number;
    /** Scene gamma for exposure adjustment */
    readonly gamma: number;
}

/** Rendering configuration */
export interface OptionsOptions {
    /** 
     * Render target width in pixels 
     * 
     * Default: 256
     */
    width?: number;
    /** 
     * Render target height in pixels 
     * 
     * Default: 256
     */
    height?: number;
    /** 
     * A value close to 0 
     * 
     * Default: 1e-5
     */
    epsilon?: number;
    /** 
     * Raymarching iteration count 
     * 
     * Default: 100
     */
    steps?: number;
    /** 
     * Total light bounces 
     * 
     * Default: 8
     */
    bounces?: number;
    /** 
     * Iterations per frame
     * 
     * Default: 1
     */
    iterations?: number;
    /** 
     * Percentage of scene that remains after each iteration. 
     * Use a value less than 1 for an animated scene 
     * 
     * Default: 1
     */
    memory?: number;
    /** 
     * Use cheaper normal calculation 
     * 
     * Default: false
     */
    cheapNormals?: boolean;
    /** 
     * Step factor used to determine rate or raymarching advancement. 
     * 0 to 1. Smaller numbers can reduce artifacts.
     * 
     * Default: 0.9
     */
    stepFactor?: number;
    /** 
     * Scene gamma for exposure adjustment 
     * 
     * Default: 2.2
     */
    gamma?: number;
}

/** Create an [[Options]] */
export function options(values?: OptionsOptions): Options {
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
