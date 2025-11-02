import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/guards/roles.decorator';
import { UserType } from '../../../common/types/enums/user.enum';
import { ContentService } from '../content.service';
import { CreateBlogDto, UpdateBlogDto } from '../dto/blog.dto';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';
import {
  CreateSuccessStoryDto,
  UpdateSuccessStoryDto,
} from '../dto/success-story.dto';
import { AuthService } from '../../auth/auth.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@Controller('admin/content')
export class AdminContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly authService: AuthService,
  ) {}

  // ==================== BLOG ENDPOINTS ====================

  @Post('blogs')
  async createBlog(@Req() req: Request, @Body() createBlogDto: CreateBlogDto) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);
    const authorName =
      user.displayName || `${user.firstName} ${user.lastName}`.trim();

    return this.contentService.createBlog(createBlogDto, user.id, authorName);
  }

  @Get('blogs')
  async listBlogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('featured') featured?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.contentService.listBlogs(
      parseInt(page, 10),
      parseInt(limit, 10),
      true, // Include drafts for admin
      featured === 'true' ? true : featured === 'false' ? false : undefined,
      category,
      tag,
    );
  }

  @Get('blogs/:id')
  async getBlog(@Param('id') id: string) {
    return this.contentService.getBlogById(id, true); // Include drafts for admin
  }

  @Put('blogs/:id')
  async updateBlog(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    return this.contentService.updateBlog(id, updateBlogDto);
  }

  @Delete('blogs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    await this.contentService.deleteBlog(id);
  }

  // ==================== EVENT ENDPOINTS ====================

  @Post('events')
  async createEvent(
    @Req() req: Request,
    @Body() createEventDto: CreateEventDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);
    const organizerName =
      user.displayName || `${user.firstName} ${user.lastName}`.trim();

    return this.contentService.createEvent(
      createEventDto,
      user.id,
      organizerName,
    );
  }

  @Get('events')
  async listEvents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('featured') featured?: string,
    @Query('upcoming') upcoming?: string,
    @Query('tag') tag?: string,
  ) {
    return this.contentService.listEvents(
      parseInt(page, 10),
      parseInt(limit, 10),
      true, // Include drafts for admin
      featured === 'true' ? true : featured === 'false' ? false : undefined,
      upcoming === 'true',
      tag,
    );
  }

  @Get('events/:id')
  async getEvent(@Param('id') id: string) {
    return this.contentService.getEventById(id, true); // Include drafts for admin
  }

  @Put('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.contentService.updateEvent(id, updateEventDto);
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('id') id: string) {
    await this.contentService.deleteEvent(id);
  }

  // ==================== SUCCESS STORY ENDPOINTS ====================

  @Post('success-stories')
  async createSuccessStory(
    @Req() req: Request,
    @Body() createStoryDto: CreateSuccessStoryDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    return this.contentService.createSuccessStory(createStoryDto, user.id);
  }

  @Get('success-stories')
  async listSuccessStories(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('featured') featured?: string,
    @Query('tag') tag?: string,
  ) {
    return this.contentService.listSuccessStories(
      parseInt(page, 10),
      parseInt(limit, 10),
      true, // Include drafts for admin
      featured === 'true' ? true : featured === 'false' ? false : undefined,
      tag,
    );
  }

  @Get('success-stories/:id')
  async getSuccessStory(@Param('id') id: string) {
    return this.contentService.getSuccessStoryById(id, true); // Include drafts for admin
  }

  @Put('success-stories/:id')
  async updateSuccessStory(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateSuccessStoryDto,
  ) {
    return this.contentService.updateSuccessStory(id, updateStoryDto);
  }

  @Delete('success-stories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSuccessStory(@Param('id') id: string) {
    await this.contentService.deleteSuccessStory(id);
  }
}
