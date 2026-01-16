import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Header,
  UseInterceptors,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('admin/feature-flags')
@UseInterceptors(CacheInterceptor)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Post()
  create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.featureFlagsService.create(createFeatureFlagDto);
  }

  @Header("Cache-Control", "public, max-age=60")
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
