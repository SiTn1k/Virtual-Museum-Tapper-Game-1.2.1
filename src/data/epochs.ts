import { Epoch, EpochId, Generator, Artifact } from '../types/game';

// Helper to create generators
const createGenerators = (templates: Array<{ id: string; icon: string; name: { ua: string; en: string }; desc: { ua: string; en: string }; baseCost: number; baseProd: number }>): Generator[] =>
  templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.desc,
    baseCost: t.baseCost,
    baseProduction: t.baseProd,
    costMultiplier: 1.15,
    icon: t.icon,
  }));

// EPOCH 1: Трипільська культура (5000-2750 BC)
const trypilliaGenerators = createGenerators([
  { id: 'clay_pit', icon: '🏺', name: { ua: 'Глиняна яма', en: 'Clay Pit' }, desc: { ua: 'Видобування глини для кераміки', en: 'Clay extraction for ceramics' }, baseCost: 10, baseProd: 2 },
  { id: 'pottery', icon: '🎨', name: { ua: 'Гончарна майстерня', en: 'Pottery Workshop' }, desc: { ua: 'Виробництво кераміки', en: 'Ceramics production' }, baseCost: 50, baseProd: 8 },
  { id: 'settlement', icon: '🏘️', name: { ua: 'Поселення', en: 'Settlement' }, desc: { ua: 'Трипільська община', en: 'Trypillian community' }, baseCost: 300, baseProd: 40 },
  { id: 'megastructure', icon: '🏛️', name: { ua: 'Мега-структура', en: 'Mega-Structure' }, desc: { ua: 'Величезна споруда', en: 'Massive structure' }, baseCost: 3000, baseProd: 200 },
  { id: 'temple', icon: '✨', name: { ua: 'Храм Богині', en: 'Temple of Goddess' }, desc: { ua: 'Священне місце', en: 'Sacred place' }, baseCost: 30000, baseProd: 1000 },
]);

// EPOCH 2: Скіфія (7th-3rd c. BC)
const scythiaGenerators = createGenerators([
  { id: 'pasture', icon: '🐎', name: { ua: 'Пасовище', en: 'Pasture' }, desc: { ua: 'Коні та худоба', en: 'Horses and cattle' }, baseCost: 10, baseProd: 5 },
  { id: 'gold_mine', icon: '⛏️', name: { ua: 'Золота копальня', en: 'Gold Mine' }, desc: { ua: 'Скіфське золото', en: 'Scythian gold' }, baseCost: 50, baseProd: 20 },
  { id: 'kurgan', icon: '🎖️', name: { ua: 'Курган', en: 'Kurgan' }, desc: { ua: 'Поховання', en: 'Burial mound' }, baseCost: 300, baseProd: 100 },
  { id: 'fortress', icon: '🏰', name: { ua: 'Фортеця', en: 'Fortress' }, desc: { ua: 'Захисна споруда', en: 'Defensive structure' }, baseCost: 3000, baseProd: 500 },
  { id: 'royal_tomb', icon: '👑', name: { ua: 'Царська гробниця', en: 'Royal Tomb' }, desc: { ua: 'Золота гробниця', en: 'Golden tomb' }, baseCost: 30000, baseProd: 2500 },
]);

// EPOCH 3: Античність - Грецькі колонії (7th c. BC - 5th c. AD)
const antiquityGenerators = createGenerators([
  { id: 'port', icon: '⚓', name: { ua: 'Порт', en: 'Port' }, desc: { ua: 'Торговий порт', en: 'Trading port' }, baseCost: 10, baseProd: 10 },
  { id: 'agora', icon: '🏛', name: { ua: 'Агора', en: 'Agora' }, desc: { ua: 'Торговельна площа', en: 'Market square' }, baseCost: 50, baseProd: 40 },
  { id: 'colony', icon: '🏪', name: { ua: 'Грецька колонія', en: 'Greek Colony' }, desc: { ua: 'Ольвія, Херсонес', en: 'Olbia, Chersonesus' }, baseCost: 300, baseProd: 200 },
  { id: 'amphitheater', icon: '🎭', name: { ua: 'Амфітеатр', en: 'Amphitheater' }, desc: { ua: 'Культурний центр', en: 'Cultural center' }, baseCost: 3000, baseProd: 1000 },
  { id: 'acropolis', icon: '🏛️', name: { ua: 'Акрополь', en: 'Acropolis' }, desc: { ua: 'Верхнє місто', en: 'Upper city' }, baseCost: 30000, baseProd: 5000 },
]);

// EPOCH 4: Київська Русь (9th-13th c.)
const kyivRusGenerators = createGenerators([
  { id: 'field', icon: '🌾', name: { ua: 'Поле', en: 'Field' }, desc: { ua: 'Землеробство', en: 'Agriculture' }, baseCost: 10, baseProd: 15 },
  { id: 'craft_workshop', icon: '⚒️', name: { ua: 'Реміснича майстерня', en: 'Craft Workshop' }, desc: { ua: 'Ремесла', en: 'Crafts' }, baseCost: 50, baseProd: 60 },
  { id: 'city', icon: '🏰', name: { ua: 'Місто', en: 'City' }, desc: { ua: 'Київ, Чернігів', en: 'Kyiv, Chernihiv' }, baseCost: 300, baseProd: 300 },
  { id: 'saint_sophia', icon: '☦️', name: { ua: 'Софійський собор', en: 'St. Sophia Cathedral' }, desc: { ua: 'Головна святиня', en: 'Main shrine' }, baseCost: 3000, baseProd: 1500 },
  { id: 'golden_gate', icon: '🚪', name: { ua: 'Золоті ворота', en: 'Golden Gate' }, desc: { ua: 'Головна брама Києва', en: 'Main gate of Kyiv' }, baseCost: 30000, baseProd: 7500 },
]);

// EPOCH 5: Галицько-Волинська держава (1199-1349)
const halychVolhyniaGenerators = createGenerators([
  { id: 'salt_mine', icon: '🧂', name: { ua: 'Соляна копальня', en: 'Salt Mine' }, desc: { ua: 'Видобуток солі', en: 'Salt extraction' }, baseCost: 10, baseProd: 20 },
  { id: 'caravan', icon: '🐪', name: { ua: 'Купецький караван', en: 'Merchant Caravan' }, desc: { ua: 'Торгівля', en: 'Trade' }, baseCost: 50, baseProd: 80 },
  { id: 'castle', icon: '🏯', name: { ua: 'Замок', en: 'Castle' }, desc: { ua: 'Львів, Камянець', en: 'Lviv, Kamenets' }, baseCost: 300, baseProd: 400 },
  { id: 'cathedral', icon: '⛪', name: { ua: 'Собор', en: 'Cathedral' }, desc: { ua: 'Релігійний центр', en: 'Religious center' }, baseCost: 3000, baseProd: 2000 },
  { id: 'principality', icon: '👑', name: { ua: 'Князівство', en: 'Principality' }, desc: { ua: 'Данило Галицький', en: 'Danylo of Halych' }, baseCost: 30000, baseProd: 10000 },
]);

// EPOCH 6: Річ Посполита & Запорозька Січ (14th-17th c.)
const polishLithuanianGenerators = createGenerators([
  { id: 'manor', icon: '🏡', name: { ua: 'Маєток', en: 'Manor' }, desc: { ua: 'Шляхетська власність', en: 'Noble estate' }, baseCost: 10, baseProd: 25 },
  { id: 'market', icon: '🛒', name: { ua: 'Ринок', en: 'Market' }, desc: { ua: 'Торгівля', en: 'Trade' }, baseCost: 50, baseProd: 100 },
  { id: 'cossack_sich', icon: '⚔️', name: { ua: 'Січ', en: 'Sich' }, desc: { ua: 'Запорозька Січ', en: 'Zaporizhian Sich' }, baseCost: 300, baseProd: 500 },
  { id: 'brotherhood', icon: '📚', name: { ua: 'Братство', en: 'Brotherhood' }, desc: { ua: 'Культурний рух', en: 'Cultural movement' }, baseCost: 3000, baseProd: 2500 },
  { id: 'university', icon: '🎓', name: { ua: 'Острозька академія', en: 'Ostroh Academy' }, desc: { ua: 'Перший університет', en: 'First university' }, baseCost: 30000, baseProd: 12500 },
]);

// EPOCH 7: Козацька доба - Хмельниччина (1648-1764)
const cossackGenerators = createGenerators([
  { id: 'homestead', icon: '🏠', name: { ua: 'Хутір', en: 'Homestead' }, desc: { ua: 'Козацьке господарство', en: 'Cossack farm' }, baseCost: 10, baseProd: 30 },
  { id: 'cannon', icon: '💣', name: { ua: 'Гармата', en: 'Cannon' }, desc: { ua: 'Артилерія', en: 'Artillery' }, baseCost: 50, baseProd: 120 },
  { id: 'regiment', icon: '⚠️', name: { ua: 'Полк', en: 'Regiment' }, desc: { ua: 'Козацьке військо', en: 'Cossack army' }, baseCost: 300, baseProd: 600 },
  { id: 'fortress_sich', icon: '🏰', name: { ua: 'Фортеця Січ', en: 'Sich Fortress' }, desc: { ua: 'Головна база', en: 'Main base' }, baseCost: 3000, baseProd: 3000 },
  { id: 'hetman_capital', icon: '🏛️', name: { ua: 'Гетьманська столиця', en: "Hetman's Capital" }, desc: { ua: 'Чигирин, Глухів', en: 'Chyhyryn, Hlukhiv' }, baseCost: 30000, baseProd: 15000 },
]);

// EPOCH 8: Гетьманат (1764-1917)
const hetmanateGenerators = createGenerators([
  { id: 'farm', icon: '🐄', name: { ua: 'Ферма', en: 'Farm' }, desc: { ua: 'Сільське господарство', en: 'Agriculture' }, baseCost: 10, baseProd: 40 },
  { id: 'factory', icon: '🏭', name: { ua: 'Мануфактура', en: 'Manufactory' }, desc: { ua: 'Рання промисловість', en: 'Early industry' }, baseCost: 50, baseProd: 160 },
  { id: 'gymnasium', icon: '📖', name: { ua: 'Гімназія', en: 'Gymnasium' }, desc: { ua: 'Освіта', en: 'Education' }, baseCost: 300, baseProd: 800 },
  { id: 'theater', icon: '🎭', name: { ua: 'Театр', en: 'Theater' }, desc: { ua: 'Культура', en: 'Culture' }, baseCost: 3000, baseProd: 4000 },
  { id: 'railway', icon: '🚂', name: { ua: 'Залізниця', en: 'Railway' }, desc: { ua: 'Транспорт', en: 'Transport' }, baseCost: 30000, baseProd: 20000 },
]);

// EPOCH 9: Російська імперія в Україні (19th - early 20th c.)
const empireGenerators = createGenerators([
  { id: 'mine', icon: '⚫', name: { ua: 'Шахта', en: 'Mine' }, desc: { ua: 'Донбас', en: 'Donbas' }, baseCost: 10, baseProd: 50 },
  { id: 'mill', icon: '🏭', name: { ua: 'Фабрика', en: 'Factory' }, desc: { ua: 'Індустріалізація', en: 'Industrialization' }, baseCost: 50, baseProd: 200 },
  { id: 'university_city', icon: '🎓', name: { ua: 'Університетське місто', en: 'University City' }, desc: { ua: 'Харків, Одеса', en: 'Kharkiv, Odesa' }, baseCost: 300, baseProd: 1000 },
  { id: 'opera', icon: '🎵', name: { ua: 'Оперний театр', en: 'Opera House' }, desc: { ua: 'Мистецтво', en: 'Art' }, baseCost: 3000, baseProd: 5000 },
  { id: 'skyscraper', icon: '🏙️', name: { ua: 'Хмарочос', en: 'Skyscraper' }, desc: { ua: 'Сучасна архітектура', en: 'Modern architecture' }, baseCost: 30000, baseProd: 25000 },
]);

// EPOCH 10: Революція та УНР (1917-1921)
const revolutionGenerators = createGenerators([
  { id: 'printing', icon: '📰', name: { ua: 'Друкарня', en: 'Printing Press' }, desc: { ua: 'Преса та агітація', en: 'Press and propaganda' }, baseCost: 10, baseProd: 60 },
  { id: 'military_unit', icon: '🎖️', name: { ua: 'Військова частина', en: 'Military Unit' }, desc: { ua: 'Армія УНР', en: 'UNR Army' }, baseCost: 50, baseProd: 250 },
  { id: 'rada', icon: '🏛️', name: { ua: 'Центральна Рада', en: 'Central Rada' }, desc: { ua: 'Уряд УНР', en: 'UNR Government' }, baseCost: 300, baseProd: 1200 },
  { id: 'embassy', icon: '🌐', name: { ua: 'Посольство', en: 'Embassy' }, desc: { ua: 'Міжнародні відносини', en: 'International relations' }, baseCost: 3000, baseProd: 6000 },
  { id: 'independence_hall', icon: '📜', name: { ua: 'Акт Незалежности', en: 'Independence Act' }, desc: { ua: 'IV Універсал', en: 'IV Universal' }, baseCost: 30000, baseProd: 30000 },
]);

// EPOCH 11: Радянський період (1922-1991)
const sovietGenerators = createGenerators([
  { id: 'kolkhoz', icon: '🚜', name: { ua: 'Колгосп', en: 'Kolkhoz' }, desc: { ua: 'Колективізація', en: 'Collectivization' }, baseCost: 10, baseProd: 80 },
  { id: 'power_plant', icon: '⚡', name: { ua: 'Електростанція', en: 'Power Plant' }, desc: { ua: 'ЕНС, ГЕС', en: 'NPP, HPP' }, baseCost: 50, baseProd: 320 },
  { id: 'research_institute', icon: '🔬', name: { ua: 'НДІ', en: 'Research Institute' }, desc: { ua: 'Наука', en: 'Science' }, baseCost: 300, baseProd: 1600 },
  { id: 'space_factory', icon: '🚀', name: { ua: 'Космічний завод', en: 'Space Factory' }, desc: { ua: 'Антонов, Південмаш', en: 'Antonov, Pivdenmash' }, baseCost: 3000, baseProd: 8000 },
  { id: 'city_million', icon: '🌃', name: { ua: 'Місто-мільйонник', en: 'Million City' }, desc: { ua: 'Київ, Харків', en: 'Kyiv, Kharkiv' }, baseCost: 30000, baseProd: 40000 },
]);

// EPOCH 12: Незалежність (1991+)
const independenceGenerators = createGenerators([
  { id: 'startup', icon: '💻', name: { ua: 'Стартап', en: 'Startup' }, desc: { ua: 'IT-індустрія', en: 'IT industry' }, baseCost: 10, baseProd: 100 },
  { id: 'logistics', icon: '🚛', name: { ua: 'Логістика', en: 'Logistics' }, desc: { ua: 'Транспорт', en: 'Transport' }, baseCost: 50, baseProd: 400 },
  { id: 'tech_park', icon: '🏗️', name: { ua: 'Технопарк', en: 'Tech Park' }, desc: { ua: 'Інновації', en: 'Innovation' }, baseCost: 300, baseProd: 2000 },
  { id: 'eu_integration', icon: '🇪🇺', name: { ua: 'Євроінтеграція', en: 'EU Integration' }, desc: { ua: 'Європа', en: 'Europe' }, baseCost: 3000, baseProd: 10000 },
  { id: 'new_ukraine', icon: '🇺🇦', name: { ua: 'Нова Україна', en: 'New Ukraine' }, desc: { ua: 'Майбутнє', en: 'Future' }, baseCost: 30000, baseProd: 50000 },
]);

export const EPOCHS: Epoch[] = [
  {
    id: 'trypillia',
    name: { ua: 'Трипільська культура', en: 'Trypillian Culture' },
    description: { ua: 'Археологічна культура енеоліту (5500-2750 до н.е.)', en: 'Eneolithic culture (5500-2750 BC)' },
    period: { ua: '~5500-2750 до н.е.', en: '~5500-2750 BC' },
    levelRange: { min: 1, max: 50 },
    unlockLevel: 1,
    currency: 'Гривні',
    currencyIcon: '🏺',
    generators: trypilliaGenerators,
    color: '#D97706',
    bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
  },
  {
    id: 'scythia',
    name: { ua: 'Скіфія', en: 'Scythia' },
    description: { ua: 'Давня держава скіфів на півдні України', en: 'Ancient Scythian state in southern Ukraine' },
    period: { ua: 'VII-III ст. до н.е.', en: '7th-3rd c. BC' },
    levelRange: { min: 51, max: 100 },
    unlockLevel: 50,
    currency: 'Златники',
    currencyIcon: '🪙',
    generators: scythiaGenerators,
    color: '#22C55E',
    bgGradient: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
  },
  {
    id: 'antiquity',
    name: { ua: 'Античні колонії', en: 'Ancient Colonies' },
    description: { ua: 'Грецькі колонії на Чорному морі', en: 'Greek colonies on the Black Sea' },
    period: { ua: 'VII ст. до н.е. - V ст. н.е.', en: '7th c. BC - 5th c. AD' },
    levelRange: { min: 101, max: 150 },
    unlockLevel: 100,
    currency: 'Драхми',
    currencyIcon: '🏛',
    generators: antiquityGenerators,
    color: '#06B6D4',
    bgGradient: 'linear-gradient(135deg, #67E8F9 0%, #0891B2 100%)',
  },
  {
    id: 'kyiv_rus',
    name: { ua: 'Київська Русь', en: 'Kievan Rus' },
    description: { ua: 'Перша східнословянська держава', en: 'First East Slavic state' },
    period: { ua: 'IX-XIII ст.', en: '9th-13th c.' },
    levelRange: { min: 151, max: 250 },
    unlockLevel: 150,
    currency: 'Гривні',
    currencyIcon: '☦️',
    generators: kyivRusGenerators,
    color: '#DC2626',
    bgGradient: 'linear-gradient(135deg, #FCA5A5 0%, #DC2626 100%)',
  },
  {
    id: 'halych_volhynia',
    name: { ua: 'Галицько-Волинська держава', en: 'Halych-Volhynia' },
    description: { ua: 'Спадкоємець Київської Русі', en: 'Heir to Kievan Rus' },
    period: { ua: '1199-1349', en: '1199-1349' },
    levelRange: { min: 251, max: 320 },
    unlockLevel: 250,
    currency: 'Срібники',
    currencyIcon: '⚔️',
    generators: halychVolhyniaGenerators,
    color: '#7C3AED',
    bgGradient: 'linear-gradient(135deg, #C4B5FD 0%, #7C3AED 100%)',
  },
  {
    id: 'polish_lithuanian',
    name: { ua: 'Річ Посполита', en: 'Polish-Lithuanian Commonwealth' },
    description: { ua: 'Українські землі в складі Речі Посполитої', en: 'Ukrainian lands in Poland-Lithuania' },
    period: { ua: 'XIV-XVII ст.', en: '14th-17th c.' },
    levelRange: { min: 321, max: 420 },
    unlockLevel: 320,
    currency: 'Злоті',
    currencyIcon: '🦅',
    generators: polishLithuanianGenerators,
    color: '#EAB308',
    bgGradient: 'linear-gradient(135deg, #FDE047 0%, #CA8A04 100%)',
  },
  {
    id: 'cossack',
    name: { ua: 'Козацька доба', en: 'Cossack Era' },
    description: { ua: 'Хмельниччина та козацька революція', en: "Khmelnytsky and Cossack revolution" },
    period: { ua: '1648-1764', en: '1648-1764' },
    levelRange: { min: 421, max: 550 },
    unlockLevel: 420,
    currency: 'Червінці',
    currencyIcon: '⚔️',
    generators: cossackGenerators,
    color: '#EF4444',
    bgGradient: 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)',
  },
  {
    id: 'hetmanate',
    name: { ua: 'Гетьманщина', en: 'Hetmanate' },
    description: { ua: 'Козацька держава під проводом гетьмана', en: 'Cossack state led by Hetman' },
    period: { ua: 'XVIII-XIX ст.', en: '18th-19th c.' },
    levelRange: { min: 551, max: 650 },
    unlockLevel: 550,
    currency: 'Рублі',
    currencyIcon: '📜',
    generators: hetmanateGenerators,
    color: '#F97316',
    bgGradient: 'linear-gradient(135deg, #FDBA74 0%, #EA580C 100%)',
  },
  {
    id: 'empire',
    name: { ua: 'Імперська доба', en: 'Imperial Era' },
    description: { ua: 'Україна в Російській імперії', en: 'Ukraine in Russian Empire' },
    period: { ua: 'XIX - поч. XX ст.', en: '19th - early 20th c.' },
    levelRange: { min: 651, max: 780 },
    unlockLevel: 650,
    currency: 'Карбованці',
    currencyIcon: '🏭',
    generators: empireGenerators,
    color: '#1D4ED8',
    bgGradient: 'linear-gradient(135deg, #93C5FD 0%, #1D4ED8 100%)',
  },
  {
    id: 'revolution',
    name: { ua: 'Революція та УНР', en: 'Revolution & UNR' },
    description: { ua: 'Українська Народна Республіка', en: 'Ukrainian Peoples Republic' },
    period: { ua: '1917-1921', en: '1917-1921' },
    levelRange: { min: 781, max: 850 },
    unlockLevel: 780,
    currency: 'Гривні',
    currencyIcon: '🇺🇦',
    generators: revolutionGenerators,
    color: '#FBBF24',
    bgGradient: 'linear-gradient(135deg, #FEF08A 0%, #FACC15 100%)',
  },
  {
    id: 'soviet',
    name: { ua: 'Радянська доба', en: 'Soviet Era' },
    description: { ua: 'Україна в СРСР', en: 'Ukraine in USSR' },
    period: { ua: '1922-1991', en: '1922-1991' },
    levelRange: { min: 851, max: 950 },
    unlockLevel: 850,
    currency: 'Рублі',
    currencyIcon: '☭',
    generators: sovietGenerators,
    color: '#BE123C',
    bgGradient: 'linear-gradient(135deg, #FDA4AF 0%, #BE123C 100%)',
  },
  {
    id: 'independence',
    name: { ua: 'Незалежна Україна', en: 'Independent Ukraine' },
    description: { ua: 'Сучасна українська держава', en: 'Modern Ukrainian state' },
    period: { ua: '1991 - сьогодні', en: '1991 - today' },
    levelRange: { min: 951, max: 999 },
    unlockLevel: 950,
    currency: 'Гривні',
    currencyIcon: '🇺🇦',
    generators: independenceGenerators,
    color: '#FACC15',
    bgGradient: 'linear-gradient(135deg, #005bbb 0%, #FACC15 50%, #005bbb 100%)',
  },
];

// Artifacts for Gacha
export const ARTIFACTS: Artifact[] = [
  // Trypillia (EPOCH 1)
  { id: 'trypillia_bull', name: { ua: 'Бик-бикален', en: 'Bull Idol' }, epoch: 'trypillia', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '🐂' },
  { id: 'trypillia_pot', name: { ua: 'Трипільська піала', en: 'Trypillian Bowl' }, epoch: 'trypillia', rarity: 'rare', parts: 7, bonus: { type: 'passive_boost', value: 1.15 }, icon: '🏺' },
  { id: 'trypillia_goddess', name: { ua: 'Богиня-Мати', en: 'Mother Goddess' }, epoch: 'trypillia', rarity: 'legendary', parts: 10, bonus: { type: 'currency_multiplier', value: 1.5 }, icon: '👸' },

  // Scythia (EPOCH 2)
  { id: 'scythia_arrow', name: { ua: 'Скіфська стріла', en: 'Scythian Arrow' }, epoch: 'scythia', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '🏹' },
  { id: 'scythia_rhyton', name: { ua: 'Золотий ритон', en: 'Golden Rhyton' }, epoch: 'scythia', rarity: 'rare', parts: 7, bonus: { type: 'passive_boost', value: 1.2 }, icon: '🎺' },
  { id: 'scythia_gold', name: { ua: 'Золота пектораль', en: 'Golden Pectoral' }, epoch: 'scythia', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.5 }, icon: '👑' },

  // Antiquity (EPOCH 3)
  { id: 'antiquity_amphora', name: { ua: 'Грецька амфора', en: 'Greek Amphora' }, epoch: 'antiquity', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '🏺' },
  { id: 'antiquity_coin', name: { ua: 'Ольвійська монета', en: 'Olbian Coin' }, epoch: 'antiquity', rarity: 'rare', parts: 7, bonus: { type: 'currency_multiplier', value: 1.2 }, icon: '🪙' },
  { id: 'antiquity_statue', name: { ua: 'Статуя Аполлона', en: 'Apollo Statue' }, epoch: 'antiquity', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.6 }, icon: '🏛' },

  // Kyiv Rus (EPOCH 4)
  { id: 'kyiv_icon', name: { ua: 'Ікона', en: 'Icon' }, epoch: 'kyiv_rus', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '🖼' },
  { id: 'kyiv_reliquary', name: { ua: 'Мощі Святих', en: 'Saints Relics' }, epoch: 'kyiv_rus', rarity: 'epic', parts: 8, bonus: { type: 'xp_multiplier', value: 1.3 }, icon: '☦️' },
  { id: 'kyiv_gospels', name: { ua: 'Остромирове Євангеліє', en: 'Ostromir Gospels' }, epoch: 'kyiv_rus', rarity: 'legendary', parts: 10, bonus: { type: 'currency_multiplier', value: 1.8 }, icon: '📖' },

  // Halych-Volhynia (EPOCH 5)
  { id: 'halych_crown', name: { ua: 'Корона Данила', en: "Danylo's Crown" }, epoch: 'halych_volhynia', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.7 }, icon: '👑' },
  { id: 'halych_seal', name: { ua: 'Печать князя', en: "Prince's Seal" }, epoch: 'halych_volhynia', rarity: 'rare', parts: 7, bonus: { type: 'currency_multiplier', value: 1.25 }, icon: '🔖' },

  // Polish-Lithuanian (EPOCH 6)
  { id: 'polish_sword', name: { ua: 'Рицарський меч', en: 'Knight Sword' }, epoch: 'polish_lithuanian', rarity: 'rare', parts: 7, bonus: { type: 'xp_multiplier', value: 1.2 }, icon: '⚔️' },
  { id: 'polish_crown', name: { ua: 'Корона короля', en: "King's Crown" }, epoch: 'polish_lithuanian', rarity: 'legendary', parts: 10, bonus: { type: 'passive_boost', value: 1.5 }, icon: '👑' },

  // Cossack (EPOCH 7)
  { id: 'cossack_pistol', name: { ua: 'Козацький пістоль', en: 'Cossack Pistol' }, epoch: 'cossack', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '🔫' },
  { id: 'cossack_flag', name: { ua: 'Козацький прапор', en: 'Cossack Banner' }, epoch: 'cossack', rarity: 'rare', parts: 7, bonus: { type: 'passive_boost', value: 1.3 }, icon: '🚩' },
  { id: 'cossack_mace', name: { ua: 'Булава Богдана', en: "Bohdan's Mace" }, epoch: 'cossack', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 2 }, icon: '🏏' },

  // Hetmanate (EPOCH 8)
  { id: 'hetman_seal', name: { ua: 'Печать гетьмана', en: "Hetman's Seal" }, epoch: 'hetmanate', rarity: 'rare', parts: 7, bonus: { type: 'currency_multiplier', value: 1.3 }, icon: '🔏' },
  { id: 'hetman_charter', name: { ua: 'Гетьманська грамота', en: 'Hetman Charter' }, epoch: 'hetmanate', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.8 }, icon: '📜' },

  // Empire (EPOCH 9)
  { id: 'empire_medal', name: { ua: 'Імперська медаль', en: 'Imperial Medal' }, epoch: 'empire', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '🏅' },
  { id: 'empire_factory', name: { ua: 'Заводський знак', en: 'Factory Badge' }, epoch: 'empire', rarity: 'rare', parts: 7, bonus: { type: 'passive_boost', value: 1.25 }, icon: '🏭' },

  // Revolution (EPOCH 10)
  { id: 'revolution_poster', name: { ua: 'Агітаційний плакат', en: 'Propaganda Poster' }, epoch: 'revolution', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '📰' },
  { id: 'revolution_flag', name: { ua: 'Прапор УНР', en: 'UNR Flag' }, epoch: 'revolution', rarity: 'legendary', parts: 10, bonus: { type: 'xp_multiplier', value: 1.9 }, icon: '🇺🇦' },

  // Soviet (EPOCH 11)
  { id: 'soviet_badge', name: { ua: 'Радянський значок', en: 'Soviet Badge' }, epoch: 'soviet', rarity: 'common', parts: 5, bonus: { type: 'xp_multiplier', value: 1.1 }, icon: '⭐' },
  { id: 'soviet_rocket', name: { ua: 'Модель ракети', en: 'Rocket Model' }, epoch: 'soviet', rarity: 'epic', parts: 8, bonus: { type: 'passive_boost', value: 1.4 }, icon: '🚀' },
  { id: 'soviet_anthem', name: { ua: 'Ноти гімну УРСР', en: 'USSR Anthem Notes' }, epoch: 'soviet', rarity: 'rare', parts: 7, bonus: { type: 'currency_multiplier', value: 1.35 }, icon: '🎵' },

  // Independence (EPOCH 12)
  { id: 'ind_passport', name: { ua: 'Перший паспорт', en: 'First Passport' }, epoch: 'independence', rarity: 'rare', parts: 7, bonus: { type: 'xp_multiplier', value: 1.25 }, icon: '🎫' },
  { id: 'ind_constitution', name: { ua: 'Конституція', en: 'Constitution' }, epoch: 'independence', rarity: 'legendary', parts: 10, bonus: { type: 'passive_boost', value: 1.6 }, icon: '📜' },
  { id: 'ind_flag', name: { ua: 'Національний прапор', en: 'National Flag' }, epoch: 'independence', rarity: 'common', parts: 5, bonus: { type: 'passive_boost', value: 1.1 }, icon: '🇺🇦' },
];

export function getEpochById(id: EpochId): Epoch {
  return EPOCHS.find(e => e.id === id) || EPOCHS[0];
}

export function getCurrentEpochByLevel(level: number): Epoch {
  for (let i = EPOCHS.length - 1; i >= 0; i--) {
    if (level >= EPOCHS[i].levelRange.min) {
      return EPOCHS[i];
    }
  }
  return EPOCHS[0];
}

export function getEpochByIndex(index: number): Epoch {
  return EPOCHS[Math.min(index, EPOCHS.length - 1)];
}

export function getGeneratorCost(generator: Generator, currentLevel: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, currentLevel));
}

export function getGeneratorProduction(generator: Generator, currentLevel: number): number {
  return generator.baseProduction * currentLevel;
}
