import type { PlatformAccessory } from "homebridge";

import type { DeviceUpdate } from "./detectPowerState/withChromecast.js";
import { ChromecastDetector } from "./detectPowerState/withChromecast.js";
import { detectPowerStateWithWebinterface } from "./detectPowerState/withWebinterface.js";
import type { EpsonPowerStatePlatform } from "./platform.js";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PlatformEpsonAccessory {
  constructor(
    private readonly platform: EpsonPowerStatePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        "Homebrdige Epson Powerstate by @rvetere",
      )
      .setCharacteristic(this.platform.Characteristic.Model, "Epson Projector")
      .setCharacteristic(this.platform.Characteristic.SerialNumber, "📽️");

    const motionSensorPowerState =
      this.accessory.getService("Epson Powerstate") ||
      this.accessory.addService(
        this.platform.Service.MotionSensor,
        "Epson Powerstate",
        "📽️",
      );

    if (this.accessory.context.device.useChromecast) {
      const detector = new ChromecastDetector(
        this.accessory.context.device.chromecastName,
      );

      detector.on("deviceUpdate", (device: DeviceUpdate) => {
        motionSensorPowerState.updateCharacteristic(
          this.platform.Characteristic.MotionDetected,
          device.isPoweredOn,
        );

        this.platform.log.debug(
          `Triggering motionSensorPowerState for ${device.name}:`,
          device.isPoweredOn,
        );
      });

      detector.start();
    } else if (this.accessory.context.device.protocoll === "chromecast") {
      setInterval(async () => {
        const state = await detectPowerStateWithWebinterface(
          this.accessory.context.device.ip,
        );

        // push the new value to HomeKit
        motionSensorPowerState.updateCharacteristic(
          this.platform.Characteristic.MotionDetected,
          state.isOn,
        );

        this.platform.log.debug(
          `Triggering motionSensorPowerState for ${this.accessory.context.device.ip}:`,
          state.isOn,
        );
      }, 1000);
    }
  }
}
