import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { InterestCategory } from '../entity/user/character/interest-category.entity';
import { Interest } from '../entity/user/character/interest.entity';

export class InterestSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const categories = [
      {
        name: 'Sport',
      },
      {
        name: 'Arts & Entertainment',
      },
      {
        name: 'Community & Culture',
      },
      {
        name: 'Technology & Science',
      },
      {
        name: 'Outdoor & Adventure',
      },
      {
        name: 'Religion & Spirituality',
      },
      {
        name: 'Food & Drink',
      },
    ];

    await em.persistAndFlush(
      categories.map((category) => em.create(InterestCategory, category)),
    );

    const categoryEntities = await em.find(InterestCategory, {});

    const sports = [
      {
        name: 'Football',
        category: 'Sport',
        emoji: '⚽',
      },
      {
        name: 'Basketball',
        category: 'Sport',
        emoji: '🏀',
      },
      {
        name: 'Tennis',
        category: 'Sport',
        emoji: '🎾',
      },
      {
        name: 'Running',
        category: 'Sport',
        emoji: '🏃',
      },
      {
        name: 'Swimming',
        category: 'Sport',
        emoji: '🏊',
      },
      {
        name: 'Martial Arts',
        category: 'Sport',
        emoji: '🥋',
      },
      {
        name: 'Cycling',
        category: 'Sport',
        emoji: '🚴',
      },
      {
        name: 'Baseball',
        category: 'Sport',
        emoji: '⚾',
      },
      {
        name: 'Golf',
        category: 'Sport',
        emoji: '⛳',
      },
      {
        name: 'Boxing',
        category: 'Sport',
        emoji: '🥊',
      },
      {
        name: 'Wrestling',
        category: 'Sport',
        emoji: '🤼',
      },
      {
        name: 'Table Tennis',
        category: 'Sport',
        emoji: '🏓',
      },
      {
        name: 'Badminton',
        category: 'Sport',
        emoji: '🏸',
      },
      {
        name: 'Cricket',
        category: 'Sport',
        emoji: '🏏',
      },
      {
        name: 'Rugby',
        category: 'Sport',
        emoji: '🏉',
      },
      {
        name: 'Ice Hockey',
        category: 'Sport',
        emoji: '🏒',
      },
      {
        name: 'Surfing',
        category: 'Sport',
        emoji: '🏄',
      },
      {
        name: 'Skateboarding',
        category: 'Sport',
        emoji: '🛹',
      },
      {
        name: 'Horse Riding',
        category: 'Sport',
        emoji: '🐎',
      },
      {
        name: 'Fencing',
        category: 'Sport',
        emoji: '🤺',
      },
      {
        name: 'Archery',
        category: 'Sport',
        emoji: '🏹',
      },
      {
        name: 'Darts',
        category: 'Sport',
        emoji: '🎯',
      },
      {
        name: 'Bowling',
        category: 'Sport',
        emoji: '🎳',
      },
      {
        name: 'Weightlifting',
        category: 'Sport',
        emoji: '🏋️',
      },
      {
        name: 'Gymnastics',
        category: 'Sport',
        emoji: '🤸',
      },
      {
        name: 'Parkour',
        category: 'Sport',
        emoji: '🤾',
      },
      {
        name: 'E-sports',
        category: 'Sport',
        emoji: '🎮',
      },
    ];

    const artsAndEntertainment = [
      {
        name: 'Music',
        category: 'Arts & Entertainment',
        emoji: '🎵',
      },
      {
        name: 'Singing',
        category: 'Arts & Entertainment',
        emoji: '🎤',
      },
      {
        name: 'Dancing',
        category: 'Arts & Entertainment',
        emoji: '💃',
      },
      {
        name: 'Acting',
        category: 'Arts & Entertainment',
        emoji: '🎭',
      },
      {
        name: 'Theater',
        category: 'Arts & Entertainment',
        emoji: '🎟️',
      },
      {
        name: 'Cinema',
        category: 'Arts & Entertainment',
        emoji: '🎬',
      },
      {
        name: 'Photography',
        category: 'Arts & Entertainment',
        emoji: '📸',
      },
      {
        name: 'Painting',
        category: 'Arts & Entertainment',
        emoji: '🎨',
      },
      {
        name: 'Sculpting',
        category: 'Arts & Entertainment',
        emoji: '🗿',
      },
      {
        name: 'Drawing',
        category: 'Arts & Entertainment',
        emoji: '✏️',
      },
      {
        name: 'Fashion',
        category: 'Arts & Entertainment',
        emoji: '👗',
      },
      {
        name: 'Design',
        category: 'Arts & Entertainment',
        emoji: '🖌️',
      },
      {
        name: 'Literature',
        category: 'Arts & Entertainment',
        emoji: '📖',
      },
      {
        name: 'Writing',
        category: 'Arts & Entertainment',
        emoji: '✍️',
      },
      {
        name: 'Poetry',
        category: 'Arts & Entertainment',
        emoji: '📝',
      },
      {
        name: 'Comedy',
        category: 'Arts & Entertainment',
        emoji: '😂',
      },
      {
        name: 'Magic',
        category: 'Arts & Entertainment',
        emoji: '🪄',
      },
      {
        name: 'Circus',
        category: 'Arts & Entertainment',
        emoji: '🎪',
      },
      {
        name: 'Video Editing',
        category: 'Arts & Entertainment',
        emoji: '📹',
      },
      {
        name: 'Podcasting',
        category: 'Arts & Entertainment',
        emoji: '🎙️',
      },
      {
        name: 'Board Games',
        category: 'Arts & Entertainment',
        emoji: '🎲',
      },
      {
        name: 'Gaming',
        category: 'Arts & Entertainment',
        emoji: '🎮',
      },
      {
        name: 'Anime',
        category: 'Arts & Entertainment',
        emoji: '🎌',
      },
      {
        name: 'Cosplay',
        category: 'Arts & Entertainment',
        emoji: '👘',
      },
      {
        name: 'Collecting',
        category: 'Arts & Entertainment',
        emoji: '📦',
      },
      {
        name: 'Tattoo Art',
        category: 'Arts & Entertainment',
        emoji: '🎭',
      },
      {
        name: 'Graphic Design',
        category: 'Arts & Entertainment',
        emoji: '🖥️',
      },
      {
        name: 'Calligraphy',
        category: 'Arts & Entertainment',
        emoji: '🖋️',
      },
      {
        name: 'Origami',
        category: 'Arts & Entertainment',
        emoji: '📜',
      },
      {
        name: 'Karaoke',
        category: 'Arts & Entertainment',
        emoji: '🎶',
      },
      {
        name: 'Musical Instruments',
        category: 'Arts & Entertainment',
        emoji: '🎸',
      },
    ];

    const communityAndCulture = [
      {
        name: 'Volunteering',
        category: 'Community & Culture',
        emoji: '🤝',
      },
      {
        name: 'Philanthropy',
        category: 'Community & Culture',
        emoji: '💖',
      },
      {
        name: 'Charity Work',
        category: 'Community & Culture',
        emoji: '🎗️',
      },
      {
        name: 'Human Rights',
        category: 'Community & Culture',
        emoji: '✊',
      },
      {
        name: 'Social Activism',
        category: 'Community & Culture',
        emoji: '📢',
      },
      {
        name: 'Public Speaking',
        category: 'Community & Culture',
        emoji: '🗣️',
      },
      {
        name: 'Civic Engagement',
        category: 'Community & Culture',
        emoji: '🏛️',
      },
      {
        name: 'Cultural Exchange',
        category: 'Community & Culture',
        emoji: '🌏',
      },
      {
        name: 'Local Traditions',
        category: 'Community & Culture',
        emoji: '🎎',
      },
      {
        name: 'Folklore',
        category: 'Community & Culture',
        emoji: '📜',
      },
      {
        name: 'Genealogy',
        category: 'Community & Culture',
        emoji: '🧬',
      },
      {
        name: 'Ethnic Festivals',
        category: 'Community & Culture',
        emoji: '🎊',
      },
      {
        name: 'History',
        category: 'Community & Culture',
        emoji: '🏺',
      },
      {
        name: 'Storytelling',
        category: 'Community & Culture',
        emoji: '📖',
      },
      {
        name: 'Linguistics',
        category: 'Community & Culture',
        emoji: '🔤',
      },
      {
        name: 'Languages',
        category: 'Community & Culture',
        emoji: '🗣️',
      },
      {
        name: 'Multiculturalism',
        category: 'Community & Culture',
        emoji: '🌍',
      },
      {
        name: 'Traditional Music',
        category: 'Community & Culture',
        emoji: '🎻',
      },
      {
        name: 'Traditional Dance',
        category: 'Community & Culture',
        emoji: '💃',
      },
      {
        name: 'Community Gardening',
        category: 'Community & Culture',
        emoji: '🌱',
      },
      {
        name: 'Neighborhood Events',
        category: 'Community & Culture',
        emoji: '🏘️',
      },
      {
        name: 'Book Clubs',
        category: 'Community & Culture',
        emoji: '📚',
      },
      {
        name: 'Debate Clubs',
        category: 'Community & Culture',
        emoji: '🗨️',
      },
      {
        name: 'Mentorship',
        category: 'Community & Culture',
        emoji: '🎓',
      },
      {
        name: 'Religious Gatherings',
        category: 'Community & Culture',
        emoji: '⛪',
      },
      {
        name: 'Cultural Heritage Preservation',
        category: 'Community & Culture',
        emoji: '🏛️',
      },
      {
        name: 'Social Entrepreneurship',
        category: 'Community & Culture',
        emoji: '💼',
      },
      {
        name: 'Networking',
        category: 'Community & Culture',
        emoji: '🔗',
      },
      {
        name: 'Parenting Groups',
        category: 'Community & Culture',
        emoji: '👨‍👩‍👦',
      },
      {
        name: 'Youth Empowerment',
        category: 'Community & Culture',
        emoji: '🌟',
      },
    ];

    const technologyAndScience = [
      {
        name: 'Artificial Intelligence',
        category: 'Technology & Science',
        emoji: '🤖',
      },
      {
        name: 'Machine Learning',
        category: 'Technology & Science',
        emoji: '🧠',
      },
      {
        name: 'Cybersecurity',
        category: 'Technology & Science',
        emoji: '🔒',
      },
      {
        name: 'Blockchain',
        category: 'Technology & Science',
        emoji: '⛓️',
      },
      {
        name: 'Cryptocurrency',
        category: 'Technology & Science',
        emoji: '🪙',
      },
      {
        name: 'Software Development',
        category: 'Technology & Science',
        emoji: '💻',
      },
      {
        name: 'Game Development',
        category: 'Technology & Science',
        emoji: '🎮',
      },
      {
        name: 'Web Development',
        category: 'Technology & Science',
        emoji: '🌐',
      },
      {
        name: 'Mobile App Development',
        category: 'Technology & Science',
        emoji: '📱',
      },
      {
        name: 'Cloud Computing',
        category: 'Technology & Science',
        emoji: '☁️',
      },
      {
        name: 'Big Data',
        category: 'Technology & Science',
        emoji: '📊',
      },
      {
        name: 'Internet of Things (IoT)',
        category: 'Technology & Science',
        emoji: '📡',
      },
      {
        name: '3D Printing',
        category: 'Technology & Science',
        emoji: '🖨️',
      },
      {
        name: 'Drones',
        category: 'Technology & Science',
        emoji: '🚁',
      },
      {
        name: 'Virtual Reality',
        category: 'Technology & Science',
        emoji: '🕶️',
      },
      {
        name: 'Augmented Reality',
        category: 'Technology & Science',
        emoji: '🔍',
      },
      {
        name: 'Robotics',
        category: 'Technology & Science',
        emoji: '🤖',
      },
      {
        name: 'Quantum Computing',
        category: 'Technology & Science',
        emoji: '⚛️',
      },
      {
        name: 'Space Exploration',
        category: 'Technology & Science',
        emoji: '🚀',
      },
      {
        name: 'Astronomy',
        category: 'Technology & Science',
        emoji: '🌠',
      },
      {
        name: 'Physics',
        category: 'Technology & Science',
        emoji: '🧲',
      },
      {
        name: 'Chemistry',
        category: 'Technology & Science',
        emoji: '🧪',
      },
      {
        name: 'Biology',
        category: 'Technology & Science',
        emoji: '🧬',
      },
      {
        name: 'Genetics',
        category: 'Technology & Science',
        emoji: '🧫',
      },
      {
        name: 'Environmental Science',
        category: 'Technology & Science',
        emoji: '🌍',
      },
      {
        name: 'Renewable Energy',
        category: 'Technology & Science',
        emoji: '⚡',
      },
      {
        name: 'Engineering',
        category: 'Technology & Science',
        emoji: '🏗️',
      },
      {
        name: 'Aerospace',
        category: 'Technology & Science',
        emoji: '✈️',
      },
      {
        name: 'Nanotechnology',
        category: 'Technology & Science',
        emoji: '🔬',
      },
      {
        name: 'Biomedical Science',
        category: 'Technology & Science',
        emoji: '💉',
      },
      {
        name: 'Psychology',
        category: 'Technology & Science',
        emoji: '🧠',
      },
      {
        name: 'Neuroscience',
        category: 'Technology & Science',
        emoji: '🧠',
      },
      {
        name: 'Futurism',
        category: 'Technology & Science',
        emoji: '🚀',
      },
      {
        name: 'Ethical Hacking',
        category: 'Technology & Science',
        emoji: '🛡️',
      },
      {
        name: 'Open Source Software',
        category: 'Technology & Science',
        emoji: '📂',
      },
      {
        name: 'Tech Startups',
        category: 'Technology & Science',
        emoji: '🚀',
      },
      {
        name: 'Gadgets & Wearables',
        category: 'Technology & Science',
        emoji: '⌚',
      },
      {
        name: 'Self-Driving Cars',
        category: 'Technology & Science',
        emoji: '🚗',
      },
      {
        name: 'Tech Reviews & Blogs',
        category: 'Technology & Science',
        emoji: '📝',
      },
      {
        name: 'Science Communication',
        category: 'Technology & Science',
        emoji: '📢',
      },
      {
        name: 'Data Science',
        category: 'Technology & Science',
        emoji: '📈',
      },
      {
        name: 'Smart Home Technology',
        category: 'Technology & Science',
        emoji: '🏡',
      },
      {
        name: 'Medical Technology',
        category: 'Technology & Science',
        emoji: '🩺',
      },
    ];

    const outdoorAndAdventure = [
      {
        name: 'Hiking',
        category: 'Outdoor & Adventure',
        emoji: '🥾',
      },
      {
        name: 'Camping',
        category: 'Outdoor & Adventure',
        emoji: '🏕️',
      },
      {
        name: 'Rock Climbing',
        category: 'Outdoor & Adventure',
        emoji: '🧗',
      },
      {
        name: 'Mountain Biking',
        category: 'Outdoor & Adventure',
        emoji: '🚵',
      },
      {
        name: 'Trail Running',
        category: 'Outdoor & Adventure',
        emoji: '🏃‍♂️',
      },
      {
        name: 'Kayaking',
        category: 'Outdoor & Adventure',
        emoji: '🛶',
      },
      {
        name: 'Canoeing',
        category: 'Outdoor & Adventure',
        emoji: '🚣',
      },
      {
        name: 'Surfing',
        category: 'Outdoor & Adventure',
        emoji: '🏄',
      },
      {
        name: 'Scuba Diving',
        category: 'Outdoor & Adventure',
        emoji: '🤿',
      },
      {
        name: 'Snorkeling',
        category: 'Outdoor & Adventure',
        emoji: '🌊',
      },
      {
        name: 'Skiing',
        category: 'Outdoor & Adventure',
        emoji: '⛷️',
      },
      {
        name: 'Snowboarding',
        category: 'Outdoor & Adventure',
        emoji: '🏂',
      },
      {
        name: 'Skydiving',
        category: 'Outdoor & Adventure',
        emoji: '🪂',
      },
      {
        name: 'Paragliding',
        category: 'Outdoor & Adventure',
        emoji: '🪂',
      },
      {
        name: 'Bungee Jumping',
        category: 'Outdoor & Adventure',
        emoji: '🎢',
      },
      {
        name: 'Whitewater Rafting',
        category: 'Outdoor & Adventure',
        emoji: '🚣‍♂️',
      },
      {
        name: 'Fishing',
        category: 'Outdoor & Adventure',
        emoji: '🎣',
      },
      {
        name: 'Hunting',
        category: 'Outdoor & Adventure',
        emoji: '🏹',
      },
      {
        name: 'Wildlife Watching',
        category: 'Outdoor & Adventure',
        emoji: '🦅',
      },
      {
        name: 'Stargazing',
        category: 'Outdoor & Adventure',
        emoji: '✨',
      },
      {
        name: 'Geocaching',
        category: 'Outdoor & Adventure',
        emoji: '🗺️',
      },
      {
        name: 'Off-Roading',
        category: 'Outdoor & Adventure',
        emoji: '🚙',
      },
      {
        name: 'Backpacking',
        category: 'Outdoor & Adventure',
        emoji: '🎒',
      },
      {
        name: 'Sailing',
        category: 'Outdoor & Adventure',
        emoji: '⛵',
      },
      {
        name: 'Caving',
        category: 'Outdoor & Adventure',
        emoji: '🕳️',
      },
      {
        name: 'Zip-lining',
        category: 'Outdoor & Adventure',
        emoji: '🌲',
      },
      {
        name: 'Hot Air Ballooning',
        category: 'Outdoor & Adventure',
        emoji: '🎈',
      },
      {
        name: 'Jungle Trekking',
        category: 'Outdoor & Adventure',
        emoji: '🌿',
      },
      {
        name: 'Desert Safari',
        category: 'Outdoor & Adventure',
        emoji: '🐪',
      },
      {
        name: 'Ice Climbing',
        category: 'Outdoor & Adventure',
        emoji: '🧊',
      },
      {
        name: 'Windsurfing',
        category: 'Outdoor & Adventure',
        emoji: '🌬️',
      },
      {
        name: 'Kiteboarding',
        category: 'Outdoor & Adventure',
        emoji: '🪁',
      },
      {
        name: 'Stand-up Paddleboarding',
        category: 'Outdoor & Adventure',
        emoji: '🏄‍♂️',
      },
      {
        name: 'Bushcraft & Survival Skills',
        category: 'Outdoor & Adventure',
        emoji: '🔥',
      },
      {
        name: 'Nature Photography',
        category: 'Outdoor & Adventure',
        emoji: '📸',
      },
      {
        name: 'Eco-Tourism',
        category: 'Outdoor & Adventure',
        emoji: '🌍',
      },
    ];

    const religionAndSpirituality = [
      {
        name: 'Meditation',
        category: 'Religion & Spirituality',
        emoji: '🧘',
      },
      {
        name: 'Prayer',
        category: 'Religion & Spirituality',
        emoji: '🙏',
      },
      {
        name: 'Yoga',
        category: 'Religion & Spirituality',
        emoji: '🧘‍♀️',
      },
      {
        name: 'Mindfulness',
        category: 'Religion & Spirituality',
        emoji: '🕉️',
      },
      {
        name: 'Pilgrimage',
        category: 'Religion & Spirituality',
        emoji: '⛩️',
      },
      {
        name: 'Religious Studies',
        category: 'Religion & Spirituality',
        emoji: '📖',
      },
      {
        name: 'Astrology',
        category: 'Religion & Spirituality',
        emoji: '🔮',
      },
      {
        name: 'Numerology',
        category: 'Religion & Spirituality',
        emoji: '🔢',
      },
      {
        name: 'Tarot Reading',
        category: 'Religion & Spirituality',
        emoji: '🃏',
      },
      {
        name: 'Mysticism',
        category: 'Religion & Spirituality',
        emoji: '🌌',
      },
      {
        name: 'Church Activities',
        category: 'Religion & Spirituality',
        emoji: '⛪',
      },
      {
        name: 'Temple Visits',
        category: 'Religion & Spirituality',
        emoji: '🏯',
      },
      {
        name: 'Mosque Prayers',
        category: 'Religion & Spirituality',
        emoji: '🕌',
      },
      {
        name: 'Synagogue Gatherings',
        category: 'Religion & Spirituality',
        emoji: '🕍',
      },
      {
        name: 'Buddhist Practices',
        category: 'Religion & Spirituality',
        emoji: '☸️',
      },
      {
        name: 'Hindu Rituals',
        category: 'Religion & Spirituality',
        emoji: '🛕',
      },
      {
        name: 'Christian Fellowship',
        category: 'Religion & Spirituality',
        emoji: '✝️',
      },
      {
        name: 'Islamic Studies',
        category: 'Religion & Spirituality',
        emoji: '☪️',
      },
      {
        name: 'Jewish Traditions',
        category: 'Religion & Spirituality',
        emoji: '✡️',
      },
      {
        name: 'Paganism',
        category: 'Religion & Spirituality',
        emoji: '🌀',
      },
      {
        name: 'Shamanism',
        category: 'Religion & Spirituality',
        emoji: '🌿',
      },
      {
        name: 'Wicca & Witchcraft',
        category: 'Religion & Spirituality',
        emoji: '🧙‍♀️',
      },
      {
        name: 'New Age Spirituality',
        category: 'Religion & Spirituality',
        emoji: '✨',
      },
      {
        name: 'Energy Healing',
        category: 'Religion & Spirituality',
        emoji: '💫',
      },
      {
        name: 'Chakra Balancing',
        category: 'Religion & Spirituality',
        emoji: '🟣',
      },
      {
        name: 'Faith-based Volunteering',
        category: 'Religion & Spirituality',
        emoji: '🤝',
      },
      {
        name: 'Interfaith Dialogue',
        category: 'Religion & Spirituality',
        emoji: '☯️',
      },
      {
        name: 'Gospel Music',
        category: 'Religion & Spirituality',
        emoji: '🎶',
      },
      {
        name: 'Spiritual Retreats',
        category: 'Religion & Spirituality',
        emoji: '🏞️',
      },
      {
        name: 'Angelology',
        category: 'Religion & Spirituality',
        emoji: '👼',
      },
      {
        name: 'Prophecy & Divination',
        category: 'Religion & Spirituality',
        emoji: '🔮',
      },
      {
        name: 'Zen Practices',
        category: 'Religion & Spirituality',
        emoji: '☯️',
      },
      {
        name: 'Mantra Chanting',
        category: 'Religion & Spirituality',
        emoji: '📿',
      },
      {
        name: 'Holy Text Study',
        category: 'Religion & Spirituality',
        emoji: '📜',
      },
      {
        name: 'Nature Spirituality',
        category: 'Religion & Spirituality',
        emoji: '🌳',
      },
    ];

    const foodAndDrinks = [
      {
        name: 'Cooking',
        category: 'Food & Drink',
        emoji: '👨‍🍳',
      },
      {
        name: 'Baking',
        category: 'Food & Drink',
        emoji: '🥖',
      },
      {
        name: 'Grilling & BBQ',
        category: 'Food & Drink',
        emoji: '🍖',
      },
      {
        name: 'Gourmet Cuisine',
        category: 'Food & Drink',
        emoji: '🍽️',
      },
      {
        name: 'Street Food',
        category: 'Food & Drink',
        emoji: '🌮',
      },
      {
        name: 'Vegetarian & Vegan Cooking',
        category: 'Food & Drink',
        emoji: '🥗',
      },
      {
        name: 'Seafood',
        category: 'Food & Drink',
        emoji: '🦞',
      },
      {
        name: 'Desserts & Pastries',
        category: 'Food & Drink',
        emoji: '🍰',
      },
      {
        name: 'Chocolate Tasting',
        category: 'Food & Drink',
        emoji: '🍫',
      },
      {
        name: 'Wine Tasting',
        category: 'Food & Drink',
        emoji: '🍷',
      },
      {
        name: 'Beer Brewing',
        category: 'Food & Drink',
        emoji: '🍺',
      },
      {
        name: 'Cocktail Making',
        category: 'Food & Drink',
        emoji: '🍹',
      },
      {
        name: 'Coffee Culture',
        category: 'Food & Drink',
        emoji: '☕',
      },
      {
        name: 'Tea Enthusiast',
        category: 'Food & Drink',
        emoji: '🍵',
      },
      {
        name: 'Fermentation & Pickling',
        category: 'Food & Drink',
        emoji: '🥒',
      },
      {
        name: 'Cheese Tasting',
        category: 'Food & Drink',
        emoji: '🧀',
      },
      {
        name: 'Food Photography',
        category: 'Food & Drink',
        emoji: '📸',
      },
      {
        name: 'Restaurant Hopping',
        category: 'Food & Drink',
        emoji: '🍽️',
      },
      {
        name: 'Fine Dining',
        category: 'Food & Drink',
        emoji: '🍷',
      },
      {
        name: 'Food Festivals',
        category: 'Food & Drink',
        emoji: '🎡',
      },
      {
        name: 'Healthy Eating',
        category: 'Food & Drink',
        emoji: '🥦',
      },
      {
        name: 'Keto & Low-Carb Diet',
        category: 'Food & Drink',
        emoji: '🥩',
      },
      {
        name: 'Gluten-Free Cooking',
        category: 'Food & Drink',
        emoji: '🌾🚫',
      },
      {
        name: 'International Cuisine',
        category: 'Food & Drink',
        emoji: '🌍🍽️',
      },
      {
        name: 'Sushi Making',
        category: 'Food & Drink',
        emoji: '🍣',
      },
      {
        name: 'Pasta Making',
        category: 'Food & Drink',
        emoji: '🍝',
      },
      {
        name: 'Homemade Bread',
        category: 'Food & Drink',
        emoji: '🍞',
      },
      {
        name: 'Juicing & Smoothies',
        category: 'Food & Drink',
        emoji: '🥤',
      },
      {
        name: 'Organic & Farm-to-Table',
        category: 'Food & Drink',
        emoji: '🌱',
      },
      {
        name: 'Food Science & Molecular Gastronomy',
        category: 'Food & Drink',
        emoji: '🧪',
      },
    ];

    const interests = [
      ...sports,
      ...artsAndEntertainment,
      ...communityAndCulture,
      ...technologyAndScience,
      ...outdoorAndAdventure,
      ...religionAndSpirituality,
      ...foodAndDrinks,
    ];

    const interestsEntities = interests
      .map(({ name, category, emoji }) => {
        const categoryEntity = categoryEntities.find(
          (ce) => ce.name === category,
        );
        if (!categoryEntity) return null;
        return em.create(Interest, { name, emoji, category: categoryEntity });
      })
      .filter(Boolean);

    await em.persistAndFlush(interestsEntities);
  }
}
