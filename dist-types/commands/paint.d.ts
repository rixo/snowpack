/// <reference types="node" />
import { EventEmitter } from 'events';
import { DevScript } from '../config';
export declare function paint(bus: EventEmitter, registeredWorkers: [string, DevScript][], buildMode: {
    dest: string;
} | undefined, devMode: {
    port: number;
    ips: string[];
    startTimeMs: number;
} | undefined): void;
