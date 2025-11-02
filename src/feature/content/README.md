# Content Management System (CMS)

This module handles blogs, events, and success stories - similar to Muzz.com's content pages.

## Features

### Content Types
- **Blogs**: Articles, tips, updates, news
- **Events**: Local events, meetups, community gatherings
- **Success Stories**: User testimonials and success stories

### Admin Features
- Create, read, update, delete (CRUD) for all content types
- Content scheduling and publishing
- Media management (images, videos)
- Analytics and view tracking

### User Features
- Browse content in-app
- View content in in-app browser
- Push notifications when new content is published
- Filter and search content

## Architecture

### Entities
- `Blog` - Blog posts with rich content
- `Event` - Events with location, date, RSVP
- `SuccessStory` - User testimonials

### Services
- `ContentService` - Core business logic
- `ContentNotificationService` - Handles notifications for new content

### Controllers
- `AdminContentController` - Admin CRUD operations
- `ContentController` - Public content viewing

## API Endpoints

### Admin Endpoints (Requires ADMIN role)
```
POST   /admin/content/blogs           - Create blog
GET    /admin/content/blogs            - List all blogs
GET    /admin/content/blogs/:id        - Get blog details
PUT    /admin/content/blogs/:id         - Update blog
DELETE /admin/content/blogs/:id         - Delete blog

POST   /admin/content/events           - Create event
GET    /admin/content/events            - List all events
GET    /admin/content/events/:id        - Get event details
PUT    /admin/content/events/:id         - Update event
DELETE /admin/content/events/:id         - Delete event

POST   /admin/content/success-stories   - Create success story
GET    /admin/content/success-stories    - List all stories
GET    /admin/content/success-stories/:id - Get story details
PUT    /admin/content/success-stories/:id  - Update story
DELETE /admin/content/success-stories/:id   - Delete story
```

### Public Endpoints
```
GET    /content/blogs              - Get published blogs (paginated)
GET    /content/blogs/:id          - Get blog details
GET    /content/events             - Get upcoming/published events
GET    /content/events/:id          - Get event details
GET    /content/success-stories     - Get published success stories
GET    /content/success-stories/:id - Get story details
```

## Content Publishing Flow

1. Admin creates content (status: `draft`)
2. Admin publishes content (status: `published`)
3. System sends push notifications to all users
4. Users can view content in-app browser
5. System tracks views and engagement

## Notification Integration

When content is published:
- Push notification sent to all users
- WebSocket notification for active users
- Notification includes content type and preview
