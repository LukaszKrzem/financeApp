import {
  IconBuildingStore,
  IconCoffee,
  IconCar,
  IconCash,
  IconFileInvoice,
  IconDeviceMobile,
  IconBasket,
  IconHome,
  IconRepeat,
  IconShirt,
  IconPalette,
  IconHeartbeat,
  IconBook,
  IconBath,
  IconGasStation,
  IconDice,
  IconBriefcase,
  IconGift,
  IconTrophy,
  IconChartLine,
} from '@tabler/icons-react';

const CATEGORY_ICON_MAP = [
  { keywords: ['jedzenie', 'kawiarnie', 'restauracje'], icon: IconCoffee },
  { keywords: ['wypłata', 'wynagrodzenie'], icon: IconCash },
  { keywords: ['transport'], icon: IconCar },
  { keywords: ['rachunki'], icon: IconFileInvoice },
  { keywords: ['internet', 'telefon'], icon: IconDeviceMobile },
  { keywords: ['spożywcze'], icon: IconBasket },
  { keywords: ['chemia', 'dom'], icon: IconHome },
  { keywords: ['subskrypcje'], icon: IconRepeat },
  { keywords: ['ubrania'], icon: IconShirt },
  { keywords: ['hobby'], icon: IconPalette },
  { keywords: ['zdrowie', 'leki'], icon: IconHeartbeat },
  { keywords: ['edukacja'], icon: IconBook },
  { keywords: ['higiena', 'uroda'], icon: IconBath },
  { keywords: ['paliwo'], icon: IconGasStation },
  { keywords: ['bukmacherskie', 'hazard'], icon: IconDice },
  { keywords: ['praca dodatkowa'], icon: IconBriefcase },
  { keywords: ['prezenty', 'zwroty'], icon: IconGift },
  { keywords: ['wygrane', 'kupony'], icon: IconTrophy },
  { keywords: ['odsetki', 'inwestycje'], icon: IconChartLine },
];

export const DEFAULT_ICON = IconBuildingStore;

export const getIconForCategory = (categoryName) => {
  const name = (categoryName || '').toLowerCase();
  const match = CATEGORY_ICON_MAP.find(({ keywords }) =>
    keywords.some((keyword) => name.includes(keyword))
  );
  return match?.icon ?? DEFAULT_ICON;
};
