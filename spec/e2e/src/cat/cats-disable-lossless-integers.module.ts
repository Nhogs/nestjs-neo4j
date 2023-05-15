import { Module } from '@nestjs/common';
import { Neo4jModule } from '../../../../lib';
import { CatsDisableLosslessIntegersService } from './cats-disable-lossless-integers.service';
import { CatsDisableLosslessIntegersController } from './cats-disable-lossless-integers.controller';

@Module({
  imports: [Neo4jModule],
  controllers: [CatsDisableLosslessIntegersController],
  providers: [CatsDisableLosslessIntegersService],
})
export class CatsDisableLosslessIntegersModule {}
