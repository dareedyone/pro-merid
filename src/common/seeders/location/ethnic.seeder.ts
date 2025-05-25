import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Country } from 'db/postgres/entity/location/country.entity';
import { Ethnic } from 'db/postgres/entity/location/ethnic.entity';

export class EthnicSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const countries = await em.find(Country, {});
    if (countries.length === 0) {
      throw new Error(
        'No countries found! Make sure the CountrySeeder runs first.',
      );
    }

    const AfricanEthnics = [
      { country: 'Algeria', name: 'Arab' },
      { country: 'Algeria', name: 'Berber' }, // 'Berber (Kabyle, Chaoui, Tuareg, Mozabite)'
      { country: 'Algeria', name: 'Saharan Tuareg' },
      { country: 'Angola', name: 'Ovimbundu' },
      { country: 'Angola', name: 'Ambundu' },
      { country: 'Angola', name: 'Bakongo' },
      { country: 'Angola', name: 'Chokwe' },
      { country: 'Angola', name: 'Lunda' },
      { country: 'Angola', name: 'Nganguela' },
      { country: 'Angola', name: 'Himba' },
      { country: 'Benin', name: 'Fon' },
      { country: 'Benin', name: 'Yoruba' },
      { country: 'Benin', name: 'Bariba' },
      { country: 'Benin', name: 'Ottamari' },
      { country: 'Benin', name: 'Dendi' },
      { country: 'Benin', name: 'Somba' },
      { country: 'Botswana', name: 'Tswana' },
      { country: 'Botswana', name: 'Kalanga' },
      { country: 'Botswana', name: 'Basarwa (San)' },
      { country: 'Botswana', name: 'Mbukushu' },
      { country: 'Botswana', name: 'Yeyi' },
      { country: 'Botswana', name: 'Herero' },
      { country: 'Burkina Faso', name: 'Mossi' },
      { country: 'Burkina Faso', name: 'Fulani (Peul)' },
      { country: 'Burkina Faso', name: 'Gurunsi' },
      { country: 'Burkina Faso', name: 'Bobo' },
      { country: 'Burkina Faso', name: 'Senoufo' },
      { country: 'Burkina Faso', name: 'Lobi' },
      { country: 'Burkina Faso', name: 'Tuareg' },
      { country: 'Burundi', name: 'Hutu' },
      { country: 'Burundi', name: 'Tutsi' },
      { country: 'Burundi', name: 'Twa' },
      { country: 'Cabo Verde', name: 'Creole' },
      { country: 'Cabo Verde', name: 'African' },
      { country: 'Cabo Verde', name: 'European' },
      { country: 'Cameroon', name: 'Bantu' }, // 'Bantu (Ewondo, Bassa, Duala)'
      { country: 'Cameroon', name: 'Bamileke' },
      { country: 'Cameroon', name: 'Fulani' },
      { country: 'Cameroon', name: 'Tikar' },
      { country: 'Cameroon', name: 'Kirdi' },
      { country: 'Cameroon', name: 'Shuwa Arab' },
      { country: 'Central African Republic', name: 'Baya' },
      { country: 'Central African Republic', name: 'Banda' },
      { country: 'Central African Republic', name: 'Mandja' },
      { country: 'Central African Republic', name: 'Sara' },
      { country: 'Central African Republic', name: 'Mbaka' },
      { country: 'Central African Republic', name: 'Yakoma' },
      { country: 'Chad', name: 'Sara' },
      { country: 'Chad', name: 'Arab' },
      { country: 'Chad', name: 'Kanembu' },
      { country: 'Chad', name: 'Hausa' },
      { country: 'Chad', name: 'Tubu' },
      { country: 'Chad', name: 'Gorane' },
      { country: 'Chad', name: 'Fulani' },
      { country: 'Comoros', name: 'Comorian' }, // Comorian (Shikomori)
      { country: 'Comoros', name: 'Malagasy' },
      { country: 'Comoros', name: 'Swahili' },
      { country: 'Comoros', name: 'Arab' },
      { country: 'Democratic Republic of the Congo', name: 'Kongo' },
      { country: 'Democratic Republic of the Congo', name: 'Luba' },
      { country: 'Democratic Republic of the Congo', name: 'Mongo' },
      { country: 'Democratic Republic of the Congo', name: 'Zande' },
      { country: 'Democratic Republic of the Congo', name: 'Hutu' },
      { country: 'Democratic Republic of the Congo', name: 'Tutsi' },
      { country: 'Democratic Republic of the Congo', name: 'Twa' },
      { country: 'Djibouti', name: 'Somali' },
      { country: 'Djibouti', name: 'Afar' },
      { country: 'Djibouti', name: 'Arab' },
      { country: 'Egypt', name: 'Egyptian Arab' },
      { country: 'Egypt', name: 'Bedouin' },
      { country: 'Egypt', name: 'Nubian' },
      { country: 'Egypt', name: 'Beja' },
      { country: 'Egypt', name: 'Berber (Siwi)' },
      { country: 'Equatorial Guinea', name: 'Fang' },
      { country: 'Equatorial Guinea', name: 'Bubi' },
      { country: 'Equatorial Guinea', name: 'Ndowe' },
      { country: 'Equatorial Guinea', name: 'Annobonese' },
      { country: 'Eritrea', name: 'Tigrinya' },
      { country: 'Eritrea', name: 'Tigre' },
      { country: 'Eritrea', name: 'Afar' },
      { country: 'Eritrea', name: 'Beja' },
      { country: 'Eritrea', name: 'Kunama' },
      { country: 'Eritrea', name: 'Saho' },
      { country: 'Eritrea', name: 'Bilen' },
      { country: 'Eritrea', name: 'Nara' },
      { country: 'Eritrea', name: 'Rashaida' },
      { country: 'Ethiopia', name: 'Oromo' },
      { country: 'Ethiopia', name: 'Amhara' },
      { country: 'Ethiopia', name: 'Tigray' },
      { country: 'Ethiopia', name: 'Sidama' },
      { country: 'Ethiopia', name: 'Gurage' },
      { country: 'Ethiopia', name: 'Somali' },
      { country: 'Ethiopia', name: 'Afar' },
      { country: 'Ethiopia', name: 'Harari' },
      { country: 'Ghana', name: 'Akan (Asante, Fante)' },
      { country: 'Ghana', name: 'Mole-Dagbani' },
      { country: 'Ghana', name: 'Ewe' },
      { country: 'Ghana', name: 'Ga-Dangme' },
      { country: 'Ghana', name: 'Guan' },
      { country: 'Nigeria', name: 'Hausa' },
      { country: 'Nigeria', name: 'Yoruba' },
      { country: 'Nigeria', name: 'Igbo' },
      { country: 'Nigeria', name: 'Fulani' },
      { country: 'Nigeria', name: 'Tiv' },
      { country: 'Nigeria', name: 'Kanuri' },
      { country: 'Nigeria', name: 'Ibibio' },
      { country: 'Nigeria', name: 'Ijaw' },
    ];

    const AsianEthnics = [
      // Afghanistan
      { country: 'Afghanistan', name: 'Pashtun' },
      { country: 'Afghanistan', name: 'Tajik' },
      { country: 'Afghanistan', name: 'Hazara' },
      { country: 'Afghanistan', name: 'Uzbek' },
      { country: 'Afghanistan', name: 'Turkmen' },
      { country: 'Afghanistan', name: 'Baloch' },
      { country: 'Afghanistan', name: 'Nuristani' },
      { country: 'Afghanistan', name: 'Pashai' },

      // Armenia
      { country: 'Armenia', name: 'Armenian' },
      { country: 'Armenia', name: 'Yezidi' },
      { country: 'Armenia', name: 'Kurds' },

      // Azerbaijan
      { country: 'Azerbaijan', name: 'Azeri' },
      { country: 'Azerbaijan', name: 'Lezgins' },
      { country: 'Azerbaijan', name: 'Talysh' },
      { country: 'Azerbaijan', name: 'Avars' },

      // Bahrain
      { country: 'Bahrain', name: 'Bahraini Arab' },
      { country: 'Bahrain', name: 'Persian' },

      // Bangladesh
      { country: 'Bangladesh', name: 'Bengali' },
      { country: 'Bangladesh', name: 'Chakma' },
      { country: 'Bangladesh', name: 'Marma' },
      { country: 'Bangladesh', name: 'Tripuri' },
      { country: 'Bangladesh', name: 'Mro' },

      // Bhutan
      { country: 'Bhutan', name: 'Bhutia' },
      { country: 'Bhutan', name: 'Nepali (Lhotshampa)' },
      { country: 'Bhutan', name: 'Sharchop' },

      // Brunei
      { country: 'Brunei', name: 'Malay' },
      { country: 'Brunei', name: 'Dusun' },
      { country: 'Brunei', name: 'Iban' },

      // Cambodia
      { country: 'Cambodia', name: 'Khmer' },
      { country: 'Cambodia', name: 'Cham' },
      { country: 'Cambodia', name: 'Kuy' },

      // China
      { country: 'China', name: 'Han Chinese' },
      { country: 'China', name: 'Zhuang' },
      { country: 'China', name: 'Hui' },
      { country: 'China', name: 'Uyghur' },
      { country: 'China', name: 'Tibetan' },
      { country: 'China', name: 'Miao' },

      // Cyprus
      { country: 'Cyprus', name: 'Greek Cypriot' },
      { country: 'Cyprus', name: 'Turkish Cypriot' },

      // Georgia
      { country: 'Georgia', name: 'Georgian' },
      { country: 'Georgia', name: 'Mingrelian' },
      { country: 'Georgia', name: 'Svan' },

      // India
      { country: 'India', name: 'Indo-Aryan' },
      { country: 'India', name: 'Dravidian' },
      { country: 'India', name: 'Tibeto-Burman' },
      { country: 'India', name: 'Austroasiatic' },

      // Indonesia
      { country: 'Indonesia', name: 'Javanese' },
      { country: 'Indonesia', name: 'Sundanese' },
      { country: 'Indonesia', name: 'Batak' },
      { country: 'Indonesia', name: 'Minangkabau' },

      // Iran
      { country: 'Iran', name: 'Persian' },
      { country: 'Iran', name: 'Azeri' },
      { country: 'Iran', name: 'Kurds' },
      { country: 'Iran', name: 'Lurs' },

      // Iraq
      { country: 'Iraq', name: 'Arab' },
      { country: 'Iraq', name: 'Kurd' },
      { country: 'Iraq', name: 'Turkmen' },

      // Israel
      { country: 'Israel', name: 'Jewish' },
      { country: 'Israel', name: 'Arab' },

      // Japan
      { country: 'Japan', name: 'Yamato' },
      { country: 'Japan', name: 'Ainu' },
      { country: 'Japan', name: 'Ryukyuan' },

      // Jordan
      { country: 'Jordan', name: 'Arab' },
      { country: 'Jordan', name: 'Circassian' },

      // Kazakhstan
      { country: 'Kazakhstan', name: 'Kazakh' },
      { country: 'Kazakhstan', name: 'Russian' },

      // Kuwait
      { country: 'Kuwait', name: 'Arab' },

      // Kyrgyzstan
      { country: 'Kyrgyzstan', name: 'Kyrgyz' },
      { country: 'Kyrgyzstan', name: 'Uzbek' },

      // Laos
      { country: 'Laos', name: 'Lao' },
      { country: 'Laos', name: 'Hmong' },

      // Lebanon
      { country: 'Lebanon', name: 'Arab' },
      { country: 'Lebanon', name: 'Armenian' },

      // Malaysia
      { country: 'Malaysia', name: 'Malay' },
      { country: 'Malaysia', name: 'Orang Asli' },

      // Maldives
      { country: 'Maldives', name: 'Dhivehi' },

      // Mongolia
      { country: 'Mongolia', name: 'Khalkha Mongol' },

      // Myanmar
      { country: 'Myanmar', name: 'Bamar' },
      { country: 'Myanmar', name: 'Karen' },

      // Nepal
      { country: 'Nepal', name: 'Chhetri' },
      { country: 'Nepal', name: 'Bahun' },

      // North Korea
      { country: 'North Korea', name: 'Korean' },

      // Oman
      { country: 'Oman', name: 'Arab' },

      // Pakistan
      { country: 'Pakistan', name: 'Punjabi' },
      { country: 'Pakistan', name: 'Sindhi' },

      // Philippines
      { country: 'Philippines', name: 'Tagalog' },
      { country: 'Philippines', name: 'Cebuano' },

      // Saudi Arabia
      { country: 'Saudi Arabia', name: 'Arab' },

      // South Korea
      { country: 'South Korea', name: 'Korean' },

      // Turkey
      { country: 'Turkey', name: 'Turkish' },
      { country: 'Turkey', name: 'Kurd' },

      // Vietnam
      { country: 'Vietnam', name: 'Kinh' },
      { country: 'Vietnam', name: 'Tay' },
    ];

    const AustralianEthnics = [
      // Australia
      { country: 'Australia', name: 'Aboriginal Australian' },
      { country: 'Australia', name: 'Torres Strait Islander' },

      // Fiji
      { country: 'Fiji', name: 'iTaukei (Indigenous Fijians)' },
      { country: 'Fiji', name: 'Rotuman' },

      // Kiribati
      { country: 'Kiribati', name: 'I-Kiribati' },

      // Marshall Islands
      { country: 'Marshall Islands', name: 'Marshallese' },

      // Micronesia (Federated States of Micronesia)
      { country: 'Micronesia', name: 'Chuukese' },
      { country: 'Micronesia', name: 'Pohnpeian' },
      { country: 'Micronesia', name: 'Kosraean' },
      { country: 'Micronesia', name: 'Yapese' },

      // Nauru
      { country: 'Nauru', name: 'Nauruan' },

      // New Zealand
      { country: 'New Zealand', name: 'Māori' },

      // Palau
      { country: 'Palau', name: 'Palauan' },
      { country: 'Palau', name: 'Sonsorolese' },
      { country: 'Palau', name: 'Tobian' },

      // Papua New Guinea
      { country: 'Papua New Guinea', name: 'Melanesian' },
      { country: 'Papua New Guinea', name: 'Papuans' },
      { country: 'Papua New Guinea', name: 'Austronesian' },

      // Samoa
      { country: 'Samoa', name: 'Samoan' },

      // Solomon Islands
      { country: 'Solomon Islands', name: 'Melanesian' },
      { country: 'Solomon Islands', name: 'Polynesian' },
      { country: 'Solomon Islands', name: 'Micronesian' },

      // Tonga
      { country: 'Tonga', name: 'Tongan' },

      // Tuvalu
      { country: 'Tuvalu', name: 'Tuvaluan' },

      // Vanuatu
      { country: 'Vanuatu', name: 'Ni-Vanuatu' },
      { country: 'Vanuatu', name: 'Melanesian' },
      { country: 'Vanuatu', name: 'Polynesian' },
      { country: 'Vanuatu', name: 'Micronesian' },
    ];

    const EuropeanEthnics = [
      // Albania
      { country: 'Albania', name: 'Albanian' },
      { country: 'Albania', name: 'Aromanian' },

      // Andorra
      { country: 'Andorra', name: 'Andorran' },

      // Armenia
      { country: 'Armenia', name: 'Armenian' },
      { country: 'Armenia', name: 'Yazidi' },
      { country: 'Armenia', name: 'Assyrian' },

      // Austria
      { country: 'Austria', name: 'Austrian' },

      // Azerbaijan
      { country: 'Azerbaijan', name: 'Azerbaijani' },
      { country: 'Azerbaijan', name: 'Lezgin' },
      { country: 'Azerbaijan', name: 'Talysh' },

      // Belarus
      { country: 'Belarus', name: 'Belarusian' },

      // Belgium
      { country: 'Belgium', name: 'Flemish' },
      { country: 'Belgium', name: 'Walloon' },

      // Bosnia and Herzegovina
      { country: 'Bosnia and Herzegovina', name: 'Bosniak' },
      { country: 'Bosnia and Herzegovina', name: 'Serb' },
      { country: 'Bosnia and Herzegovina', name: 'Croat' },

      // Bulgaria
      { country: 'Bulgaria', name: 'Bulgarian' },

      // Croatia
      { country: 'Croatia', name: 'Croat' },

      // Cyprus
      { country: 'Cyprus', name: 'Greek Cypriot' },
      { country: 'Cyprus', name: 'Turkish Cypriot' },

      // Czech Republic
      { country: 'Czech Republic', name: 'Czech' },
      { country: 'Czech Republic', name: 'Moravian' },

      // Denmark
      { country: 'Denmark', name: 'Danish' },
      { country: 'Denmark', name: 'Faroese' },
      { country: 'Denmark', name: 'Greenlander (Inuit)' },

      // Estonia
      { country: 'Estonia', name: 'Estonian' },
      { country: 'Estonia', name: 'Seto' },

      // Finland
      { country: 'Finland', name: 'Finnish' },
      { country: 'Finland', name: 'Swedish-speaking Finns' },
      { country: 'Finland', name: 'Sami' },

      // France
      { country: 'France', name: 'French' },
      { country: 'France', name: 'Breton' },
      { country: 'France', name: 'Corsican' },
      { country: 'France', name: 'Occitan' },
      { country: 'France', name: 'Alsatian' },

      // Georgia
      { country: 'Georgia', name: 'Georgian' },
      { country: 'Georgia', name: 'Mingrelian' },
      { country: 'Georgia', name: 'Svan' },
      { country: 'Georgia', name: 'Laz' },

      // Germany
      { country: 'Germany', name: 'German' },
      { country: 'Germany', name: 'Sorbian' },
      { country: 'Germany', name: 'Frisian' },

      // Greece
      { country: 'Greece', name: 'Greek' },
      { country: 'Greece', name: 'Pomak' },
      { country: 'Greece', name: 'Vlachs' },

      // Hungary
      { country: 'Hungary', name: 'Hungarian' },

      // Iceland
      { country: 'Iceland', name: 'Icelandic' },

      // Ireland
      { country: 'Ireland', name: 'Irish' },

      // Italy
      { country: 'Italy', name: 'Italian' },
      { country: 'Italy', name: 'Sardinian' },
      { country: 'Italy', name: 'Friulian' },
      { country: 'Italy', name: 'Ladin' },

      // Latvia
      { country: 'Latvia', name: 'Latvian' },
      { country: 'Latvia', name: 'Livonian' },

      // Lithuania
      { country: 'Lithuania', name: 'Lithuanian' },

      // Malta
      { country: 'Malta', name: 'Maltese' },

      // Moldova
      { country: 'Moldova', name: 'Moldovan' },
      { country: 'Moldova', name: 'Gagauz' },

      // Netherlands
      { country: 'Netherlands', name: 'Dutch' },
      { country: 'Netherlands', name: 'Frisian' },

      // Norway
      { country: 'Norway', name: 'Norwegian' },
      { country: 'Norway', name: 'Sami' },

      // Poland
      { country: 'Poland', name: 'Polish' },
      { country: 'Poland', name: 'Kashubian' },

      // Portugal
      { country: 'Portugal', name: 'Portuguese' },

      // Romania
      { country: 'Romania', name: 'Romanian' },
      { country: 'Romania', name: 'Székely (Hungarian subgroup)' },
      { country: 'Romania', name: 'Csángó' },

      // Russia (European part)
      { country: 'Russia', name: 'Russian' },
      { country: 'Russia', name: 'Tatar' },
      { country: 'Russia', name: 'Bashkir' },
      { country: 'Russia', name: 'Chechen' },

      // Serbia
      { country: 'Serbia', name: 'Serb' },
      { country: 'Serbia', name: 'Hungarian (Vojvodina)' },
      { country: 'Serbia', name: 'Roma' },

      // Slovakia
      { country: 'Slovakia', name: 'Slovak' },
      { country: 'Slovakia', name: 'Hungarian' },

      // Slovenia
      { country: 'Slovenia', name: 'Slovene' },

      // Spain
      { country: 'Spain', name: 'Spanish' },
      { country: 'Spain', name: 'Catalan' },
      { country: 'Spain', name: 'Basque' },
      { country: 'Spain', name: 'Galician' },

      // Sweden
      { country: 'Sweden', name: 'Swedish' },
      { country: 'Sweden', name: 'Sami' },

      // Switzerland
      { country: 'Switzerland', name: 'Swiss' },
      { country: 'Switzerland', name: 'Romansh' },

      // Ukraine
      { country: 'Ukraine', name: 'Ukrainian' },
      { country: 'Ukraine', name: 'Crimean Tatar' },

      // United Kingdom
      { country: 'United Kingdom', name: 'English' },
      { country: 'United Kingdom', name: 'Scottish' },
      { country: 'United Kingdom', name: 'Welsh' },
      { country: 'United Kingdom', name: 'Cornish' },
      { country: 'United Kingdom', name: 'Irish (Northern Ireland)' },
    ];

    const NorthAmericanEthnics = [
      // Antigua and Barbuda
      { country: 'Antigua and Barbuda', name: 'Afro-Antiguan' },
      { country: 'Antigua and Barbuda', name: 'Afro-Caribbean' },
      { country: 'Antigua and Barbuda', name: 'European Antiguan' },
      { country: 'Antigua and Barbuda', name: 'Indo-Caribbean' },

      // Bahamas
      { country: 'Bahamas', name: 'Afro-Bahamian' },
      { country: 'Bahamas', name: 'European Bahamian' },

      // Barbados
      { country: 'Barbados', name: 'Afro-Barbadian' },
      { country: 'Barbados', name: 'Indo-Barbadian' },
      { country: 'Barbados', name: 'Euro-Barbadian' },

      // Belize
      { country: 'Belize', name: 'Maya' },
      { country: 'Belize', name: 'Garifuna' },
      { country: 'Belize', name: 'Creole' },
      { country: 'Belize', name: 'Mestizo' },

      // Canada
      { country: 'Canada', name: 'First Nations' },
      { country: 'Canada', name: 'Métis' },
      { country: 'Canada', name: 'Inuit' },

      // Costa Rica
      { country: 'Costa Rica', name: 'Mestizo' },
      { country: 'Costa Rica', name: 'Afro-Costa Rican' },
      { country: 'Costa Rica', name: 'Indigenous Bribri' },
      { country: 'Costa Rica', name: 'Indigenous Cabécar' },

      // Cuba
      { country: 'Cuba', name: 'Afro-Cuban' },
      { country: 'Cuba', name: 'Mestizo' },
      { country: 'Cuba', name: 'European Cuban' },

      // Dominica
      { country: 'Dominica', name: 'Afro-Dominican' },
      { country: 'Dominica', name: 'Carib (Kalinago)' },

      // Dominican Republic
      { country: 'Dominican Republic', name: 'Afro-Dominican' },
      { country: 'Dominican Republic', name: 'Mestizo' },
      { country: 'Dominican Republic', name: 'Taino' },

      // El Salvador
      { country: 'El Salvador', name: 'Mestizo' },
      { country: 'El Salvador', name: 'Pipil' },
      { country: 'El Salvador', name: 'Lenca' },

      // Grenada
      { country: 'Grenada', name: 'Afro-Grenadian' },
      { country: 'Grenada', name: 'Indo-Grenadian' },

      // Guatemala
      {
        country: 'Guatemala',
        name: 'Maya (Kʼicheʼ, Kaqchikel, Qʼeqchiʼ, Mam, etc.)',
      },
      { country: 'Guatemala', name: 'Mestizo' },
      { country: 'Guatemala', name: 'Garifuna' },

      // Haiti
      { country: 'Haiti', name: 'Afro-Haitian' },
      { country: 'Haiti', name: 'Mulatres' },

      // Honduras
      { country: 'Honduras', name: 'Mestizo' },
      { country: 'Honduras', name: 'Garifuna' },
      { country: 'Honduras', name: 'Lenca' },

      // Jamaica
      { country: 'Jamaica', name: 'Afro-Jamaican' },
      { country: 'Jamaica', name: 'Indo-Jamaican' },
      { country: 'Jamaica', name: 'Euro-Jamaican' },

      // Mexico
      { country: 'Mexico', name: 'Mestizo' },
      { country: 'Mexico', name: 'Nahua' },
      { country: 'Mexico', name: 'Zapotec' },
      { country: 'Mexico', name: 'Maya' },
      { country: 'Mexico', name: 'Mixtec' },
      { country: 'Mexico', name: 'Otomí' },

      // Nicaragua
      { country: 'Nicaragua', name: 'Mestizo' },
      { country: 'Nicaragua', name: 'Miskito' },
      { country: 'Nicaragua', name: 'Garifuna' },

      // Panama
      { country: 'Panama', name: 'Mestizo' },
      { country: 'Panama', name: 'Afro-Panamanian' },
      { country: 'Panama', name: 'Ngäbe-Buglé' },

      // Saint Kitts and Nevis
      { country: 'Saint Kitts and Nevis', name: 'Afro-Kittitian' },
      { country: 'Saint Kitts and Nevis', name: 'Euro-Kittitian' },

      // Saint Lucia
      { country: 'Saint Lucia', name: 'Afro-Saint Lucian' },
      { country: 'Saint Lucia', name: 'Indo-Saint Lucian' },

      // Saint Vincent and the Grenadines
      { country: 'Saint Vincent and the Grenadines', name: 'Afro-Vincentian' },
      { country: 'Saint Vincent and the Grenadines', name: 'Garifuna' },

      // Trinidad and Tobago
      { country: 'Trinidad and Tobago', name: 'Afro-Trinidadian' },
      { country: 'Trinidad and Tobago', name: 'Indo-Trinidadian' },

      // United States
      { country: 'United States', name: 'Native American' },
      { country: 'United States', name: 'African American' },
      { country: 'United States', name: 'Hispanic/Latino' },
      { country: 'United States', name: 'European American' },
      { country: 'United States', name: 'Asian American' },
    ];

    const SouthAmericanEthnics = [
      // Argentina
      { country: 'Argentina', name: 'Mestizo' },
      {
        country: 'Argentina',
        name: 'European (Spanish, Italian, German, etc.)',
      },
      { country: 'Argentina', name: 'Indigenous (Mapuche, Qom, Wichí, etc.)' },
      { country: 'Argentina', name: 'Afro-Argentine' },

      // Bolivia
      { country: 'Bolivia', name: 'Quechua' },
      { country: 'Bolivia', name: 'Aymara' },
      { country: 'Bolivia', name: 'Mestizo' },
      { country: 'Bolivia', name: 'Guarani' },

      // Brazil
      {
        country: 'Brazil',
        name: 'Pardo (Mixed race - Indigenous, European, African)',
      },
      {
        country: 'Brazil',
        name: 'European (Portuguese, Italian, German, etc.)',
      },
      { country: 'Brazil', name: 'Indigenous (Tupi, Guarani, Yanomami, etc.)' },
      { country: 'Brazil', name: 'Afro-Brazilian' },

      // Chile
      { country: 'Chile', name: 'Mestizo' },
      { country: 'Chile', name: 'Mapuche' },
      { country: 'Chile', name: 'European (Spanish, German, etc.)' },
      { country: 'Chile', name: 'Aymara' },

      // Colombia
      { country: 'Colombia', name: 'Mestizo' },
      { country: 'Colombia', name: 'Afro-Colombian' },
      { country: 'Colombia', name: 'Indigenous (Wayuu, Nasa, Embera, etc.)' },
      { country: 'Colombia', name: 'European (Spanish, Italian, etc.)' },

      // Ecuador
      { country: 'Ecuador', name: 'Mestizo' },
      { country: 'Ecuador', name: 'Indigenous (Quechua, Shuar, Achuar, etc.)' },
      { country: 'Ecuador', name: 'Afro-Ecuadorian' },
      { country: 'Ecuador', name: 'Montubio' },

      // Guyana
      { country: 'Guyana', name: 'Indo-Guyanese' },
      { country: 'Guyana', name: 'Afro-Guyanese' },
      { country: 'Guyana', name: 'Amerindian (Arawak, Wapishana, etc.)' },
      { country: 'Guyana', name: 'Mixed' },

      // Paraguay
      { country: 'Paraguay', name: 'Mestizo' },
      { country: 'Paraguay', name: 'Guarani' },
      { country: 'Paraguay', name: 'European (Spanish, German, etc.)' },

      // Peru
      { country: 'Peru', name: 'Quechua' },
      { country: 'Peru', name: 'Mestizo' },
      { country: 'Peru', name: 'Aymara' },
      { country: 'Peru', name: 'European (Spanish, Italian, etc.)' },
      { country: 'Peru', name: 'Afro-Peruvian' },

      // Suriname
      { country: 'Suriname', name: 'Hindustani (East Indian)' },
      { country: 'Suriname', name: 'Afro-Surinamese' },
      { country: 'Suriname', name: 'Indigenous (Arawak, Carib, etc.)' },
      { country: 'Suriname', name: 'Javanese' },

      // Uruguay
      { country: 'Uruguay', name: 'European (Spanish, Italian, etc.)' },
      { country: 'Uruguay', name: 'Mestizo' },
      { country: 'Uruguay', name: 'Afro-Uruguayan' },
      { country: 'Uruguay', name: 'Indigenous (Charrúa)' },

      // Venezuela
      { country: 'Venezuela', name: 'Mestizo' },
      { country: 'Venezuela', name: 'Afro-Venezuelan' },
      { country: 'Venezuela', name: 'Indigenous (Wayuu, Warao, Pemon, etc.)' },
      {
        country: 'Venezuela',
        name: 'European (Spanish, Italian, Portuguese, etc.)',
      },
    ];

    const ethnicGroupsData = [
      ...AfricanEthnics,
      ...AsianEthnics,
      ...AustralianEthnics,
      ...EuropeanEthnics,
      ...NorthAmericanEthnics,
      ...SouthAmericanEthnics,
    ];

    const ethnicGroups = ethnicGroupsData.map((ethnic) => {
      const country = countries.find((c) => c.name === ethnic.country);
      if (!country) throw new Error(`Country ${ethnic.country} not found!`);
      return em.create(Ethnic, {
        name: ethnic.name,
        country,
      });
    });

    await em.persistAndFlush(ethnicGroups);
  }
}

// todo add redis, would be used for hotspot caching for location - daily or specific time
