import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ContinentSeeder } from './location/continent.seeder';
import { CountrySeeder } from './location/country.seeder';
import { EthnicSeeder } from './location/ethnic.seeder';
import { ProfessionSeeder } from './profession.seeder';
import { FocusedIntentionSeeder } from './focused-intention.seeder';

export class BaseSeeder extends Seeder {
  run(em: EntityManager): Promise<void> {
    return this.call(em, [
      ...[
        ContinentSeeder,
        CountrySeeder,
        // AdministraveDivisionSeeder,
        EthnicSeeder,
      ],
      ProfessionSeeder,
      FocusedIntentionSeeder,
    ]);
  }
}
