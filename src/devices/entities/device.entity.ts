import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CreateDeviceDto } from '../dto/create-device.dto';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ip: string;

  @Column()
  macAddress: string;

  @Column({ nullable: true })
  name: string | null;

  @Column()
  isAlive: boolean;

  constructor(createDeviceDto: CreateDeviceDto) {
    if (!createDeviceDto) return;
    this.ip = createDeviceDto.ip;
    this.macAddress = createDeviceDto.macAddress;
    this.name = createDeviceDto.name;
    this.isAlive = false;
  }
}
