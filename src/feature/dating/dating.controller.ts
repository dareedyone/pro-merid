import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { DatingService } from './dating.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserType } from 'src/common/types/enums/user.enum';
import { Roles } from 'src/common/guards/roles.decorator';
import {
  CreateDatingProfileDto,
  UpdateDatingProfileDto,
} from './dto/dating-profile.dto';
import { Request } from 'express';
import {
  CreateDatingPersonalityDto,
  UpdateDatingPersonalityDto,
} from './dto/dating-personality.dto';
import {
  CreateDatingRelationshipDto,
  UpdateDatingRelationshipDto,
} from './dto/dating-relationship.dto';
import {
  CreateLocationProfileMediaDto,
  RemoveMediaDto,
  UpdateMediaDto,
} from 'src/common/dtos/location-media.dto';
import { CreateLocationProfileDto } from 'src/common/dtos/base-location-profile.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.USER)
@Controller('dating')
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  @Post()
  createProfile(@Req() req: Request, @Body() dto: CreateDatingProfileDto) {
    const authId = req?.user?.sub;
    return this.datingService.addProfile(authId, dto);
  }

  @Patch()
  updateProfile(@Req() req: Request, @Body() dto: UpdateDatingProfileDto) {
    const authId = req?.user?.sub;
    return this.datingService.updateProfile(authId, dto);
  }

  @Post('personality')
  createPersonality(
    @Req() req: Request,
    @Body() dto: CreateDatingPersonalityDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addPersonality(authId, dto);
  }

  @Patch('personality')
  updatePersonality(
    @Req() req: Request,
    @Body() dto: UpdateDatingPersonalityDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.updatePersonality(authId, dto);
  }

  @Post('relationship')
  createRelationship(
    @Req() req: Request,
    @Body() dto: CreateDatingRelationshipDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addRelationship(authId, dto);
  }

  @Patch('relationship')
  updateRelationship(
    @Req() req: Request,
    @Body() dto: UpdateDatingRelationshipDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.updateRelationship(authId, dto);
  }

  @Post('location-profile')
  createLocationProfile(
    @Req() req: Request,
    @Body() dto: CreateLocationProfileDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addLocationProfile(authId, dto);
  }

  @Post('location-profile/media')
  createLocationProfileMedia(
    @Req() req: Request,
    @Body() dto: CreateLocationProfileMediaDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addLocationProfileMedia(authId, dto);
  }

  @Patch('location-profile/media')
  updateLocationProfileMedia(@Req() req: Request, @Body() dto: UpdateMediaDto) {
    const authId = req?.user?.sub;
    return this.datingService.updateLocationProfileMedia(authId, dto);
  }
  @Delete('location-profile/media')
  removeLocationProfileMedia(@Req() req: Request, @Body() dto: RemoveMediaDto) {
    const authId = req?.user?.sub;
    return this.datingService.removeLocationProfileMedia(authId, dto);
  }
}
