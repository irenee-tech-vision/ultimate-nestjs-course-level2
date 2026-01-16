import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsCacheInterceptor } from './feature-flags-cache.interceptor';
import { FeatureFlagsService } from './feature-flags.service';

@Controller('admin/feature-flags')
@UseInterceptors(FeatureFlagsCacheInterceptor)
@UseInterceptors()
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Post()
  create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.featureFlagsService.create(createFeatureFlagDto);
  }

  @Header('Cache-Control', 'public, max-age=60')
  @Get()
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @CacheTTL(5000)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featureFlagsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagsService.update(id, updateFeatureFlagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.featureFlagsService.remove(id);
  }
}
