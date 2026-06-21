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
  IconTicket,
  IconTag,
} from '@tabler/icons-react';

const CATEGORY_ICON_MAP = [
  { keywords: ['food', 'restaurant', 'cafe', 'coffee'], icon: IconCoffee },
  { keywords: ['salary', 'wage', 'paycheck'], icon: IconCash },
  { keywords: ['transport', 'uber', 'taxi', 'bus'], icon: IconCar },
  { keywords: ['bills', 'utilities'], icon: IconFileInvoice },
  { keywords: ['internet', 'phone'], icon: IconDeviceMobile },
  { keywords: ['groceries'], icon: IconBasket },
  { keywords: ['home', 'household'], icon: IconHome },
  { keywords: ['subscriptions'], icon: IconRepeat },
  { keywords: ['clothing', 'clothes'], icon: IconShirt },
  { keywords: ['hobby'], icon: IconPalette },
  { keywords: ['health', 'medicine', 'pharmacy'], icon: IconHeartbeat },
  { keywords: ['education', 'books', 'courses'], icon: IconBook },
  { keywords: ['hygiene', 'beauty'], icon: IconBath },
  { keywords: ['fuel', 'gas'], icon: IconGasStation },
  { keywords: ['betting', 'gambling'], icon: IconDice },
  { keywords: ['freelance', 'side job'], icon: IconBriefcase },
  { keywords: ['gifts', 'refunds'], icon: IconGift },
  { keywords: ['winnings', 'coupons'], icon: IconTrophy },
  { keywords: ['interest', 'investments'], icon: IconChartLine },
  { keywords: ['entertainment', 'movies', 'games'], icon: IconTicket },
  { keywords: ['sales', 'other sales', 'selling'], icon: IconTag },
];

export const DEFAULT_ICON = IconBuildingStore;

export const getIconForCategory = (categoryName) => {
  const name = (categoryName || '').toLowerCase();
  const match = CATEGORY_ICON_MAP.find(({ keywords }) =>
    keywords.some((keyword) => name.includes(keyword))
  );
  return match?.icon ?? DEFAULT_ICON;
};
