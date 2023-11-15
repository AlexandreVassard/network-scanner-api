import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { Repository } from 'typeorm';
import { IArpDevice } from 'src/network-scanner/interfaces/arp-device.interface';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private deviceRepository: Repository<Device>,
  ) {}

  async findAll() {
    return this.deviceRepository.find();
  }

  async findByMacAddress(macAddress: string) {
    return this.deviceRepository.findOne({ where: { macAddress } });
  }

  async findByIp(ip: string) {
    return this.deviceRepository.findOne({ where: { ip } });
  }

  async updateIsAlive(device: Device, isAlive: boolean) {
    device.isAlive = isAlive;
    await this.deviceRepository.save(device);
  }

  async refreshDevices(foundDevices: IArpDevice[]) {
    for (const foundDevice of foundDevices) {
      await this.removeOldDevice(foundDevice);
      await this.updateOrCreateDevice(foundDevice);
    }
  }

  async removeOldDevice(foundDevice: IArpDevice) {
    // If mac address exists in database but not same ip, delete entry
    const macAddressFound = await this.findByMacAddress(foundDevice.macAddress);
    if (macAddressFound !== null && macAddressFound.ip !== foundDevice.ip) {
      await this.deviceRepository.remove(macAddressFound);
    }
    // If ip exists in database but not same mac address, delete entry
    const ipFound = await this.findByIp(foundDevice.ip);
    if (ipFound !== null && ipFound.macAddress !== foundDevice.macAddress) {
      await this.deviceRepository.remove(ipFound);
    }
  }

  async updateOrCreateDevice(foundDevice: IArpDevice) {
    const databaseDevice = await this.findByMacAddress(foundDevice.macAddress);
    // Create new device if not found in database
    if (databaseDevice === null) {
      const device = new Device(foundDevice);
      await this.deviceRepository.save(device);
    } else {
      // Update device name if found in database
      if (databaseDevice.name !== foundDevice.name) {
        databaseDevice.name = foundDevice.name;
        await this.deviceRepository.save(databaseDevice);
      }
    }
  }
}
