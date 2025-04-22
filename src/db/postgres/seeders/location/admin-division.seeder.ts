// import { EntityManager } from '@mikro-orm/core';
// import { Seeder } from '@mikro-orm/seeder';
// import { AdministrativeDivision } from 'src/db/postgres/entities/location/admin-division.entity';
// import { Country } from 'src/db/postgres/entities/location/country.entity';
// import { AdminDivisionType } from 'src/types/enums/location.enum';

// export class AdministrativeSeeder extends Seeder {
//   async run(em: EntityManager): Promise<void> {
//     const countries = await em.find(Country, {});

//     if (countries.length === 0) {
//       throw new Error(
//         'No countries found! Make sure the CountrySeeder runs first.',
//       );
//     }

//     const AlgerianProvinces = [
//       // 🔹 Provinces (Wilayas) - All 58 provinces
//       { name: 'Adrar', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Chlef', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Laghouat', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       {
//         name: 'Oum El Bouaghi',
//         type: AdminDivisionType.PROVINCE,
//         country: 'DZ',
//       },
//       { name: 'Batna', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Béjaïa', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Biskra', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Béchar', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Blida', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Bouira', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tamanrasset', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tébessa', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tlemcen', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tiaret', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tizi Ouzou', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Algiers', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Djelfa', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Jijel', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Sétif', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Saïda', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Skikda', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       {
//         name: 'Sidi Bel Abbès',
//         type: AdminDivisionType.PROVINCE,
//         country: 'DZ',
//       },
//       { name: 'Annaba', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Guelma', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Constantine', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Médéa', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Mostaganem', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: "M'Sila", type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Mascara', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Ouargla', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Oran', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'El Bayadh', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Illizi', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       {
//         name: 'Bordj Bou Arréridj',
//         type: AdminDivisionType.PROVINCE,
//         country: 'DZ',
//       },
//       { name: 'Boumerdès', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'El Tarf', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tindouf', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tissemsilt', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'El Oued', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Khenchela', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Souk Ahras', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Tipaza', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Mila', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Aïn Defla', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Naâma', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       {
//         name: 'Aïn Témouchent',
//         type: AdminDivisionType.PROVINCE,
//         country: 'DZ',
//       },
//       { name: 'Ghardaïa', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       { name: 'Relizane', type: AdminDivisionType.PROVINCE, country: 'DZ' },
//       {
//         name: "Sidi M'Hamed",
//         type: AdminDivisionType.DISTRICT,
//         country: 'DZ',
//         parent: 'Algiers',
//       },
//     ];
//     const ArdrarDistricts = [
//       // Districts (Daïras)
//       { name: 'Adrar District', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Aougrout', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Aoulef', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Bordj Badji Mokhtar', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Charouine', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Fenoughil', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Reggane', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: "T'Sabit", type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Timimoun', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },
//       { name: 'Zaouiet Kounta', type: AdminDivisionType.DISTRICT, country: 'DZ', parent: 'Adrar' },

//       // Cities (Municipalities)
//       { name: 'Adrar City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Adrar District' },
//       { name: 'Aougrout City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Aougrout' },
//       { name: 'Aoulef City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Aoulef' },
//       { name: 'Bordj Badji Mokhtar City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Bordj Badji Mokhtar' },
//       { name: 'Charouine City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Charouine' },
//       { name: 'Fenoughil City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Fenoughil' },
//       { name: 'Reggane City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Reggane' },
//       { name: 'T\'Sabit City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'T\'Sabit' },
//       { name: 'Timimoun City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Timimoun' },
//       { name: 'Zaouiet Kounta City', type: AdminDivisionType.CITY, country: 'DZ', parent: 'Zaouiet Kounta' },
//     ];
//     const AfricanDivisions = [...AlgerianDivisions];

//     // 🔹 Placeholder: European administrative divisions
//     const EuropeanDivisions = [];

//     // 🔹 Placeholder: North American administrative divisions
//     const NorthAmericanDivisions = [];

//     // 🔹 Combine all divisions
//     const divisionData = [
//       ...AfricanDivisions,
//       // ...EuropeanDivisions,
//       // ...NorthAmericanDivisions,
//     ];

//     // 🔹 Map divisions and store parents dynamically
//     const createdDivisions: { [key: string]: AdministrativeDivision } = {};
//     const divisions: AdministrativeDivision[] = [];

//     for (const division of divisionData) {
//       const country = countries.find((c) => c.isoCode === division.country);
//       if (!country) throw new Error(`Country ${division.country} not found!`);

//       const parentDivision = division.parent
//         ? createdDivisions[division.parent]
//         : null;

//       const newDivision = em.create(AdministrativeDivision, {
//         name: division.name,
//         type: division.type,
//         country,
//         parent: parentDivision || null,
//       });

//       createdDivisions[division.name] = newDivision;
//       divisions.push(newDivision);
//     }

//     await em.persistAndFlush(divisions);
//   }
// }
