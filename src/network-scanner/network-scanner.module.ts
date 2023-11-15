import { Module } from '@nestjs/common';
import { NetworkScannerService } from './network-scanner.service';
import { DevicesModule } from 'src/devices/devices.module';

@Module({
  imports: [DevicesModule],
  providers: [NetworkScannerService],
})
export class NetworkScannerModule {}
