import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Blog, BlogDocument, BlogStatus } from './entities/blog.entity';
import { Event, EventDocument, EventStatus } from './entities/event.entity';
import {
  SuccessStory,
  SuccessStoryDocument,
  SuccessStoryStatus,
} from './entities/success-story.entity';
import {
  CreateBlogDto,
  UpdateBlogDto,
  BlogResponseDto,
  BlogListResponseDto,
} from './dto/blog.dto';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  EventListResponseDto,
} from './dto/event.dto';
import {
  CreateSuccessStoryDto,
  UpdateSuccessStoryDto,
  SuccessStoryResponseDto,
  SuccessStoryListResponseDto,
} from './dto/success-story.dto';
import {
  NotificationService,
  NotificationType,
} from '../../system/notification/notification.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../user/entities/user/user.entity';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(SuccessStory.name)
    private successStoryModel: Model<SuccessStoryDocument>,
    private readonly notificationService: NotificationService,
    private readonly em: EntityManager,
  ) {}

  // ==================== BLOG METHODS ====================

  /**
   * Create a new blog post (Admin only)
   */
  async createBlog(
    createBlogDto: CreateBlogDto,
    authorId: string,
    authorName?: string,
  ): Promise<BlogResponseDto> {
    // Check if slug already exists
    const existingBlog = await this.blogModel.findOne({
      slug: createBlogDto.slug,
    });

    if (existingBlog) {
      throw new ConflictException('Blog with this slug already exists');
    }

    const blog = new this.blogModel({
      ...createBlogDto,
      authorId,
      authorName,
      status: createBlogDto.status || BlogStatus.DRAFT,
      publishedAt:
        createBlogDto.status === BlogStatus.PUBLISHED ? new Date() : null,
    });

    const savedBlog = await blog.save();

    // If published, send notifications
    if (savedBlog.status === BlogStatus.PUBLISHED) {
      await this.notifyContentPublished('blog', savedBlog);
    }

    return this.mapBlogToResponseDto(savedBlog);
  }

  /**
   * Update a blog post (Admin only)
   */
  async updateBlog(
    id: string,
    updateBlogDto: UpdateBlogDto,
  ): Promise<BlogResponseDto> {
    const blog = await this.blogModel.findById(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Check slug uniqueness if slug is being updated
    if (updateBlogDto.slug && updateBlogDto.slug !== blog.slug) {
      const existingBlog = await this.blogModel.findOne({
        slug: updateBlogDto.slug,
        _id: { $ne: id },
      });

      if (existingBlog) {
        throw new ConflictException('Blog with this slug already exists');
      }
    }

    // Check if status is changing to published
    const isPublishing =
      updateBlogDto.status === BlogStatus.PUBLISHED &&
      blog.status !== BlogStatus.PUBLISHED;

    Object.assign(blog, updateBlogDto);

    if (isPublishing) {
      blog.publishedAt = new Date();
    }

    const savedBlog = await blog.save();

    // Send notifications if newly published
    if (isPublishing) {
      await this.notifyContentPublished('blog', savedBlog);
    }

    return this.mapBlogToResponseDto(savedBlog);
  }

  /**
   * Delete a blog post (Admin only)
   */
  async deleteBlog(id: string): Promise<void> {
    const blog = await this.blogModel.findByIdAndDelete(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
  }

  /**
   * Get blog by ID (Admin - can see drafts)
   */
  async getBlogById(
    id: string,
    includeDrafts = false,
  ): Promise<BlogResponseDto> {
    const blog = await this.blogModel.findById(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    if (!includeDrafts && blog.status !== BlogStatus.PUBLISHED) {
      throw new NotFoundException('Blog not found');
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    return this.mapBlogToResponseDto(blog);
  }

  /**
   * Get blog by slug (Public)
   */
  async getBlogBySlug(slug: string): Promise<BlogResponseDto> {
    const blog = await this.blogModel.findOne({
      slug,
      status: BlogStatus.PUBLISHED,
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    return this.mapBlogToResponseDto(blog);
  }

  /**
   * List blogs (Admin - can see all, Public - published only)
   */
  async listBlogs(
    page: number = 1,
    limit: number = 20,
    includeDrafts = false,
    featured?: boolean,
    category?: string,
    tag?: string,
  ): Promise<BlogListResponseDto> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<Blog> = {};

    if (!includeDrafts) {
      query.status = BlogStatus.PUBLISHED;
    }

    if (featured !== undefined) {
      query.featured = featured;
    }

    if (category) {
      query.categories = { $in: [category] };
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    const [blogs, total] = await Promise.all([
      this.blogModel
        .find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(query),
    ]);

    return {
      blogs: blogs.map((blog) => this.mapBlogToResponseDto(blog)),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  // ==================== EVENT METHODS ====================

  /**
   * Create a new event (Admin only)
   */
  async createEvent(
    createEventDto: CreateEventDto,
    organizerId: string,
    organizerName?: string,
  ): Promise<EventResponseDto> {
    // Check if slug already exists
    const existingEvent = await this.eventModel.findOne({
      slug: createEventDto.slug,
    });

    if (existingEvent) {
      throw new ConflictException('Event with this slug already exists');
    }

    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const event = new this.eventModel({
      ...createEventDto,
      startDate,
      endDate,
      organizerId,
      organizerName,
      status: createEventDto.status || EventStatus.DRAFT,
      publishedAt:
        createEventDto.status === EventStatus.PUBLISHED ? new Date() : null,
    });

    const savedEvent = await event.save();

    // If published, send notifications
    if (savedEvent.status === EventStatus.PUBLISHED) {
      await this.notifyContentPublished('event', savedEvent);
    }

    return this.mapEventToResponseDto(savedEvent);
  }

  /**
   * Update an event (Admin only)
   */
  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check slug uniqueness if slug is being updated
    if (updateEventDto.slug && updateEventDto.slug !== event.slug) {
      const existingEvent = await this.eventModel.findOne({
        slug: updateEventDto.slug,
        _id: { $ne: id },
      });

      if (existingEvent) {
        throw new ConflictException('Event with this slug already exists');
      }
    }

    // Validate dates if being updated
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const startDate = updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : event.startDate;
      const endDate = updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : event.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Check if status is changing to published
    const isPublishing =
      updateEventDto.status === EventStatus.PUBLISHED &&
      event.status !== EventStatus.PUBLISHED;

    Object.assign(event, {
      ...updateEventDto,
      startDate: updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : event.startDate,
      endDate: updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : event.endDate,
    });

    if (isPublishing) {
      event.publishedAt = new Date();
    }

    const savedEvent = await event.save();

    // Send notifications if newly published
    if (isPublishing) {
      await this.notifyContentPublished('event', savedEvent);
    }

    return this.mapEventToResponseDto(savedEvent);
  }

  /**
   * Delete an event (Admin only)
   */
  async deleteEvent(id: string): Promise<void> {
    const event = await this.eventModel.findByIdAndDelete(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }
  }

  /**
   * Get event by ID (Admin - can see drafts)
   */
  async getEventById(
    id: string,
    includeDrafts = false,
  ): Promise<EventResponseDto> {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!includeDrafts && event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }

    // Increment view count
    event.viewCount += 1;
    await event.save();

    return this.mapEventToResponseDto(event);
  }

  /**
   * Get event by slug (Public)
   */
  async getEventBySlug(slug: string): Promise<EventResponseDto> {
    const event = await this.eventModel.findOne({
      slug,
      status: EventStatus.PUBLISHED,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Increment view count
    event.viewCount += 1;
    await event.save();

    return this.mapEventToResponseDto(event);
  }

  /**
   * List events (Admin - can see all, Public - published only)
   */
  async listEvents(
    page: number = 1,
    limit: number = 20,
    includeDrafts = false,
    featured?: boolean,
    upcoming?: boolean,
    tag?: string,
  ): Promise<EventListResponseDto> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<Event> = {};

    if (!includeDrafts) {
      query.status = EventStatus.PUBLISHED;
    }

    if (featured !== undefined) {
      query.featured = featured;
    }

    if (upcoming) {
      query.startDate = { $gte: new Date() };
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .sort({ startDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.eventModel.countDocuments(query),
    ]);

    return {
      events: events.map((event) => this.mapEventToResponseDto(event)),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  // ==================== SUCCESS STORY METHODS ====================

  /**
   * Create a new success story (Admin only)
   */
  async createSuccessStory(
    createStoryDto: CreateSuccessStoryDto,
    authorId: string,
  ): Promise<SuccessStoryResponseDto> {
    // Check if slug already exists
    const existingStory = await this.successStoryModel.findOne({
      slug: createStoryDto.slug,
    });

    if (existingStory) {
      throw new ConflictException(
        'Success story with this slug already exists',
      );
    }

    const story = new this.successStoryModel({
      ...createStoryDto,
      authorId,
      status: createStoryDto.status || SuccessStoryStatus.DRAFT,
      publishedAt:
        createStoryDto.status === SuccessStoryStatus.PUBLISHED
          ? new Date()
          : null,
    });

    const savedStory = await story.save();

    // If published, send notifications
    if (savedStory.status === SuccessStoryStatus.PUBLISHED) {
      await this.notifyContentPublished('success_story', savedStory);
    }

    return this.mapSuccessStoryToResponseDto(savedStory);
  }

  /**
   * Update a success story (Admin only)
   */
  async updateSuccessStory(
    id: string,
    updateStoryDto: UpdateSuccessStoryDto,
  ): Promise<SuccessStoryResponseDto> {
    const story = await this.successStoryModel.findById(id);

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    // Check slug uniqueness if slug is being updated
    if (updateStoryDto.slug && updateStoryDto.slug !== story.slug) {
      const existingStory = await this.successStoryModel.findOne({
        slug: updateStoryDto.slug,
        _id: { $ne: id },
      });

      if (existingStory) {
        throw new ConflictException(
          'Success story with this slug already exists',
        );
      }
    }

    // Check if status is changing to published
    const isPublishing =
      updateStoryDto.status === SuccessStoryStatus.PUBLISHED &&
      story.status !== SuccessStoryStatus.PUBLISHED;

    Object.assign(story, updateStoryDto);

    if (isPublishing) {
      story.publishedAt = new Date();
    }

    const savedStory = await story.save();

    // Send notifications if newly published
    if (isPublishing) {
      await this.notifyContentPublished('success_story', savedStory);
    }

    return this.mapSuccessStoryToResponseDto(savedStory);
  }

  /**
   * Delete a success story (Admin only)
   */
  async deleteSuccessStory(id: string): Promise<void> {
    const story = await this.successStoryModel.findByIdAndDelete(id);

    if (!story) {
      throw new NotFoundException('Success story not found');
    }
  }

  /**
   * Get success story by ID (Admin - can see drafts)
   */
  async getSuccessStoryById(
    id: string,
    includeDrafts = false,
  ): Promise<SuccessStoryResponseDto> {
    const story = await this.successStoryModel.findById(id);

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    if (!includeDrafts && story.status !== SuccessStoryStatus.PUBLISHED) {
      throw new NotFoundException('Success story not found');
    }

    // Increment view count
    story.viewCount += 1;
    await story.save();

    return this.mapSuccessStoryToResponseDto(story);
  }

  /**
   * Get success story by slug (Public)
   */
  async getSuccessStoryBySlug(slug: string): Promise<SuccessStoryResponseDto> {
    const story = await this.successStoryModel.findOne({
      slug,
      status: SuccessStoryStatus.PUBLISHED,
    });

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    // Increment view count
    story.viewCount += 1;
    await story.save();

    return this.mapSuccessStoryToResponseDto(story);
  }

  /**
   * List success stories (Admin - can see all, Public - published only)
   */
  async listSuccessStories(
    page: number = 1,
    limit: number = 20,
    includeDrafts = false,
    featured?: boolean,
    tag?: string,
  ): Promise<SuccessStoryListResponseDto> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<SuccessStory> = {};

    if (!includeDrafts) {
      query.status = SuccessStoryStatus.PUBLISHED;
    }

    if (featured !== undefined) {
      query.featured = featured;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    const [stories, total] = await Promise.all([
      this.successStoryModel
        .find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.successStoryModel.countDocuments(query),
    ]);

    return {
      stories: stories.map((story) => this.mapSuccessStoryToResponseDto(story)),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  // ==================== NOTIFICATION HELPERS ====================

  /**
   * Notify all users when content is published
   */
  private async notifyContentPublished(
    contentType: 'blog' | 'event' | 'success_story',
    content: BlogDocument | EventDocument | SuccessStoryDocument,
  ): Promise<void> {
    const notificationType =
      contentType === 'blog'
        ? NotificationType.CONTENT_BLOG_PUBLISHED
        : contentType === 'event'
          ? NotificationType.CONTENT_EVENT_PUBLISHED
          : NotificationType.CONTENT_STORY_PUBLISHED;

    const contentTitle = content.title;
    const contentSlug = content.slug;
    const contentId = content._id.toString();
    const contentPreview =
      'excerpt' in content && content.excerpt
        ? content.excerpt
        : 'shortDescription' in content && content.shortDescription
          ? content.shortDescription
          : undefined;
    const contentImage =
      'coverImage' in content && content.coverImage
        ? content.coverImage
        : undefined;

    // Fetch all active users
    try {
      const users = await this.em.find(User, { isActivated: true });
      const userIds = users.map((user) => user.id);

      // Send notifications in batches (to avoid overwhelming the system)
      // In production, consider using a queue system (Bull/BullMQ) for better performance
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map((userId) =>
            this.notificationService.sendNotification({
              userId,
              type: notificationType,
              data: {
                contentId,
                contentType,
                contentTitle,
                contentSlug,
                contentPreview,
                contentImage,
              },
            }),
          ),
        );
      }
    } catch (error) {
      // Log error but don't fail content publishing
      this.logger.error('Failed to send content notifications:', error);
    }
  }

  // ==================== MAPPING HELPERS ====================

  private mapBlogToResponseDto(blog: BlogDocument): BlogResponseDto {
    return {
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      coverImage: blog.coverImage,
      images: blog.images,
      tags: blog.tags,
      categories: blog.categories,
      status: blog.status,
      publishedAt: blog.publishedAt,
      authorId: blog.authorId,
      authorName: blog.authorName,
      viewCount: blog.viewCount,
      likeCount: blog.likeCount,
      featured: blog.featured,
      allowComments: blog.allowComments,
      createdAt:
        'createdAt' in blog && blog.createdAt instanceof Date
          ? blog.createdAt
          : new Date(),
      updatedAt:
        'updatedAt' in blog && blog.updatedAt instanceof Date
          ? blog.updatedAt
          : new Date(),
    };
  }

  private mapEventToResponseDto(event: EventDocument): EventResponseDto {
    return {
      id: event._id.toString(),
      title: event.title,
      slug: event.slug,
      description: event.description,
      shortDescription: event.shortDescription,
      coverImage: event.coverImage,
      images: event.images,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      locationLat: event.locationLat,
      locationLng: event.locationLng,
      tags: event.tags,
      status: event.status,
      publishedAt: event.publishedAt,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      requiresRSVP: event.requiresRSVP,
      maxAttendees: event.maxAttendees,
      rsvpCount: event.rsvpCount,
      viewCount: event.viewCount,
      featured: event.featured,
      externalUrl: event.externalUrl,
      timezone: event.timezone,
      createdAt:
        'createdAt' in event && event.createdAt instanceof Date
          ? event.createdAt
          : new Date(),
      updatedAt:
        'updatedAt' in event && event.updatedAt instanceof Date
          ? event.updatedAt
          : new Date(),
    };
  }

  private mapSuccessStoryToResponseDto(
    story: SuccessStoryDocument,
  ): SuccessStoryResponseDto {
    return {
      id: story._id.toString(),
      title: story.title,
      slug: story.slug,
      content: story.content,
      excerpt: story.excerpt,
      coverImage: story.coverImage,
      images: story.images,
      partner1Name: story.partner1Name,
      partner2Name: story.partner2Name,
      partner1Avatar: story.partner1Avatar,
      partner2Avatar: story.partner2Avatar,
      location: story.location,
      matchDate: story.matchDate,
      relationshipDate: story.relationshipDate,
      tags: story.tags,
      status: story.status,
      publishedAt: story.publishedAt,
      authorId: story.authorId,
      viewCount: story.viewCount,
      likeCount: story.likeCount,
      featured: story.featured,
      anonymous: story.anonymous,
      createdAt:
        'createdAt' in story && story.createdAt instanceof Date
          ? story.createdAt
          : new Date(),
      updatedAt:
        'updatedAt' in story && story.updatedAt instanceof Date
          ? story.updatedAt
          : new Date(),
    };
  }
}
