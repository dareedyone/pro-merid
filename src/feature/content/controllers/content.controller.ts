import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/guards/roles.decorator';
import { UserType } from '../../../common/types/enums/user.enum';
import { ContentService } from '../content.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.USER)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ==================== BLOG ENDPOINTS ====================

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
      false, // Only published for public
      featured === 'true' ? true : featured === 'false' ? false : undefined,
      category,
      tag,
    );
  }

  @Get('blogs/:id')
  async getBlogById(@Param('id') id: string) {
    return this.contentService.getBlogById(id, false); // Only published
  }

  @Get('blogs/slug/:slug')
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.contentService.getBlogBySlug(slug);
  }

  // ==================== EVENT ENDPOINTS ====================

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
      false, // Only published for public
      featured === 'true' ? true : featured === 'false' ? false : undefined,
      upcoming === 'true',
      tag,
    );
  }

  @Get('events/:id')
  async getEventById(@Param('id') id: string) {
    return this.contentService.getEventById(id, false); // Only published
  }

  @Get('events/slug/:slug')
  async getEventBySlug(@Param('slug') slug: string) {
    return this.contentService.getEventBySlug(slug);
  }

  // ==================== SUCCESS STORY ENDPOINTS ====================

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
      false, // Only published for public
      featured === 'true' ? true : featured === 'false' ? false : undefined,
      tag,
    );
  }

  @Get('success-stories/:id')
  async getSuccessStoryById(@Param('id') id: string) {
    return this.contentService.getSuccessStoryById(id, false); // Only published
  }

  @Get('success-stories/slug/:slug')
  async getSuccessStoryBySlug(@Param('slug') slug: string) {
    return this.contentService.getSuccessStoryBySlug(slug);
  }
}
