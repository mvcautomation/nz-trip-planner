export interface Location {
  id: string;
  name: string;
  date: string;
  lat: number;
  lng: number;
  category: 'activity' | 'stay' | 'possible';
}

export interface TripDay {
  date: string;
  dateLabel: string;
  fullDate: Date;
  activities: Location[];
  stay: Location | null;
}

// Parsed from New Zealand Trip.kmz
export const locations: Location[] = [
  // Planned Activities
  { id: 'auckland-airport', name: 'Auckland Airport', date: '12/30', lat: -37.0089374, lng: 174.7863813, category: 'activity' },
  { id: 'waitomo-caves', name: 'Waitomo Caves', date: '12/31', lat: -38.2606874, lng: 175.1113208, category: 'activity' },
  { id: 'hobbiton', name: 'Hobbiton', date: '12/31', lat: -37.8720905, lng: 175.6829096, category: 'activity' },
  { id: 'mitai-maori', name: 'Mitai Maori Village', date: '12/31', lat: -38.1066427, lng: 176.220807, category: 'activity' },
  { id: 'skyline-rotorua', name: 'Skyline Rotorua', date: '1/1', lat: -38.110432, lng: 176.221969, category: 'activity' },
  { id: 'waimangu-volcanic', name: 'Waimangu Volcanic', date: '1/1', lat: -38.285254, lng: 176.386259, category: 'activity' },
  { id: 'redwoods-treewalk', name: 'Redwoods Treewalk', date: '1/1', lat: -38.1569672, lng: 176.2730987, category: 'activity' },
  { id: 'lake-taupo', name: 'Lake Taupo', date: '1/1', lat: -38.7907719, lng: 175.9040778, category: 'activity' },
  { id: 'bridge-to-nowhere', name: 'Bridge to Nowhere', date: '1/2', lat: -39.4764935, lng: 175.0467804, category: 'activity' },
  { id: 'wellington-chocolate', name: 'Wellington Chocolate', date: '1/3', lat: -41.2925745, lng: 174.7773271, category: 'activity' },
  { id: 'weta-workshop', name: 'Weta Workshop', date: '1/3', lat: -41.3062325, lng: 174.8235832, category: 'activity' },
  { id: 'interislander-ferry', name: 'Interislander Ferry', date: '1/3', lat: -41.2588426, lng: 174.7920131, category: 'activity' },
  { id: 'hobbit-kayak', name: 'Hobbit Kayak Tour', date: '1/4', lat: -41.2800405, lng: 173.7674174, category: 'activity' },
  { id: 'pancake-hike', name: 'Pancake/River Hike', date: '1/5', lat: -42.1154221, lng: 171.329956, category: 'activity' },
  { id: 'monteiths-brewery', name: "Monteith's Brewery", date: '1/5', lat: -42.448469, lng: 171.2135876, category: 'activity' },
  { id: 'woods-creek', name: 'Woods Creek Hike', date: '1/5', lat: -42.5534813, lng: 171.3383628, category: 'activity' },
  { id: 'fox-glacier', name: 'Fox Glacier', date: '1/6', lat: -43.4790414, lng: 170.0075763, category: 'activity' },
  { id: 'thunder-creek', name: 'Thunder Creek Falls', date: '1/7', lat: -43.9693438, lng: 169.2263533, category: 'activity' },
  { id: 'wanaka-lake', name: 'Wanaka Lake Tree/Lavender Farm', date: '1/7', lat: -44.6843507, lng: 169.1551219, category: 'activity' },
  { id: 'skippers-jet', name: 'Skippers Jet Boats', date: '1/7', lat: -44.8899921, lng: 168.676486, category: 'activity' },
  { id: 'milford-sound', name: 'Milford Sound', date: '1/8', lat: -44.6414024, lng: 167.8973801, category: 'activity' },

  // Overnight Stays
  { id: 'stay-cambridge', name: 'Cambridge', date: '12/30', lat: -37.8891864, lng: 175.466267, category: 'stay' },
  { id: 'stay-rotorua', name: 'Rotorua', date: '12/31', lat: -38.1445987, lng: 176.2377669, category: 'stay' },
  { id: 'stay-ohakune', name: 'Ohakune', date: '1/1', lat: -39.4185581, lng: 175.3996118, category: 'stay' },
  { id: 'stay-wellington', name: 'Wellington', date: '1/2', lat: -41.2923814, lng: 174.7787463, category: 'stay' },
  { id: 'stay-picton', name: 'Picton', date: '1/3', lat: -41.2906856, lng: 174.0056434, category: 'stay' },
  { id: 'stay-greymouth', name: 'Greymouth', date: '1/5', lat: -42.4598167, lng: 171.2048865, category: 'stay' },
  { id: 'stay-haast', name: 'Haast', date: '1/6', lat: -43.8761032, lng: 169.0436192, category: 'stay' },
  { id: 'stay-queenstown', name: 'Queenstown', date: '1/8', lat: -45.0301511, lng: 168.6615141, category: 'stay' },

  // Possible Activities
  { id: 'puzzling-world', name: 'Puzzling World', date: '', lat: -44.6967084, lng: 169.1615767, category: 'possible' },
  { id: 'hamilton-gardens', name: 'Hamilton Gardens', date: '', lat: -37.8057423, lng: 175.3048807, category: 'possible' },
  { id: 'whale-safari', name: 'Auckland Whale & Dolphin Safari', date: '', lat: -36.842224, lng: 174.762412, category: 'possible' },
  { id: 'auckland-zoo', name: 'Auckland Zoo', date: '', lat: -36.864113, lng: 174.719685, category: 'possible' },
  { id: 'festival-lights', name: 'Festival of Lights', date: '', lat: -39.0635183, lng: 174.0800565, category: 'possible' },
  { id: 'zorb-rotorua', name: 'ZORB Rotorua', date: '', lat: -38.1036829, lng: 176.2214451, category: 'possible' },
  { id: 'treetop-walkway', name: 'West Coast Tree Top Walkway', date: '', lat: -42.8092301, lng: 170.9209173, category: 'possible' },
];

// Trip dates: Dec 30, 2025 - Jan 9, 2026
export const tripDates = [
  { date: '12/30', dateLabel: 'Mon, Dec 30', fullDate: new Date(2025, 11, 30) },
  { date: '12/31', dateLabel: 'Tue, Dec 31', fullDate: new Date(2025, 11, 31) },
  { date: '1/1', dateLabel: 'Wed, Jan 1', fullDate: new Date(2026, 0, 1) },
  { date: '1/2', dateLabel: 'Thu, Jan 2', fullDate: new Date(2026, 0, 2) },
  { date: '1/3', dateLabel: 'Fri, Jan 3', fullDate: new Date(2026, 0, 3) },
  { date: '1/4', dateLabel: 'Sat, Jan 4', fullDate: new Date(2026, 0, 4) },
  { date: '1/5', dateLabel: 'Sun, Jan 5', fullDate: new Date(2026, 0, 5) },
  { date: '1/6', dateLabel: 'Mon, Jan 6', fullDate: new Date(2026, 0, 6) },
  { date: '1/7', dateLabel: 'Tue, Jan 7', fullDate: new Date(2026, 0, 7) },
  { date: '1/8', dateLabel: 'Wed, Jan 8', fullDate: new Date(2026, 0, 8) },
  { date: '1/9', dateLabel: 'Thu, Jan 9', fullDate: new Date(2026, 0, 9) },
];

export function getTripDays(): TripDay[] {
  return tripDates.map(td => {
    const activities = locations.filter(l => l.category === 'activity' && l.date === td.date);
    const stay = locations.find(l => l.category === 'stay' && l.date === td.date) || null;
    return { ...td, activities, stay };
  });
}

export function getPossibleActivities(): Location[] {
  return locations.filter(l => l.category === 'possible');
}

export function getLocationById(id: string): Location | undefined {
  return locations.find(l => l.id === id);
}

// Approximate drive times between consecutive locations (in minutes)
// These are estimates based on Google Maps typical drive times
export const driveTimes: Record<string, Record<string, number>> = {
  'auckland-airport': { 'stay-cambridge': 105 },
  'stay-cambridge': { 'waitomo-caves': 60 },
  'waitomo-caves': { 'hobbiton': 75 },
  'hobbiton': { 'mitai-maori': 55 },
  'mitai-maori': { 'stay-rotorua': 10 },
  'stay-rotorua': { 'skyline-rotorua': 5 },
  'skyline-rotorua': { 'waimangu-volcanic': 25 },
  'waimangu-volcanic': { 'redwoods-treewalk': 20 },
  'redwoods-treewalk': { 'lake-taupo': 60 },
  'lake-taupo': { 'stay-ohakune': 75 },
  'stay-ohakune': { 'bridge-to-nowhere': 45 },
  'bridge-to-nowhere': { 'stay-wellington': 240 },
  'stay-wellington': { 'wellington-chocolate': 5 },
  'wellington-chocolate': { 'weta-workshop': 15 },
  'weta-workshop': { 'interislander-ferry': 20 },
  'interislander-ferry': { 'stay-picton': 195 }, // 3.25hr ferry
  'stay-picton': { 'hobbit-kayak': 30 },
  'hobbit-kayak': { 'pancake-hike': 240 },
  'pancake-hike': { 'monteiths-brewery': 45 },
  'monteiths-brewery': { 'woods-creek': 20 },
  'woods-creek': { 'stay-greymouth': 15 },
  'stay-greymouth': { 'fox-glacier': 180 },
  'fox-glacier': { 'stay-haast': 90 },
  'stay-haast': { 'thunder-creek': 15 },
  'thunder-creek': { 'wanaka-lake': 90 },
  'wanaka-lake': { 'skippers-jet': 60 },
  'skippers-jet': { 'stay-queenstown': 30 },
  'stay-queenstown': { 'milford-sound': 285 },
  'milford-sound': { 'stay-queenstown': 285 },
};

export function getDriveTime(fromId: string, toId: string): number | null {
  return driveTimes[fromId]?.[toId] || null;
}
