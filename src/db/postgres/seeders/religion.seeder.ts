import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Religion } from '../entities/user/character/religion.entity';
import { ReligionSect } from '../entities/user/character/religion-sect.entity';

export class ReligionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const religions = [
      {
        name: 'Christianity',
        description: 'A monotheistic religion centered on Jesus Christ.',
      },
      {
        name: 'Islam',
        description: 'A monotheistic religion based on the Quran.',
      },
      {
        name: 'Hinduism',
        description:
          'A diverse set of beliefs and traditions originating in India.',
      },
      {
        name: 'Buddhism',
        description: 'A spiritual tradition focused on enlightenment.',
      },
      {
        name: 'Judaism',
        description:
          'An ancient monotheistic religion with the Torah as its foundation.',
      },
      {
        name: 'Sikhism',
        description:
          'A monotheistic religion founded in the Punjab region of India.',
      },
      {
        name: 'Taoism',
        description:
          'A philosophical and religious tradition emphasizing harmony with the Tao.',
      },
      {
        name: 'Shinto',
        description:
          'An indigenous Japanese religion focused on kami (spirits).',
      },
      {
        name: 'Zoroastrianism',
        description: 'An ancient Persian monotheistic religion.',
      },
      {
        name: 'Baháʼí Faith',
        description: 'A faith promoting unity of all religions and humanity.',
      },
      {
        name: 'Traditional Religion',
        description: 'All traditional religions',
      },
      // Critical for non-religious users - todo skip sects for these
      {
        name: 'Atheism',
        description: 'No belief in deities or supernatural beings.',
      },
      {
        name: 'Agnosticism',
        description:
          'Belief that the existence of deities is unknown or unknowable.',
      },
      {
        name: 'Secular Humanism',
        description:
          'Ethical framework emphasizing human reason and ethics without religion.',
      },
    ];

    await em.persistAndFlush(religions.map((r) => em.create(Religion, r)));

    const religionEntities = await em.find(Religion, {});

    const sects = [
      // Christianity
      {
        name: 'Catholicism',
        religionName: 'Christianity',
        description:
          'The largest Christian branch, led by the Pope and based in the Vatican.',
      },
      {
        name: 'Protestantism',
        religionName: 'Christianity',
        description:
          'A branch of Christianity that emerged from the Reformation, emphasizing faith and scripture.',
      },
      {
        name: 'Eastern Orthodoxy',
        religionName: 'Christianity',
        description:
          'A Christian tradition with historical roots in the Eastern Roman Empire, known for its liturgical traditions and icons.',
      },
      {
        name: 'Oriental Orthodoxy',
        religionName: 'Christianity',
        description:
          'A Christian tradition that includes the Coptic, Armenian, and Ethiopian Orthodox churches.',
      },
      {
        name: 'Restorationism',
        religionName: 'Christianity',
        description:
          'Christian groups that seek to restore the original New Testament church, including Mormons and Jehovah’s Witnesses.',
      },

      // Islam
      {
        name: 'Sunni',
        religionName: 'Islam',
        description:
          'The largest branch of Islam, following the teachings of Prophet Muhammad and the four caliphs.',
      },
      {
        name: 'Shia',
        religionName: 'Islam',
        description:
          'A major Islamic branch believing in the leadership of Ali and his descendants as rightful successors to Muhammad.',
      },
      {
        name: 'Ibadi',
        religionName: 'Islam',
        description:
          'An early and distinct sect of Islam mainly found in Oman and North Africa.',
      },
      {
        name: 'Ahmadiyya',
        religionName: 'Islam',
        description:
          'A reformist Islamic movement that believes in Mirza Ghulam Ahmad as the Mahdi and Messiah.',
      },
      {
        name: 'Sufism',
        religionName: 'Islam',
        description:
          'A mystical Islamic tradition focused on inner spirituality and divine love.',
      },

      // Hinduism
      {
        name: 'Vaishnavism',
        religionName: 'Hinduism',
        description:
          'A major tradition of Hinduism centered on the worship of Vishnu and his avatars, such as Krishna and Rama.',
      },
      {
        name: 'Shaivism',
        religionName: 'Hinduism',
        description:
          'A tradition that primarily worships Shiva as the Supreme Being.',
      },
      {
        name: 'Shaktism',
        religionName: 'Hinduism',
        description:
          'A sect focused on the worship of the Divine Mother or Goddess (Shakti).',
      },
      {
        name: 'Smartism',
        religionName: 'Hinduism',
        description:
          'A liberal Hindu sect that allows the worship of multiple deities, including Vishnu, Shiva, and Devi.',
      },

      // Buddhism
      {
        name: 'Theravāda',
        religionName: 'Buddhism',
        description:
          'The oldest Buddhist school, emphasizing monastic discipline and the earliest scriptures.',
      },
      {
        name: 'Mahayana',
        religionName: 'Buddhism',
        description:
          'A broad tradition emphasizing compassion and the potential for all beings to attain enlightenment.',
      },
      {
        name: 'Vajrayana',
        religionName: 'Buddhism',
        description:
          'A form of Buddhism incorporating esoteric teachings and tantric practices.',
      },
      {
        name: 'Zen',
        religionName: 'Buddhism',
        description:
          'A school of Mahayana Buddhism emphasizing meditation and direct experience of enlightenment.',
      },

      // Judaism
      {
        name: 'Orthodox Judaism',
        religionName: 'Judaism',
        description:
          'A traditionalist branch of Judaism that adheres strictly to Jewish law and teachings.',
      },
      {
        name: 'Reform Judaism',
        religionName: 'Judaism',
        description:
          'A progressive movement that adapts Jewish traditions to modern values and society.',
      },
      {
        name: 'Conservative Judaism',
        religionName: 'Judaism',
        description:
          'A middle-ground approach that balances tradition and modernity in Jewish practice.',
      },
      {
        name: 'Reconstructionist Judaism',
        religionName: 'Judaism',
        description:
          'A modern movement that views Judaism as a constantly evolving civilization.',
      },
      {
        name: 'Hasidic Judaism',
        religionName: 'Judaism',
        description:
          'A mystical branch of Orthodox Judaism known for its devotion and charismatic leadership.',
      },

      // Sikhism
      {
        name: 'Khalsa',
        religionName: 'Sikhism',
        description:
          'A warrior-saint order of Sikhs who uphold the strict code of Sikh discipline and wear the five Ks.',
      },
      {
        name: 'Nanakpanthi',
        religionName: 'Sikhism',
        description:
          'A sect of Sikhs who follow the teachings of Guru Nanak but may not adhere strictly to Khalsa traditions.',
      },

      // Taoism
      {
        name: 'Philosophical Taoism',
        religionName: 'Taoism',
        description:
          'A school of Taoism emphasizing naturalism, spontaneity, and the teachings of Laozi.',
      },
      {
        name: 'Religious Taoism',
        religionName: 'Taoism',
        description:
          'A sect that incorporates rituals, deities, and esoteric practices within Taoist beliefs.',
      },

      // Shinto
      {
        name: 'State Shinto',
        religionName: 'Shinto',
        description:
          'A nationalistic form of Shinto that emphasized emperor worship in pre-WWII Japan.',
      },
      {
        name: 'Sect Shinto',
        religionName: 'Shinto',
        description:
          'A branch of Shinto comprising independent religious movements outside state control.',
      },
      {
        name: 'Folk Shinto',
        religionName: 'Shinto',
        description:
          'A local, community-based practice of Shinto focused on shrine worship and ancestral veneration.',
      },

      // Zoroastrianism
      {
        name: 'Mazdayasna',
        religionName: 'Zoroastrianism',
        description:
          'The main form of Zoroastrianism, focusing on the worship of Ahura Mazda and dualistic cosmology.',
      },
      {
        name: 'Zurvanism',
        religionName: 'Zoroastrianism',
        description:
          'A former sect of Zoroastrianism that believed in Zurvan as the primordial deity and source of both good and evil.',
      },

      // Baháʼí Faith
      {
        name: 'Unitarian Baháʼí',
        religionName: 'Baháʼí Faith',
        description:
          'A belief system within Baháʼí Faith emphasizing the oneness of God and religion.',
      },
      {
        name: 'Orthodox Baháʼí',
        religionName: 'Baháʼí Faith',
        description:
          'A sect of Baháʼí Faith that adheres to the original leadership succession of the faith.',
      },
      // Traditional Religion
      {
        name: 'African Traditional Religion',
        religionName: 'Traditional Religion',
        description:
          'A diverse range of indigenous spiritual traditions practiced across Africa, often centered on ancestor worship and nature spirits.',
      },
      {
        name: 'Native American Spirituality',
        religionName: 'Traditional Religion',
        description:
          'The spiritual beliefs of indigenous tribes in North and South America, incorporating rituals, nature reverence, and storytelling.',
      },
      {
        name: 'Australian Aboriginal Spirituality',
        religionName: 'Traditional Religion',
        description:
          'A belief system of Aboriginal Australians focused on the Dreamtime and ancestral spirits.',
      },
      {
        name: 'Shamanism',
        religionName: 'Traditional Religion',
        description:
          'A global spiritual practice in indigenous cultures where shamans communicate with spirits for healing and guidance.',
      },
      {
        name: 'Paganism',
        religionName: 'Traditional Religion',
        description:
          'A broad term for pre-Christian indigenous European spiritual traditions, including Celtic, Norse, and Greco-Roman beliefs.',
      },
    ];

    const sectEntities = sects
      .map((s) => {
        const religion = religionEntities.find(
          (r) => r.name === s.religionName,
        );
        if (!religion) return null;
        return em.create(ReligionSect, { name: s.name, religion });
      })
      .filter(Boolean);

    await em.persistAndFlush(sectEntities);
  }
}
