import { Test, TestingModule } from '@nestjs/testing';
import { NetworkScannerService } from './network-scanner.service';

describe('NetworkScannerService', () => {
  let service: NetworkScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NetworkScannerService],
    }).compile();

    service = module.get<NetworkScannerService>(NetworkScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
