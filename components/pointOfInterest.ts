export interface PointOfInterest {
  id: string;
  date: Date;
  title: string;
  description: string;
  imageUrl: string;
}

// Sample hardcoded POIs
export const defaultPOIs: PointOfInterest[] = [
  {
    id: "poi0",
    date: new Date("2025-01-20"),
    title: "Very First Date",
    description: "Our magical first time together.",
    imageUrl: "/images/poi0.jpg",
  },
  {
    id: "poi1",
    date: new Date("2025-01-20"),
    title: "\"First\" Date",
    description: "Our magical truly first time together.",
    imageUrl: "/images/poi1.jpg",
  },
  {
    id: "poi2",
    date: new Date("2025-11-07"),
    title: "The Beach Day",
    description: "A sunny day by the sea.",
    imageUrl: "/images/poi2.jpg",
  },
  {
    id: "poi3",
    date: new Date("2025-05-18"),
    title: "New Year Together",
    description: "Ringing in the new year.",
    imageUrl: "/images/poi3.jpg",
  },
  {
    id: "poi4",
    date: new Date(Date.now()),
    title: "best day ever!!!",
    description: "Ringing in the new year.",
    imageUrl: "/images/poi3.jpg",
  },
  {
    id: "poi5",
    date: new Date("2024-05-20"),
    title: "bestest day ever!!!",
    description: "Ringing in the bestest year evaaaa!!!s",
    imageUrl: "/images/poi3.jpg",
  },
];
