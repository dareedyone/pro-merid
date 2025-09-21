import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { FocusedIntention } from '../../feature/friends/entities/focused-intention.entity';
import { FocusedIntentionCategory } from '../../feature/friends/entities/focused-intention-category';

export class FocusedIntentionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const categories = [
      {
        name: 'Activity and Lifestyle',
        emoji: '🏃',
        intentions: [
          { name: 'Gym Buddy', emoji: '🏋️‍♂️' },
          { name: 'Hobby or Skills Partner', emoji: '🎨' },
          { name: 'Book Club or Media Discussions', emoji: '📚' },
          { name: 'Food and Drinks', emoji: '🍷' },
          { name: 'Parent Friends', emoji: '👶' },
          { name: 'New in Town', emoji: '🗺️' },
        ],
      },
      {
        name: 'Exploration and Events',
        emoji: '🎉',
        intentions: [
          { name: 'Travel Companions', emoji: '✈️' },
          { name: 'Concerts, Festivals, Exhibits', emoji: '🎵' },
          { name: 'Nightlife and Social Outings', emoji: '🍻' },
          { name: 'Adventure and Outdoors', emoji: '🏔️' },
        ],
      },
      {
        name: 'Virtual and Casual',
        emoji: '🌐',
        intentions: [
          { name: 'Gaming Friends', emoji: '🎮' },
          { name: 'Online Chats and Pen Pals', emoji: '💬' },
          { name: 'Late-Night Chat Friends', emoji: '🌙' },
        ],
      },
      {
        name: 'Growth and Collaboration',
        emoji: '💼',
        intentions: [
          { name: 'Study or Accountability Partner', emoji: '📝' },
          { name: 'Creative Collaboration', emoji: '🎶' },
          { name: 'Professional Networking and Mentorship', emoji: '🤝' },
        ],
      },
      {
        name: 'Connection and Support',
        emoji: '💖',
        intentions: [
          { name: 'Emotional Support and Venting', emoji: '🤗' },
          { name: 'LGBTQ+ and Identity-Based Groups', emoji: '🏳️‍🌈' },
          { name: 'Life Stage Communities', emoji: '👨‍👩‍👧‍👦' },
          { name: 'Wellness and Check-In Buddy', emoji: '🧘' },
        ],
      },
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const category = em.create(FocusedIntentionCategory, {
        name: categoryData.name,
        emoji: categoryData.emoji,
      });
      createdCategories.push(category);
      await em.persist(category);
    }

    await em.flush();

    const allIntentions = [];
    for (let i = 0; i < categories.length; i++) {
      const categoryData = categories[i];
      const category = createdCategories[i];

      for (const intentionData of categoryData.intentions) {
        const intention = em.create(FocusedIntention, {
          name: intentionData.name,
          emoji: intentionData.emoji,
          category: category,
        });
        allIntentions.push(intention);
        await em.persist(intention);
      }
    }

    await em.flush();
  }
}
