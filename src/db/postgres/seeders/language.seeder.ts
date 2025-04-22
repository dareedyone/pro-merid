import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import ISO6391 from 'iso-639-1';
import { Language } from '../entities/user/character/language.entity';

export class LanguageSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const codes = ISO6391.getAllCodes();

    await em.persistAndFlush(
      codes.map((code) =>
        em.create(Language, {
          code,
          name: ISO6391.getName(code),
          nativeName: ISO6391.getNativeName(code),
        }),
      ),
    );
  }
}
