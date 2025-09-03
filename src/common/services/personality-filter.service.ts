import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { DatingFilter } from '../../feature/dating/entities/dating.filter';

@Injectable()
export class PersonalityFilterService {
  /**
   * Applies personality trait filters
   */
  applyPersonalityFilters(
    qb: QueryBuilder<any>,
    filters: DatingFilter,
    personalityAlias: string = 'pers',
    userAlias: string = 'u',
  ): void {
    // Financial attitude filter
    if (filters.financialAttitude) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'pers.financialAttitude BETWEEN ? AND ?',
        [filters.financialAttitude.min, filters.financialAttitude.max],
      );
    }

    // Honesty filter
    if (filters.honesty) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'pers.honestLevel BETWEEN ? AND ?',
        [filters.honesty.min, filters.honesty.max],
      );
    }

    // Kindness filter
    if (filters.kindness) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'pers.kindessLevel BETWEEN ? AND ?',
        [filters.kindness.min, filters.kindness.max],
      );
    }

    // Generosity filter
    if (filters.generousity) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'pers.generousityLevel BETWEEN ? AND ?',
        [filters.generousity.min, filters.generousity.max],
      );
    }

    // Upright filter
    if (filters.upright) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'pers.uprightLevel BETWEEN ? AND ?',
        [filters.upright.min, filters.upright.max],
      );
    }

    // Political filter
    if (filters.political) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'pers.politicalView BETWEEN ? AND ?',
        [filters.political.min, filters.political.max],
      );
    }

    // Dress sense filter (gender-aware)
    if (filters.dressSense) {
      qb.leftJoin('dp.personality', personalityAlias).andWhere(
        'CASE WHEN u.gender = ? THEN pers.dressSenseWomen ELSE pers.dressSenseMen END BETWEEN ? AND ?',
        [
          userAlias === 'u' ? 'u.gender' : userAlias + '.gender',
          filters.dressSense.min,
          filters.dressSense.max,
        ],
      );
    }

    // Personality first filter
    if (filters.personalityFirst) {
      qb.leftJoin('dp.personality', personalityAlias);
      qb.andWhere('pers.id IS NOT NULL');
    }
  }

  /**
   * Applies TrueFynd personality filters with conditional logic
   */
  applyTrueFyndPersonalityFilters(
    qb: QueryBuilder<any>,
    filters: DatingFilter,
    personalityAlias: string = 'pers',
    userAlias: string = 'u',
  ): void {
    // Financial attitude filter
    qb.andWhere(
      filters.financialAttitude
        ? 'pers.financialAttitude BETWEEN ? AND ?'
        : '1=1',
      filters.financialAttitude
        ? [filters.financialAttitude.min, filters.financialAttitude.max]
        : [],
    );

    // Honesty filter
    qb.andWhere(
      filters.honesty ? 'pers.honestLevel BETWEEN ? AND ?' : '1=1',
      filters.honesty ? [filters.honesty.min, filters.honesty.max] : [],
    );

    // Kindness filter
    qb.andWhere(
      filters.kindness ? 'pers.kindessLevel BETWEEN ? AND ?' : '1=1',
      filters.kindness ? [filters.kindness.min, filters.kindness.max] : [],
    );

    // Generosity filter
    qb.andWhere(
      filters.generousity ? 'pers.generousityLevel BETWEEN ? AND ?' : '1=1',
      filters.generousity
        ? [filters.generousity.min, filters.generousity.max]
        : [],
    );

    // Upright filter
    qb.andWhere(
      filters.upright ? 'pers.uprightLevel BETWEEN ? AND ?' : '1=1',
      filters.upright ? [filters.upright.min, filters.upright.max] : [],
    );

    // Political filter
    qb.andWhere(
      filters.political ? 'pers.politicalView BETWEEN ? AND ?' : '1=1',
      filters.political ? [filters.political.min, filters.political.max] : [],
    );

    // Dress sense filter (gender-aware)
    qb.andWhere(
      filters.dressSense
        ? 'CASE WHEN u.gender = ? THEN pers.dressSenseWomen ELSE pers.dressSenseMen END BETWEEN ? AND ?'
        : '1=1',
      filters.dressSense
        ? [
            userAlias === 'u' ? 'u.gender' : userAlias + '.gender',
            filters.dressSense.min,
            filters.dressSense.max,
          ]
        : [],
    );

    // Personality first filter
    qb.andWhere(filters.personalityFirst ? 'pers.id IS NOT NULL' : '1=1');
  }
}
