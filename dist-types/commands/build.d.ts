import { SnowpackConfig } from '../config';
interface DevOptions {
    cwd: string;
    config: SnowpackConfig;
}
export declare function command({ cwd, config }: DevOptions): Promise<void>;
export {};
