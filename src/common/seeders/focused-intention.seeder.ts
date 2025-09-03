import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { FocusedIntention } from '../entity/user/character/focused-intention.entity';

export class FocusedIntentionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const Intentions = [
      {
        name: 'Gym Buddy',
        emoji: '🏋️‍♂️',
      },
      {
        name: 'Study Buddy',
        emoji: '📚',
      },
      {
        name: 'Travel Buddy',
        emoji: '✈️',
      },
      {
        name: 'Language Exchange',
        emoji: '🗣️',
      },
      {
        name: 'Foodie Friends',
        emoji: '🍽️',
      },
      {
        name: 'Gaming Partner',
        emoji: '🎮',
      },
      {
        name: 'Parent Friends',
        emoji: '👨‍👩‍👧‍👦',
      },
      {
        name: 'Career Ally',
        emoji: '💼',
      },
      {
        name: 'Creative Collaborator',
        emoji: '🎨',
      },
      {
        name: 'Pet Friends',
        emoji: '🐾',
      },
      { name: 'Pen Pal', emoji: '✉️' },
    ];

    await em.persistAndFlush(
      Intentions.map((intention) => em.create(FocusedIntention, intention)),
    );
  }
}
