import { Module } from '@nestjs/common';
import { NetworkScannerModule } from './network-scanner/network-scanner.module';
import { DevicesModule } from './devices/devices.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './devices/entities/device.entity';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from './config/schema';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/network-scanner.db',
      entities: [Device],
      synchronize: true,
    }),
    ConfigModule.forRoot({ isGlobal: true, validationSchema: configSchema }),
    NetworkScannerModule,
    DevicesModule,
  ],
})
export class AppModule {}
