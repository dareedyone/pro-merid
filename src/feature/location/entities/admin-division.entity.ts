import {
  Entity,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  Property,
} from '@mikro-orm/core';
import { AdminDivisionType } from 'src/common/types/enums/location.enum';
import { Country } from './country.entity';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';

@Entity()
export class AdministrativeDivision extends BaseSingleEntity {
  // Boundary (Polygon)
  @Property({ columnType: 'geometry(Polygon, 4326)', nullable: true })
  boundary?: object; // GeoJSON Polygon (MikroORM stores as `geometry` in PostGIS)

  // Centroid (Point)
  @Property({ columnType: 'geometry(Point, 4326)', nullable: true })
  centroidCoordinates?: object; // GeoJSON Point

  @Property({
    items: () => AdminDivisionType,
    default: AdminDivisionType.STATE,
  })
  type!: AdminDivisionType;

  @ManyToOne(() => Country)
  country!: Country;

  @ManyToOne(() => AdministrativeDivision, { nullable: true })
  parent?: AdministrativeDivision;

  @OneToMany(() => AdministrativeDivision, (division) => division.parent)
  subDivisions = new Collection<AdministrativeDivision>(this);
}
