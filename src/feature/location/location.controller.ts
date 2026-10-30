import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Note: These methods are placeholders - LocationService doesn't implement full CRUD
  // The actual service has processLocation and resolveAndSaveLocation methods
  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    throw new Error('Not implemented - use processLocation or resolveAndSaveLocation');
  }

  @Get()
  findAll() {
    throw new Error('Not implemented');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    throw new Error('Not implemented');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    throw new Error('Not implemented');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new Error('Not implemented');
  }
}
