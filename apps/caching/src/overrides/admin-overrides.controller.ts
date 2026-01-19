import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import { CreateOverrideDto } from './dto/create-override.dto';
import { UpdateOverrideDto } from './dto/update-override.dto';
import { OverridesService } from './overrides.service';

@Controller('admin/overrides')
export class AdminOverridesController {
  constructor(private readonly overridesService: OverridesService) {}

  @Post()
  create(@Body() createOverrideDto: CreateOverrideDto) {
    return this.overridesService.create(createOverrideDto);
  }

  @Get()
  findAll() {
    return this.overridesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.overridesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOverrideDto: UpdateOverrideDto,
  ) {
    return this.overridesService.update(id, updateOverrideDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.overridesService.remove(id);
  }
}
