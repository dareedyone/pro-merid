import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { NotificationService, NotificationType } from '../../system/notification/notification.service';
import { Blog, BlogDocument, BlogStatus } from './entities/blog.entity';
import { Event, EventDocument, EventStatus } from './entities/event.entity';
import {
  SuccessStory,
  SuccessStoryDocument,
  SuccessStoryStatus,
} from './entities/success-story.entity';
import { User } from '../user/entities/user/user.entity';
import {
  CreateBlogDto,
  UpdateBlogDto,
} from './dto/blog.dto';
import {
  CreateEventDto,
  UpdateEventDto,
} from './dto/event.dto';
import {
  CreateSuccessStoryDto,
  UpdateSuccessStoryDto,
} from './dto/success-story.dto';

describe('ContentService', () => {
  let service: ContentService;
  let blogModel: any;
  let eventModel: any;
  let successStoryModel: any;
  let notificationService: any;
  let entityManager: any;

  const mockAuthorId = 'author-123';
  const mockAuthorName = 'Admin User';
  const mockBlogId = 'blog-123';
  const mockEventId = 'event-123';
  const mockStoryId = 'story-123';

  beforeEach(async () => {
      // blogModel is used as a constructor (new this.blogModel)
      const mockBlogModel = jest.fn((data) => ({
        ...data,
        _id: mockBlogId,
        save: jest.fn().mockResolvedValue(undefined),
      })) as jest.MockedFunction<any>;
      (mockBlogModel as any).findOne = jest.fn();
      (mockBlogModel as any).findById = jest.fn();
      (mockBlogModel as any).findByIdAndDelete = jest.fn();
      (mockBlogModel as any).find = jest.fn();
      (mockBlogModel as any).create = jest.fn();
      (mockBlogModel as any).countDocuments = jest.fn();

    const mockEventModel = jest.fn((data) => ({
      ...data,
      _id: mockEventId,
      save: jest.fn().mockResolvedValue(undefined),
    })) as jest.MockedFunction<any>;
    (mockEventModel as any).findOne = jest.fn();
    (mockEventModel as any).findById = jest.fn();
    (mockEventModel as any).find = jest.fn();
    (mockEventModel as any).create = jest.fn();
    (mockEventModel as any).countDocuments = jest.fn();

    const mockSuccessStoryModel = jest.fn((data) => ({
      ...data,
      _id: mockStoryId,
      save: jest.fn().mockResolvedValue(undefined),
    })) as jest.MockedFunction<any>;
    (mockSuccessStoryModel as any).findOne = jest.fn();
    (mockSuccessStoryModel as any).findById = jest.fn();
    (mockSuccessStoryModel as any).find = jest.fn();
    (mockSuccessStoryModel as any).create = jest.fn();
    (mockSuccessStoryModel as any).countDocuments = jest.fn();

    const mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const mockEntityManager = {
      find: jest.fn().mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getModelToken(Blog.name),
          useValue: mockBlogModel,
        },
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(SuccessStory.name),
          useValue: mockSuccessStoryModel,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    blogModel = module.get(getModelToken(Blog.name));
    eventModel = module.get(getModelToken(Event.name));
    successStoryModel = module.get(getModelToken(SuccessStory.name));
    notificationService = module.get(NotificationService);
    entityManager = module.get(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Blog CRUD', () => {
    const createBlogDto: CreateBlogDto = {
      title: 'Test Blog',
      slug: 'test-blog',
      content: 'Test content',
      excerpt: 'Test excerpt',
      status: BlogStatus.DRAFT,
    };

    it('should create a blog successfully', async () => {
      blogModel.findOne.mockResolvedValue(null);
      const mockBlog: any = {
        _id: mockBlogId,
        ...createBlogDto,
        authorId: mockAuthorId,
        authorName: mockAuthorName,
        status: BlogStatus.DRAFT,
        publishedAt: null,
        viewCount: 0,
        likeCount: 0,
        featured: false,
        allowComments: false,
      };
      mockBlog.save = jest.fn().mockResolvedValue(mockBlog);
      blogModel.mockReturnValue(mockBlog);

      const result = await service.createBlog(
        createBlogDto,
        mockAuthorId,
        mockAuthorName,
      );

      expect(result.id).toBe(mockBlogId);
      expect(result.title).toBe(createBlogDto.title);
      expect(blogModel).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate slug', async () => {
      blogModel.findOne.mockResolvedValue({ _id: mockBlogId });

      await expect(
        service.createBlog(createBlogDto, mockAuthorId, mockAuthorName),
      ).rejects.toThrow(ConflictException);
    });

    it('should send notifications when blog is published', async () => {
      const publishedDto = { ...createBlogDto, status: BlogStatus.PUBLISHED };
      blogModel.findOne.mockResolvedValue(null);
      const mockBlog: any = {
        _id: mockBlogId,
        ...publishedDto,
        authorId: mockAuthorId,
        authorName: mockAuthorName,
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
        viewCount: 0,
        likeCount: 0,
        featured: false,
        allowComments: false,
      };
      mockBlog.save = jest.fn().mockResolvedValue(mockBlog);
      blogModel.mockReturnValue(mockBlog);

      await service.createBlog(publishedDto, mockAuthorId, mockAuthorName);

      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(entityManager.find).toHaveBeenCalledWith(User, {
        isActivated: true,
      });
    });

    it('should update a blog successfully', async () => {
      const updateDto: UpdateBlogDto = { title: 'Updated Title' };
      const existingBlog: any = {
        _id: mockBlogId,
        ...createBlogDto,
        authorId: mockAuthorId,
        authorName: mockAuthorName,
        status: BlogStatus.DRAFT,
        publishedAt: null,
        viewCount: 0,
        likeCount: 0,
        featured: false,
        allowComments: false,
      };
      existingBlog.save = jest.fn().mockResolvedValue(existingBlog);
      blogModel.findById.mockResolvedValue(existingBlog);

      const result = await service.updateBlog(mockBlogId, updateDto);

      expect(existingBlog.title).toBe(updateDto.title);
      expect(existingBlog.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent blog', async () => {
      blogModel.findById.mockResolvedValue(null);

      await expect(
        service.updateBlog(mockBlogId, { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should publish a draft blog via update', async () => {
      const draftBlog: any = {
        _id: mockBlogId,
        ...createBlogDto,
        authorId: mockAuthorId,
        authorName: mockAuthorName,
        status: BlogStatus.DRAFT,
        publishedAt: null,
        viewCount: 0,
        likeCount: 0,
        featured: false,
        allowComments: false,
        slug: createBlogDto.slug,
      };
      draftBlog.save = jest.fn().mockResolvedValue(draftBlog);
      blogModel.findById.mockResolvedValue(draftBlog);

      await service.updateBlog(mockBlogId, { status: BlogStatus.PUBLISHED });

      expect(draftBlog.status).toBe(BlogStatus.PUBLISHED);
      expect(draftBlog.publishedAt).toBeInstanceOf(Date);
      expect(draftBlog.save).toHaveBeenCalled();
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('should list blogs with pagination', async () => {
      const mockBlogs = [
        {
          _id: mockBlogId,
          ...createBlogDto,
          status: BlogStatus.PUBLISHED,
          publishedAt: new Date(),
          authorId: mockAuthorId,
          authorName: mockAuthorName,
          viewCount: 0,
          likeCount: 0,
          featured: false,
          allowComments: false,
        },
      ];
      (blogModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBlogs),
      });
      (blogModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.listBlogs(1, 10);

      expect(result.blogs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should delete a blog', async () => {
      blogModel.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: mockBlogId });

      await service.deleteBlog(mockBlogId);

      expect(blogModel.findByIdAndDelete).toHaveBeenCalledWith(mockBlogId);
    });
  });

  describe('Event CRUD', () => {
    const createEventDto: CreateEventDto = {
      title: 'Test Event',
      slug: 'test-event',
      description: 'Test description',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      location: 'Test Location',
      status: EventStatus.DRAFT,
    };

    it('should create an event successfully', async () => {
      eventModel.findOne.mockResolvedValue(null);
      const mockEvent: any = {
        _id: mockEventId,
        ...createEventDto,
        organizerId: mockAuthorId,
        organizerName: mockAuthorName,
        viewCount: 0,
        rsvpCount: 0,
        featured: false,
      };
      mockEvent.save = jest.fn().mockResolvedValue(mockEvent);
      eventModel.mockReturnValue(mockEvent);

      const result = await service.createEvent(
        createEventDto,
        mockAuthorId,
        mockAuthorName,
      );

      expect(result.id).toBe(mockEventId);
      expect(result.title).toBe(createEventDto.title);
    });

    it('should throw ConflictException for duplicate event slug', async () => {
      eventModel.findOne.mockResolvedValue({ _id: mockEventId });

      await expect(
        service.createEvent(createEventDto, mockAuthorId, mockAuthorName),
      ).rejects.toThrow(ConflictException);
    });

    it('should update an event', async () => {
      const updateDto: UpdateEventDto = { title: 'Updated Event' };
      const existingEvent: any = {
        _id: mockEventId,
        ...createEventDto,
        organizerId: mockAuthorId,
        organizerName: mockAuthorName,
        viewCount: 0,
        rsvpCount: 0,
        featured: false,
      };
      existingEvent.save = jest.fn().mockResolvedValue(existingEvent);
      eventModel.findById.mockResolvedValue(existingEvent);

      const result = await service.updateEvent(mockEventId, updateDto);

      expect(existingEvent.title).toBe(updateDto.title);
      expect(existingEvent.save).toHaveBeenCalled();
    });
  });

  describe('Success Story CRUD', () => {
    const createStoryDto: CreateSuccessStoryDto = {
      title: 'Test Story',
      slug: 'test-story',
      content: 'Test content',
      partner1Name: 'Partner 1',
      partner2Name: 'Partner 2',
      status: SuccessStoryStatus.DRAFT,
    };

    it('should create a success story', async () => {
      successStoryModel.findOne.mockResolvedValue(null);
      const mockStory: any = {
        _id: mockStoryId,
        ...createStoryDto,
        authorId: mockAuthorId,
        publishedAt: null,
        viewCount: 0,
        likeCount: 0,
        featured: false,
        anonymous: false,
      };
      mockStory.save = jest.fn().mockResolvedValue(mockStory);
      successStoryModel.mockReturnValue(mockStory);

      const result = await service.createSuccessStory(
        createStoryDto,
        mockAuthorId,
      );

      expect(result.id).toBe(mockStoryId);
      expect(result.title).toBe(createStoryDto.title);
    });

    it('should throw ConflictException for duplicate story slug', async () => {
      successStoryModel.findOne.mockResolvedValue({ _id: mockStoryId });

      await expect(
        service.createSuccessStory(createStoryDto, mockAuthorId),
      ).rejects.toThrow(ConflictException);
    });

    it('should update a success story', async () => {
      const updateDto: UpdateSuccessStoryDto = { title: 'Updated Story' };
      const existingStory: any = {
        _id: mockStoryId,
        ...createStoryDto,
        authorId: mockAuthorId,
        publishedAt: null,
        viewCount: 0,
        likeCount: 0,
        featured: false,
        anonymous: false,
      };
      existingStory.save = jest.fn().mockResolvedValue(existingStory);
      successStoryModel.findById.mockResolvedValue(existingStory);

      const result = await service.updateSuccessStory(mockStoryId, updateDto);

      expect(existingStory.title).toBe(updateDto.title);
      expect(existingStory.save).toHaveBeenCalled();
    });
  });

  describe('getBlogBySlug', () => {
    it('should increment view count when getting blog by slug', async () => {
      const mockBlog: any = {
        _id: mockBlogId,
        title: 'Test Blog',
        slug: 'test-blog',
        content: 'Test content',
        excerpt: 'Test excerpt',
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: mockAuthorId,
        authorName: mockAuthorName,
        viewCount: 0,
        likeCount: 0,
        featured: false,
        allowComments: false,
        tags: [],
        categories: [],
      };
      mockBlog.save = jest.fn().mockResolvedValue(mockBlog);
      blogModel.findOne.mockResolvedValue(mockBlog);

      await service.getBlogBySlug('test-blog');

      expect(mockBlog.viewCount).toBe(1);
      expect(mockBlog.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      blogModel.findOne.mockResolvedValue(null);

      await expect(service.getBlogBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

