import { Module } from '@nestjs/common';
import { VendureService } from './vendure.service';

@Module({
    providers: [VendureService],
    exports: [VendureService],
})
export class VendureModule { }
