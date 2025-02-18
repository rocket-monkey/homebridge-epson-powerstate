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
  private seenDevices: Set<string> = new Set(); // Track seen devices to avoid duplicate logs

  constructor(private targetName: string) {
    super();
  }

  public start(): this {
    console.log(
      `Starting Chromecast detection (targeting "${this.targetName}")...`
    );

    this.browser = createBrowser(tcp("googlecast"));

    this.browser?.on("ready", () => {
      this.browser?.discover();
    });

    this.discoveryInterval = setInterval(() => {
      this.browser?.discover();
    }, 5000);

    this.browser?.on("update", async (data: ServiceRecord) => {
      if (!data.addresses?.length) {
        return;
      }

      const name =
        data.txt?.find((txt) => txt.startsWith("fn="))?.slice(3) ||
        "Unknown Device";
      const device: Device = {
        name,
        address: data.addresses[0],
      };

      if (name === "Unknown Device") {
        return;
      }

      const deviceKey = `${device.name}-${device.address}`;

      // Log new devices only once
      if (!this.seenDevices.has(deviceKey)) {
        this.seenDevices.add(deviceKey);
        console.log(
          `Found Chromecast device: "${device.name}" at ${device.address}`
        );
      }

      // Store all devices
      this.devices.set(device.address, device);

      // Handle target device specifically
      if (device.name === this.targetName) {
        this.lastKnownAddress = device.address;

        if (!this.probeInterval) {
          console.log(
            `Target device "${this.targetName}" found at ${device.address}`
          );
          this.startProbing();
        }
      }
    });

    return this;
  }

  public getDiscoveredDevices(): Device[] {
    return Array.from(this.devices.values());
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
            if (typeof status.isStandBy === "undefined") {
              // check if we have applications array
              if (status.applications && status.applications.length > 0) {
                resolve({
                  isOn: true,
                  isStandBy: false,
                });
                return;
              }

              resolve({
                isOn: false,
                isStandBy: true,
              });
            } else {
              resolve({
                isOn: !status.isStandBy,
                isStandBy: status.isStandBy,
              });
            }
          }
        });
      });

      // Set a timeout to avoid hanging
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
    }, 1000);
  }

  private async probeDevice(): Promise<void> {
    if (!this.lastKnownAddress) {
      return;
    }

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
    this.seenDevices.clear();
    this.devices.clear();
  }
}
