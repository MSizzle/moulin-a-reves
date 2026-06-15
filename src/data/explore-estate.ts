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
      { src: '/images/grange-fireplace-flame.webp', alt: 'Stone fireplace blazing at La Grange with champagne and celebration setup' },
      { src: '/images/group-dinner.webp', alt: "Dinner laid on the long table under La Grange's pavilion with the green garden beyond" },
      { src: '/images/homes/la-grange-pavilion-wide.webp', alt: 'La Grange — wide view of the open pavilion' },
      { src: '/images/homes/la-grange-pavilion.webp', alt: 'La Grange pavilion with stone fireplace and ping-pong table' },
      { src: '/images/grange-set-table.webp', alt: "The long table set under La Grange's pavilion with the garden and painted bridge beyond" },
      { src: '/images/homes/grange-fire-table-brighter.webp', alt: 'Fire blazing in the stone hearth of La Grange beside a candlelit dinner table' },
      { src: '/images/groups-family-gathering-grange.webp', alt: "A family gathered around the long table under La Grange's pavilion" },
      { src: '/images/homes/la-grange-plates.webp', alt: "The long table under La Grange's pavilion set with rose-pattern china" },
      { src: '/images/homes/la-grange-carriage.webp', alt: 'Antique horse carriage on display inside La Grange' },
    ],
  },
  {
    title: 'Gardens',
    summary: 'The Giverny-style bridge, flowering gardens, and a wishing well.',
    image: '/images/garden-chaises-dream-view.webp',
    alt: 'Wicker chaise lounges on the sunlit garden lawn beneath a weeping willow at Moulin à Rêves',
    gallery: [
      { src: '/images/garden-chaises-dream-view.webp', alt: 'Wicker chaise lounges on the sunlit lawn looking toward the willow and bridge in the gardens' },
      { src: '/images/bridge-garden.webp', alt: 'Giverny-style painted bridge over the stream beneath willow trees' },
      { src: '/images/lifestyle-smelling-roses-shutters.webp', alt: 'Stopping to smell the climbing pink roses against the blue shutters at Moulin à Rêves' },
      { src: '/images/garden-chaises-wide.webp', alt: 'Wide garden view with chaise lounges' },
      { src: '/images/garden-chaise-jetson.webp', alt: 'Garden chaise lounges with Jetson the Cavalier' },
      { src: '/images/garden-private-spot.webp', alt: 'Private wicker bistro table in a wooded corner' },
      { src: '/images/garden-breakfast.webp', alt: 'Breakfast set on the patio outside the stone cottage' },
      { src: '/images/homes/le-moulin-stream-flowerboxes.webp', alt: "The Juine stream running beneath the flower-boxed footbridge at Le Moulin's blue door" },
      { src: '/images/evening-compound.webp', alt: 'Garden at dusk' },
      { src: '/images/yoga-lawn.webp', alt: 'Morning yoga on the lawn between the houses' },
      { src: '/images/garden-wishing-well.webp', alt: 'Make a wish at the mossy stone wishing well in the gardens' },
      { src: '/images/gardens-lawn-white-bridge.webp', alt: 'The broad garden lawn with the white footbridge and espaliered fruit trees beside the houses' },
    ],
  },
  {
    title: 'The Jacuzzi Spa',
    summary: 'A glass-enclosed sanctuary for year-round relaxation.',
    image: '/images/jacuzzi-spa-solarium.webp',
    alt: 'The glass-enclosed solarium jacuzzi with a robe and stone walls at Moulin à Rêves',
    gallery: [
      { src: '/images/jacuzzi-spa-solarium.webp', alt: 'The glass-enclosed solarium jacuzzi with a robe and stone walls at Moulin à Rêves' },
      { src: '/images/wellness-jacuzzi-2.webp', alt: 'The jacuzzi in the solarium at Moulin à Rêves' },
      { src: '/images/jacuzzi-spa-shower.webp', alt: 'The jacuzzi spa with rainfall shower and glass-enclosed solarium at Moulin à Rêves' },
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
      { src: '/images/explore/cycling-gate.webp', alt: 'Cycling out through the blue gate with Jetson the Cavalier and a baguette in the basket' },
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
