import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Profession } from 'src/feature/user/entities/user/character/profession.entity';

export class ProfessionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const professions = [
      // Healthcare & Medicine
      { id: 1, name: 'Doctor' },
      { id: 2, name: 'Nurse' },
      { id: 3, name: 'Dentist' },
      { id: 4, name: 'Pharmacist' },
      { id: 5, name: 'Veterinarian' },
      { id: 6, name: 'Paramedic' },
      { id: 7, name: 'Surgeon' },
      { id: 8, name: 'Psychologist' },
      { id: 9, name: 'Physical Therapist' },
      { id: 10, name: 'Medical Researcher' },

      // Science & Technology
      { id: 11, name: 'Software Engineer' },
      { id: 12, name: 'Data Scientist' },
      { id: 13, name: 'Cybersecurity Analyst' },
      { id: 14, name: 'AI Specialist' },
      { id: 15, name: 'Cloud Architect' },
      { id: 16, name: 'IT Support Specialist' },
      { id: 17, name: 'Game Developer' },
      { id: 18, name: 'Biomedical Engineer' },
      { id: 19, name: 'Astronomer' },
      { id: 20, name: 'Biochemist' },

      // Engineering & Construction
      { id: 21, name: 'Civil Engineer' },
      { id: 22, name: 'Mechanical Engineer' },
      { id: 23, name: 'Electrical Engineer' },
      { id: 24, name: 'Architect' },
      { id: 25, name: 'Urban Planner' },
      { id: 26, name: 'Construction Manager' },
      { id: 27, name: 'Surveyor' },
      { id: 28, name: 'Structural Engineer' },

      // Business & Finance
      { id: 29, name: 'Accountant' },
      { id: 30, name: 'Financial Analyst' },
      { id: 31, name: 'Investment Banker' },
      { id: 32, name: 'Entrepreneur' },
      { id: 33, name: 'Marketing Manager' },
      { id: 34, name: 'Sales Representative' },
      { id: 35, name: 'Human Resources Manager' },
      { id: 36, name: 'Economist' },
      { id: 37, name: 'Tax Consultant' },

      // Legal & Law Enforcement
      { id: 38, name: 'Lawyer' },
      { id: 39, name: 'Judge' },
      { id: 40, name: 'Police Officer' },
      { id: 41, name: 'Detective' },
      { id: 42, name: 'Paralegal' },
      { id: 43, name: 'Correctional Officer' },
      { id: 44, name: 'Legal Consultant' },

      // Education
      { id: 45, name: 'Teacher' },
      { id: 46, name: 'Professor' },
      { id: 47, name: 'Librarian' },
      { id: 48, name: 'Academic Researcher' },
      { id: 49, name: 'Special Education Teacher' },
      { id: 50, name: 'School Counselor' },

      // Arts & Entertainment
      { id: 51, name: 'Musician' },
      { id: 52, name: 'Actor' },
      { id: 53, name: 'Film Director' },
      { id: 54, name: 'Photographer' },
      { id: 55, name: 'Graphic Designer' },
      { id: 56, name: 'Fashion Designer' },
      { id: 57, name: 'Painter' },
      { id: 58, name: 'Dancer' },
      { id: 59, name: 'Writer' },
      { id: 60, name: 'Tattoo Artist' },
      { id: 61, name: 'Comedian' },

      // Media & Communication
      { id: 62, name: 'Journalist' },
      { id: 63, name: 'TV Presenter' },
      { id: 64, name: 'Radio Host' },
      { id: 65, name: 'Podcaster' },
      { id: 66, name: 'Social Media Manager' },
      { id: 67, name: 'Blogger' },
      { id: 68, name: 'Public Relations Specialist' },

      // Sports & Fitness
      { id: 69, name: 'Athlete' },
      { id: 70, name: 'Personal Trainer' },
      { id: 71, name: 'Sports Coach' },
      { id: 72, name: 'Referee' },
      { id: 73, name: 'Yoga Instructor' },
      { id: 74, name: 'Physical Education Teacher' },

      // Hospitality & Tourism
      { id: 75, name: 'Chef' },
      { id: 76, name: 'Hotel Manager' },
      { id: 77, name: 'Bartender' },
      { id: 78, name: 'Tour Guide' },
      { id: 79, name: 'Flight Attendant' },
      { id: 80, name: 'Travel Agent' },
      { id: 81, name: 'Event Planner' },

      // Skilled Trades
      { id: 82, name: 'Electrician' },
      { id: 83, name: 'Plumber' },
      { id: 84, name: 'Mechanic' },
      { id: 85, name: 'Carpenter' },
      { id: 86, name: 'Welder' },
      { id: 87, name: 'Blacksmith' },
      { id: 88, name: 'Tailor' },
      { id: 89, name: 'Fisherman' },

      // Military & Defense
      { id: 90, name: 'Soldier' },
      { id: 91, name: 'Pilot' },
      { id: 92, name: 'Naval Officer' },
      { id: 93, name: 'Defense Analyst' },
      { id: 94, name: 'Security Guard' },

      // Agriculture & Environment
      { id: 95, name: 'Farmer' },
      { id: 96, name: 'Agricultural Scientist' },
      { id: 97, name: 'Forester' },
      { id: 98, name: 'Environmental Scientist' },
      { id: 99, name: 'Zoologist' },
      { id: 100, name: 'Marine Biologist' },

      // Other
      { id: 101, name: 'Freelancer' },
      { id: 102, name: 'Stay-at-Home Parent' },
      { id: 103, name: 'Student' },
      { id: 104, name: 'Unemployed' },
      { id: 105, name: 'Retired' },
    ];

    await em.persistAndFlush(
      professions.map((data) => em.create(Profession, data)),
    );
  }
}
