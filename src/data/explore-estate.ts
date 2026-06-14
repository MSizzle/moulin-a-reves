// Shared "Explore the Estate" tile set — the estate-wide grid shown on the home
// page (compoundFeatures) and duplicated onto each house page's AmenitiesSection
// (exploreMode). One source of truth so the two can't drift.
//
// Tile order is significant: it maps to the home.compound.feat.<index>.* i18n
// keys, which the house pages reuse via AmenitiesSection's featureKeyPrefix prop.

export interface EstatePhoto {
  src: string;
  alt?: string;
  caption?: string;
}

export interface EstateFeature {
  title: string;
  summary: string;
  image: string;
  alt?: string;
  gallery?: EstatePhoto[];
}

export const exploreEstateFeatures: EstateFeature[] = [
  {
    title: 'La Grange',
    summary: 'A covered pavilion for long dinners and fireside memories.',
    image: '/images/homes/la-grange-pavilion-wide.webp',
    alt: 'La Grange covered entertaining barn at Moulin à Rêves',
    gallery: [
      { src: '/images/homes/la-grange-hero.webp', alt: 'La Grange exterior — covered pavilion at the heart of the compound' },
      { src: '/images/homes/la-grange-pavilion-wide.webp', alt: 'La Grange — wide view of the open pavilion' },
      { src: '/images/homes/la-grange-pavilion.webp', alt: 'La Grange pavilion with stone fireplace and ping-pong table' },
      { src: '/images/homes/la-grange-fire.webp', alt: 'Fire crackling in the stone hearth of La Grange' },
      { src: '/images/homes/la-grange-fire-2.webp', alt: 'Roaring fire in the stone fireplace at La Grange' },
      { src: '/images/grange-fireplace-flame.webp', alt: 'Stone fireplace blazing at La Grange with champagne and celebration setup' },
      { src: '/images/homes/la-grange-carriage.webp', alt: 'Antique horse carriage on display inside La Grange' },
      { src: '/images/group-dinner.webp', alt: "Dinner laid on the long table under La Grange's pavilion" },
      { src: '/images/grange-set-table.webp', alt: "The long table set under La Grange's pavilion with the garden and painted bridge beyond" },
    ],
  },
  {
    title: 'Gardens',
    summary: 'The Giverny-style bridge, flowering gardens, and a wishing well.',
    image: '/images/garden-chaises-dream-view.webp',
    alt: 'Wicker chaise lounges on the sunlit garden lawn beneath a weeping willow at Moulin à Rêves',
    gallery: [
      { src: '/images/bridge-garden.webp', alt: 'Giverny-style painted bridge over the stream beneath willow trees' },
      { src: '/images/garden-chaises.webp', alt: 'Garden chaise lounges facing the painted bridge' },
      { src: '/images/garden-chaises-wide.webp', alt: 'Wide garden view with chaise lounges' },
      { src: '/images/garden-chaise-jetson.webp', alt: 'Garden chaise lounges with Jetson the Cavalier' },
      { src: '/images/garden-private-spot.webp', alt: 'Private wicker bistro table in a wooded corner' },
      { src: '/images/garden-stone-well.webp', alt: 'Vine-covered antique stone well in the garden' },
      { src: '/images/garden-breakfast.webp', alt: 'Breakfast set on the patio outside the stone cottage' },
      { src: '/images/compound-river-courtyard.webp', alt: 'Stone footbridge with planter boxes over the small stream' },
      { src: '/images/evening-compound.webp', alt: 'Garden at dusk' },
      { src: '/images/yoga-lawn.webp', alt: 'Morning yoga on the lawn between the houses' },
      { src: '/images/garden-wishing-well.webp', alt: 'Moss-covered stone wishing well under a wisteria pergola in the gardens' },
      { src: '/images/garden-chaise-seating.webp', alt: 'Blue chaise lounges on the lawn beneath a weeping willow in the gardens' },
      { src: '/images/garden-chaises-dream-view.webp', alt: 'Wicker chaise lounges on the sunlit lawn looking toward the willow and bridge in the gardens' },
      { src: '/images/gardens-lawn-white-bridge.webp', alt: 'The broad garden lawn with the white footbridge and espaliered fruit trees beside the houses' },
    ],
  },
  {
    title: 'The Jacuzzi Spa',
    summary: 'A glass-enclosed sanctuary for year-round relaxation.',
    image: '/images/wellness-jacuzzi-2.webp',
    alt: 'The jacuzzi in the solarium at Moulin à Rêves',
    gallery: [
      { src: '/images/wellness-jacuzzi-2.webp', alt: 'The jacuzzi in the solarium at Moulin à Rêves' },
      { src: '/images/jacuzzi-spa-solarium.webp', alt: 'The glass-enclosed solarium jacuzzi with a robe and stone walls at Moulin à Rêves' },
    ],
  },
  {
    title: 'Fitness Studio & Bikes',
    summary: 'Elliptical, treadmill, boxing bag, and electric bicycles for exploring the countryside.',
    image: '/images/gym.webp',
    alt: 'Private gym at Moulin à Rêves with elliptical, treadmill, and mirrored wall',
    gallery: [
      { src: '/images/gym.webp', alt: 'Gym at La Grange with elliptical, treadmill, and mirrored wall' },
      { src: '/images/homes/la-grange-gym-boxing.webp', alt: 'Gym with treadmill and Everlast boxing setup' },
      { src: '/images/homes/la-grange-bikes.webp', alt: 'Bicycles parked in La Grange under exposed wood beams' },
      { src: '/images/homes/la-grange-bikes-door.webp', alt: 'Bicycles lined up inside La Grange facing the door' },
    ],
  },
  {
    title: 'Screening Room',
    summary: 'A private cinema with leather club chairs for films and rainy afternoons.',
    image: '/images/grange-screening-netflix.webp',
    alt: 'Screening room at La Grange with Netflix on the large screen and leather sofas',
    gallery: [
      { src: '/images/grange-screening-netflix.webp', alt: 'Screening room at La Grange with Netflix on the large screen and leather sofas' },
      { src: '/images/homes/la-grange-screening-2.webp', alt: 'Screening room facing the leather chairs from the rear' },
    ],
  },
  {
    title: 'Chicken Coop',
    summary: 'Wake up to the roosters for authentic French country life.',
    image: '/images/chicken-coop-roosters.webp',
    alt: 'Roosters and hens in the gravel run beside the brick chicken coop at Moulin à Rêves',
    gallery: [
      { src: '/images/chicken-coop-roosters.webp', alt: 'Roosters and hens in the gravel run beside the brick chicken coop at Moulin à Rêves' },
      { src: '/images/chicken-coop-flock.webp', alt: 'The flock of roosters and hens foraging along the garden fence at Moulin à Rêves' },
    ],
  },
];
