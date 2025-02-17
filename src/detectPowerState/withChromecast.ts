import { EventEmitter } from "events";
import { Browser, createBrowser, ServiceRecord, tcp } from "mdns-js";
import { Client } from "castv2-client";

interface Device {
  name: string;
  address: string;
}

export interface DeviceUpdate {
  name: string;
  address: string;
  isPoweredOn: boolean;
}

interface CastStatus {
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

interface DeviceStatus {
  isOn: boolean;
  isStandBy: boolean;
}

export class ChromecastDetector extends EventEmitter {
  private browser: Browser | null = null;
  private devices: Map<string, Device> = new Map();
  private lastConnectionState: boolean | null = null;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private probeInterval: NodeJS.Timeout | null = null;
  private lastKnownAddress: string | null = null;

  constructor(private targetName: string = "Android TV") {
    super();
  }

  public start(): this {
    console.log(`Looking for "${this.targetName}"...`);

    this.browser = createBrowser(tcp("googlecast"));

    this.browser?.on("ready", () => {
      this.browser?.discover();
    });

    this.discoveryInterval = setInterval(() => {
      this.browser?.discover();
    }, 1000);

    this.browser?.on("update", async (data: ServiceRecord) => {
      if (!data.addresses?.length) return;

      const device: Device = {
        name:
          data.txt?.find((txt) => txt.startsWith("fn="))?.slice(3) ||
          "Unknown Device",
        address: data.addresses[0],
      };

      if (device.name === this.targetName) {
        this.lastKnownAddress = device.address;

        if (!this.probeInterval) {
          console.log(`Found "${this.targetName}" at ${device.address}`);
          this.startProbing();
        }

        this.devices.set(device.address, device);
      }
    });

    return this;
  }

  private async checkDeviceStatus(address: string): Promise<DeviceStatus> {
    return new Promise((resolve) => {
      const client = new Client();
      let resolved = false;

      const cleanup = () => {
        if (client) {
          client.removeAllListeners();
          client.close();
        }
      };

      client.on("error", () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ isOn: false, isStandBy: true });
        }
      });

      client.connect(address, () => {
        client.getStatus((err: Error | null, status: CastStatus) => {
          if (err || !status) {
            if (!resolved) {
              resolved = true;
              cleanup();
              resolve({ isOn: false, isStandBy: true });
            }
            return;
          }

          if (!resolved) {
            resolved = true;
            cleanup();
            resolve({
              isOn: true,
              isStandBy: status.isStandBy || false,
            });
          }
        });
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ isOn: false, isStandBy: true });
        }
      }, 5000);
    });
  }

  private startProbing(): void {
    this.probeDevice();
    this.probeInterval = setInterval(() => {
      this.probeDevice();
    }, 5000);
  }

  private async probeDevice(): Promise<void> {
    if (!this.lastKnownAddress) return;

    try {
      const status = await this.checkDeviceStatus(this.lastKnownAddress);
      const device = this.devices.get(this.lastKnownAddress);

      if (device && this.lastConnectionState !== !status.isStandBy) {
        this.lastConnectionState = !status.isStandBy;
        this.emit("deviceUpdate", {
          name: this.targetName,
          address: this.lastKnownAddress,
          isPoweredOn: !status.isStandBy,
        } as DeviceUpdate);
      }
    } catch (error) {
      // Silent error handling
    }
  }

  public stop(): void {
    if (this.browser) {
      this.browser.stop();
      this.browser = null;
    }
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    if (this.probeInterval) {
      clearInterval(this.probeInterval);
      this.probeInterval = null;
    }
  }
}
