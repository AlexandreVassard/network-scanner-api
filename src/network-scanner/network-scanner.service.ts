import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { IArpDevice } from './interfaces/arp-device.interface';
import { DevicesService } from 'src/devices/devices.service';
import { Device } from 'src/devices/entities/device.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NetworkScannerService {
  private doPingDevices: boolean;
  private scanInterval: number;
  private pingTimeout: number;
  private arpInterface: string | undefined;
  private maxPingThreads: number;

  constructor(
    private devicesService: DevicesService,
    configService: ConfigService,
  ) {
    this.doPingDevices = configService.get('PING_DEVICES');
    this.scanInterval = configService.get('SCAN_INTERVAL');
    this.pingTimeout = configService.get('PING_TIMEOUT');
    this.arpInterface = configService.get('ARP_INTERFACE');
    this.maxPingThreads = configService.get('MAX_PING_THREADS');
  }

  async onModuleInit() {
    this.checkDevices();
  }

  async scanNetwork(): Promise<IArpDevice[]> {
    Logger.log('[ARP-SCAN] - Scanning network...', 'NetworkScanner');

    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const macRegex =
      /^[0-9a-f]{1,2}([\.:-])(?:[0-9a-f]{1,2}\1){4}[0-9a-f]{1,2}$/;

    const scanResult = await new Promise<IArpDevice[]>((resolve, reject) => {
      let arpScanOptions = '';
      if (this.arpInterface) {
        arpScanOptions += ` -I ${this.arpInterface}`;
      }

      // Run arp-scan command
      exec(`arp-scan${arpScanOptions} -l`, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error(stderr);
          reject(error);
          return;
        }

        // Parse the output and format it as JSON
        const arpLines = stdout.split('\n');
        const foundDevices: IArpDevice[] = [];
        for (let i = 2; i < arpLines.length; i++) {
          const parts = arpLines[i].split('\t');
          const ip = parts[0];
          const macAddress = parts[1];
          let name = parts[2] || null;
          // Check ip and mac address
          if (!ipRegex.test(ip) || !macRegex.test(macAddress)) {
            // If regex is not good, skip this entry
            continue;
          }
          if (name === '(Unknown: locally administered)') {
            name = null;
          }
          foundDevices.push({
            ip,
            macAddress,
            name,
          });
        }

        resolve(foundDevices);
      });
    });

    Logger.log(
      `[ARP-SCAN] - Network scanned, ${scanResult.length} devices found.`,
      'NetworkScanner',
    );

    return scanResult;
  }

  async ping(ip: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const command = `ping -c 1 -W ${timeout} ${ip}`;
      exec(command, (error) => {
        // Check the exit code of the ping command
        resolve(error ? false : true);
      });

      // Set a timeout for the ping command
      setTimeout(() => {
        resolve(false); // Resolve with false if the ping takes longer than the specified timeout
      }, timeout * 1000);
    });
  }

  async checkDevices() {
    await this.registerDevices();
    if (this.doPingDevices) {
      await this.pingDevices();
    }
    Logger.log(
      `Waiting ${this.scanInterval} seconds to do another scan...`,
      'NetworkScanner',
    );
    setTimeout(this.checkDevices.bind(this), this.scanInterval * 1000);
  }

  async registerDevices() {
    const foundDevices = await this.scanNetwork();
    await this.devicesService.refreshDevices(foundDevices);
  }

  async pingDevices() {
    const devices = await this.devicesService.findAll();
    Logger.log(
      `[PING] - Pinging ${devices.length} devices...`,
      'NetworkScanner',
    );
    const pingThreads = [];
    for (
      let pingThreadIndex = 0;
      pingThreadIndex < this.maxPingThreads && pingThreadIndex < devices.length;
      pingThreadIndex++
    ) {
      pingThreads.push(this.pingThread(devices));
    }
    await Promise.all(pingThreads);
    Logger.log('[PING] - All devices has been pinged.', 'NetworkScanner');
  }

  async pingThread(devices: Device[]) {
    while (devices.length > 0) {
      const device = devices.shift();
      const pingResult = await this.ping(device.ip, this.pingTimeout);
      if (device.isAlive !== pingResult) {
        await this.devicesService.updateIsAlive(device, pingResult);
      }
    }
  }
}
