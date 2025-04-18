/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "mdns-js" {
  export interface ServiceRecord {
    addresses?: string[];
    txt?: string[];
    type?: string[];
    port?: number;
  }

  export interface Browser {
    on(event: "ready", listener: () => void): this;
    on(event: "update", listener: (data: ServiceRecord) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    start(): void;
    stop(): void;
    discover(): void;
  }

  export function createBrowser(serviceType: ServiceType): Browser;
  export function tcp(service: string): ServiceType;

  export interface ServiceType {
    name: string;
    protocol: string;
    subtypes: string[];
    description: string;
  }
}

declare module "castv2-client" {
  import { EventEmitter } from "events";

  export interface CastStatus {
    applications?: Array<{
      appId: string;
      displayName: string;
      statusText: string;
      isIdleScreen: boolean;
    }>;
    isActiveInput: boolean;
    isStandBy: boolean;
    volume: {
      level: number;
      muted: boolean;
    };
  }

  export class DefaultReceiver extends EventEmitter {
    constructor();
    close(): void;
    stop(): void;
  }

  export class DefaultMediaReceiver extends EventEmitter {
    constructor();
    close(): void;
    stop(): void;
  }

  export interface LaunchOptions {
    appId?: string;
    [key: string]: any;
  }

  export class Client extends EventEmitter {
    DefaultReceiver: typeof DefaultReceiver;
    connect(host: string, callback: () => void): void;
    getStatus(callback: (err: Error | null, status: CastStatus) => void): void;
    launch(
      App: typeof DefaultMediaReceiver,
      callback: (err: Error | null) => void
    ): void;
    close(): void;
  }
}
