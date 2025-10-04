import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { AnchorService } from 'src/feature/anchor/services/anchor.service';
import { AnchorUserService } from 'src/feature/anchor/services/anchor-user.service';
import {
  CreateAnchorDto,
  UpdateAnchorDto,
  AnchorResponseDto,
  AnchorListResponseDto,
} from 'src/feature/anchor/dtos/anchor.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/roles.decorator';
import { UserType } from 'src/common/types/enums/user.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@Controller('admin/anchors')
export class AdminAnchorController {
  constructor(
    private readonly anchorService: AnchorService,
    private readonly anchorUserService: AnchorUserService,
  ) {}

  @Post()
  async createAnchor(@Body() dto: CreateAnchorDto): Promise<AnchorResponseDto> {
    return this.anchorService.createAnchor(dto);
  }

  @Get()
  async getAnchors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<AnchorListResponseDto> {
    return this.anchorService.getAnchors(page, limit);
  }

  @Get(':id')
  async getAnchorById(@Param('id') id: string): Promise<AnchorResponseDto> {
    return this.anchorService.getAnchorById(id);
  }

  @Put(':id')
  async updateAnchor(
    @Param('id') id: string,
    @Body() dto: UpdateAnchorDto,
  ): Promise<AnchorResponseDto> {
    return this.anchorService.updateAnchor(id, dto);
  }

  @Delete(':id')
  async deleteAnchor(@Param('id') id: string): Promise<void> {
    return this.anchorService.deleteAnchor(id);
  }
}
