export type PassportCategory = {
  id: number;
  name: string;
  subcategories?: string[];
};

// Transcribed from P1PictureInstructions.pdf in the supplied Blueprint folder.
export const passportCategories: PassportCategory[] = [
  { id: 1, name: "Community participation supports and activities of daily living" },
  { id: 2, name: "Education: tutoring, personal training, life skill development, job coaching" },
  { id: 3, name: "Respite: in-home relief" },
  { id: 4, name: "Community activities e.g. participation in sporting/recreational activities, museums, park admissions, bowling, movies, etc." },
  { id: 5, name: "Day programs, classes, training, workshops, resume development and tests and licenses" },
  { id: 6, name: "Membership / Live Event Season Ticket Packages" },
  { id: 7, name: "Camp" },
  { id: 8, name: "Out of home respite" },
  { id: 9, name: "Transportation provided by agency, taxis, parking, public transit (not annual)" },
  { id: 10, name: "Annual Public Transit Pass" },
  { id: 11, name: "Support Worker's vacation expenses for accompanying client during trips and holiday travel" },
  { id: 12, name: "Support Worker's meal" },
  { id: 13, name: "Other types (please specify)" },
  {
    id: 14,
    name: "CPS Supplies and Equipment",
    subcategories: [
      "Activity/hobby/recreational supplies and equipment",
      "Other",
      "Personal fitness equipment",
      "PPE",
      "Sensory items",
    ],
  },
  { id: 15, name: "Mileage" },
  { id: 16, name: "Administration" },
  { id: 17, name: "Person Directed Program" },
  {
    id: 18,
    name: "Live event tickets",
    subcategories: ["Live Theatre/Musicals", "Music Events", "Other Live Entertainment", "Sporting Events"],
  },
  {
    id: 19,
    name: "Technology",
    subcategories: [
      "Cell phones and phone plans",
      "Computers, laptops, tablets and related accessories",
      "Other hardware/electronic items",
      "Other services",
      "Technology Services",
    ],
  },
];
