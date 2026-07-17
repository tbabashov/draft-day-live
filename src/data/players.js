// src/data/players.js

export const REAL_CLUBS = [
  { id: 'manutd', name: 'Manchester United', abbreviation: 'MUN', primaryColour: '#DA291C', secondaryColour: '#000000', stadium: 'Manchester United Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 85, balance: 90000000 },
  { id: 'newcastle', name: 'Newcastle United', abbreviation: 'NEW', primaryColour: '#241F20', secondaryColour: '#FFFFFF', stadium: 'Newcastle United Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 84, balance: 100000000 },
  { id: 'astonvilla', name: 'Aston Villa', abbreviation: 'AST', primaryColour: '#670E36', secondaryColour: '#95BFE5', stadium: 'Aston Villa Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 82, balance: 60000000 },
  { id: 'brighton', name: 'Brighton & Hove Albion', abbreviation: 'BHA', primaryColour: '#0057B8', secondaryColour: '#FFFFFF', stadium: 'Brighton & Hove Albion Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 80, balance: 50000000 },
  { id: 'westham', name: 'West Ham United', abbreviation: 'WHU', primaryColour: '#7A263A', secondaryColour: '#1BB1E7', stadium: 'West Ham United Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 79, balance: 50000000 },
  { id: 'everton', name: 'Everton', abbreviation: 'EVE', primaryColour: '#003399', secondaryColour: '#FFFFFF', stadium: 'Everton Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 78, balance: 40000000 },
  { id: 'crystalpalace', name: 'Crystal Palace', abbreviation: 'CRY', primaryColour: '#1B458F', secondaryColour: '#C4122E', stadium: 'Crystal Palace Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 77, balance: 30000000 },
  { id: 'fulham', name: 'Fulham', abbreviation: 'FUL', primaryColour: '#FFFFFF', secondaryColour: '#000000', stadium: 'Fulham Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 76, balance: 30000000 },
  { id: 'nottmforest', name: 'Nottingham Forest', abbreviation: 'NFO', primaryColour: '#DD0000', secondaryColour: '#FFFFFF', stadium: 'Nottingham Forest Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 76, balance: 35000000 },
  { id: 'brentford', name: 'Brentford', abbreviation: 'BRE', primaryColour: '#E30613', secondaryColour: '#FFFFFF', stadium: 'Brentford Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 77, balance: 30000000 },
  { id: 'bournemouth', name: 'Bournemouth', abbreviation: 'BOU', primaryColour: '#DA291C', secondaryColour: '#000000', stadium: 'Bournemouth Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 76, balance: 30000000 },
  { id: 'wolves', name: 'Wolverhampton Wanderers', abbreviation: 'WOL', primaryColour: '#FDB913', secondaryColour: '#000000', stadium: 'Wolverhampton Wanderers Stadium', capacity: 40000, founded: 1900, league: 'Premier League', leagueTier: 1, reputation: 78, balance: 35000000 },
  { id: 'burnley', name: 'Burnley', abbreviation: 'BUR', primaryColour: '#6C1D45', secondaryColour: '#81D8D0', stadium: 'Turf Moor', capacity: 21944, founded: 1882, league: 'Premier League', leagueTier: 1, reputation: 75, balance: 35000000 },
  { id: 'leeds', name: 'Leeds United', abbreviation: 'LEE', primaryColour: '#FFFFFF', secondaryColour: '#1D428A', stadium: 'Elland Road', capacity: 37890, founded: 1919, league: 'Premier League', leagueTier: 1, reputation: 78, balance: 40000000 },
  { id: 'sunderland', name: 'Sunderland', abbreviation: 'SUN', primaryColour: '#FF0000', secondaryColour: '#FFFFFF', stadium: 'Stadium of Light', capacity: 49000, founded: 1879, league: 'Premier League', leagueTier: 1, reputation: 76, balance: 30000000 },

  { id: "arsenal", name: "Arsenal FC", abbreviation: "ARS", primaryColour: "#EF0107", secondaryColour: "#FFFFFF", stadium: "Emirates Stadium", capacity: 60704, founded: 1886, league: "Premier League", leagueTier: 1, reputation: 88, balance: 120000000 },
  { id: "liverpool", name: "Liverpool FC", abbreviation: "LIV", primaryColour: "#C8102E", secondaryColour: "#FFFFFF", stadium: "Anfield", capacity: 61276, founded: 1892, league: "Premier League", leagueTier: 1, reputation: 89, balance: 110000000 },
  { id: "mancity", name: "Manchester City FC", abbreviation: "MCI", primaryColour: "#6CABDD", secondaryColour: "#FFFFFF", stadium: "Etihad Stadium", capacity: 53400, founded: 1880, league: "Premier League", leagueTier: 1, reputation: 90, balance: 250000000 },
  { id: "chelsea", name: "Chelsea FC", abbreviation: "CHE", primaryColour: "#034694", secondaryColour: "#FFFFFF", stadium: "Stamford Bridge", capacity: 40341, founded: 1905, league: "Premier League", leagueTier: 1, reputation: 86, balance: 80000000 },
  { id: "tottenham", name: "Tottenham Hotspur FC", abbreviation: "TOT", primaryColour: "#132257", secondaryColour: "#FFFFFF", stadium: "Tottenham Hotspur Stadium", capacity: 62850, founded: 1882, league: "Premier League", leagueTier: 1, reputation: 83, balance: 75000000 }
];

function generateWage(ovr, clubId) {
  let base = 0;
  if (ovr >= 88) base = 150000 + Math.random() * 200000;
  else if (ovr >= 84) base = 90000 + Math.random() * 60000;
  else if (ovr >= 80) base = 60000 + Math.random() * 30000;
  else if (ovr >= 75) base = 35000 + Math.random() * 25000;
  else if (ovr >= 70) base = 20000 + Math.random() * 15000;
  else if (ovr >= 65) base = 8000 + Math.random() * 12000;
  else base = 2000 + Math.random() * 6000;

  // Add ±15% variance
  base *= (0.85 + Math.random() * 0.3);

  // Elite club multiplier
  if (clubId === 'arsenal' || clubId === 'mancity') {
    base *= 1.3;
  }
  
  return Math.round(base / 1000) * 1000; // Round to nearest 1k
}

function generateValue(ovr, age) {
  let baseValue = 0;
  if (ovr >= 90) baseValue = 90000000;
  else if (ovr >= 85) baseValue = 50000000 + (ovr - 85) * 8000000;
  else if (ovr >= 80) baseValue = 25000000 + (ovr - 80) * 5000000;
  else if (ovr >= 75) baseValue = 10000000 + (ovr - 75) * 3000000;
  else if (ovr >= 70) baseValue = 3000000 + (ovr - 70) * 1400000;
  else baseValue = 500000 + Math.max(0, ovr - 60) * 250000;

  let ageMultiplier = 1;
  if (age <= 21) ageMultiplier = 1.6;
  else if (age <= 24) ageMultiplier = 1.3;
  else if (age <= 28) ageMultiplier = 1.0;
  else if (age <= 31) ageMultiplier = 0.6;
  else ageMultiplier = 0.25;

  let finalValue = baseValue * ageMultiplier;
  
  // High potential / high OVR bumps
  if (ovr >= 85 && age <= 24) finalValue *= 1.2;
  
  return Math.round(finalValue / 100000) * 100000; // Round nearest 100k
}

function generateAttributes(ovr, pos) {
  if (pos === 'GK') return generateGkAttributes(ovr);
  // Mock generated attributes centered around OVR
  const rng = () => (Math.random() * 10 - 5);
  return {
    pace: Math.min(99, Math.max(40, Math.round(ovr + rng() + (pos === 'LW' || pos === 'RW' || pos === 'RB' || pos === 'LB' ? 8 : 0)))),
    shooting: Math.min(99, Math.max(20, Math.round(ovr + rng() + (pos === 'ST' ? 10 : pos === 'CB' ? -40 : 0)))),
    passing: Math.min(99, Math.max(30, Math.round(ovr + rng() + (pos === 'CAM' || pos === 'CM' || pos === 'CDM' ? 8 : 0)))),
    dribbling: Math.min(99, Math.max(20, Math.round(ovr + rng() + (pos === 'LW' || pos === 'RW' || pos === 'CAM' ? 8 : pos === 'CB' ? -20 : 0)))),
    defending: Math.min(99, Math.max(15, Math.round(ovr + rng() + (pos === 'CB' ? 10 : pos === 'CDM' ? 8 : pos === 'ST' ? -30 : 0)))),
    physical: Math.min(99, Math.max(30, Math.round(ovr + rng() + (pos === 'CB' || pos === 'CDM' || pos === 'ST' ? 8 : 0))))
  };
}

function generateGkAttributes(ovr) {
  // Goalkeeper-specific stats. Speed lags behind the rest, like real keepers.
  const rng = () => (Math.random() * 10 - 5);
  return {
    diving: Math.min(99, Math.max(30, Math.round(ovr + rng()))),
    handling: Math.min(99, Math.max(30, Math.round(ovr + rng()))),
    kicking: Math.min(99, Math.max(25, Math.round(ovr + rng() - 4))),
    reflexes: Math.min(99, Math.max(30, Math.round(ovr + rng() + 2))),
    speed: Math.min(99, Math.max(20, Math.round(ovr + rng() - 18))),
    positioning: Math.min(99, Math.max(30, Math.round(ovr + rng())))
  };
}

function processSquad(rawText, clubId) {
  const club = REAL_CLUBS.find((c) => c.id === clubId);
  const clubName = club ? club.name : clubId;
  return rawText.trim().split('\n').map((line, i) => {
    const parts = line.split(' ');
    const shirtNumber = parseInt(parts[0]);
    const ovr = parseInt(parts[parts.length - 1]);
    const age = parseInt(parts[parts.length - 2]);
    const position = parts[parts.length - 4];
    
    const display = parts.slice(1, parts.length - 4).join(' ');
    const nameParts = display.split(' ');
    const first = nameParts[0];
    const last = nameParts.length > 1 ? nameParts.slice(1).join(' ') : display;

    const wage = generateWage(ovr, clubId);
    const value = generateValue(ovr, age);
    
    const pot = age <= 24 ? Math.min(99, ovr + Math.floor(Math.random() * 8) + 2) : ovr;
    
    // Contract Expiry (2027 to 2030)
    const year = 2027 + Math.floor(Math.random() * 4);
    const contractExpiry = year + "-06-30";

    return {
      id: clubId + '_' + shirtNumber + '_' + last.toLowerCase().replace(/[^a-z]/g, ''),
      name: { first, last, display },
      club: clubName,
      age,
      position,
      secondaryPositions: [],
      currentRole: "Squad Player",
      shirtNumber,
      attributes: generateAttributes(ovr, position),
      overall: ovr,
      potential: pot,
      value,
      wage,
      contractExpiry,
      morale: "Good",
      fitness: 100,
      fatigue: 0,
      injuryStatus: null,
      suspensionGames: 0,
      yellowCards: 0,
      redCards: 0,
      form: ["-", "-", "-", "-", "-"],
      stats: { apps: 0, goals: 0, assists: 0, cleanSheets: 0, avgRating: 0 },
      personality: { 
        professionalism: Math.min(20, Math.round(10 + (ovr/10) + Math.random()*4)), 
        ambition: Math.min(20, Math.round(12 + Math.random()*8)), 
        loyalty: Math.min(20, Math.round(8 + Math.random()*12)), 
        temperament: Math.min(20, Math.round(9 + Math.random()*11))
      },
      mediaHandling: "Professional",
      relationshipScore: 50,
      clubId
    };
  });
}

const ARSENAL_RAW = `1 David Raya GK TBD 29 87
2 Kepa Arrizabalaga GK TBD 30 82
3 Tommy Setford GK TBD 20 70
4 William Saliba CB TBD 24 87
5 Ben White RB TBD 27 83
6 Cristhian Mosquera CB TBD 21 75
7 Piero Hincapié LB TBD 23 81
8 Gabriel CB TBD 27 88
9 Jurriën Timber CB TBD 23 85
11 Riccardo Calafiori CB TBD 22 82
12 Martin Ødegaard CAM TBD 26 87
13 Christian Nørgaard CM TBD 31 82
14 Mikel Merino CM TBD 28 83
15 Martín Zubimendi CDM TBD 26 85
16 Declan Rice CDM TBD 26 89
17 Albert Sambi Lokonga CM TBD 25 76
18 Kai Havertz ST TBD 26 84
19 Bukayo Saka RW TBD 23 88
20 Eberechi Eze CAM TBD 26 83
21 Gabriel Martinelli LW TBD 23 84
22 Leandro Trossard LW TBD 30 82
23 Noni Madueke RW TBD 23 80
24 Ethan Nwaneri CAM TBD 18 75
25 Gabriel Jesus ST TBD 27 82
26 Viktor Gyökeres ST TBD 27 87
27 Reiss Nelson RW TBD 25 74
29 Myles Lewis-Skelly LB TBD 18 72
30 Max Dowman CAM TBD 16 69
10 Illan Meslier GK TBD 26 75
28 Fabio Vieira CAM TBD 26 79`;

const ASTONVILLA_RAW = `1 Emiliano Martínez GK TBD 32 85
2 Marco Bizot GK TBD 34 77
3 Matty Cash RB TBD 27 79
4 Lucas Digne LB TBD 31 78
5 Ian Maatsen LB TBD 23 79
6 Ezri Konsa CB TBD 27 80
7 Tyrone Mings CB TBD 32 76
8 Victor Lindelöf CB TBD 30 78
9 Pau Torres CB TBD 28 82
10 Ross Barkley CM TBD 31 77
11 John McGinn CM TBD 30 80
12 Boubacar Kamara CDM TBD 25 81
13 Youri Tielemans CM TBD 28 85
14 Amadou Onana CM TBD 23 82
15 Leon Bailey LW TBD 27 80
16 Morgan Rogers CAM TBD 22 83
17 Emiliano Buendía CAM TBD 32 79
18 Ollie Watkins ST TBD 29 84
19 Andres García ST TBD 22 73
20 Tammy Abraham ST TBD 27 78
21 Evann Guessand ST TBD 23 72
22 Rory Wilson ST TBD 18 66
23 Modou Keba Cisse CB TBD 19 66
24 Kadan Young LW TBD 19 68
25 Samuel Iling-Junior LM TBD 22 73
26 Joe Gauci GK TBD 26 68
27 Oliwier Zych GK TBD 22 64
28 Kosta Nedeljkovic RB TBD 20 73
29 Lamare Bogarde CDM TBD 22 71
30 Alysson RW TBD 20 70
31 Lewis Dobbin LM TBD 23 69`;

const BOURNEMOUTH_RAW = `1 Djordje Petrovic GK TBD 25 80
2 Fraser Forster GK TBD 37 75
3 William Dennis GK TBD 24 68
4 Adam Smith RB TBD 33 74
5 Adrien Truffert LB TBD 23 76
6 Bafode Diakite CB TBD 24 72
7 James Hill CB TBD 22 70
8 Ryan Christie CM TBD 30 76
9 Tyler Adams CDM TBD 26 78
10 Lewis Cook CM TBD 28 77
11 David Brooks CAM TBD 27 76
12 Alex Scott CM TBD 21 76
13 Amine Adli LW TBD 24 75
14 Marcus Tavernier CAM TBD 25 76
15 Evanilson ST TBD 25 80
16 Justin Kluivert LW TBD 25 78
17 Enes Ünal ST TBD 27 76
18 Keane Lewis-Potter LW TBD 23 72
19 Dominic Sadi CM TBD 21 65
20 Ben Doak RW TBD 19 68
21 Alex Jimenez RB TBD 20 74
22 Eli Junior Kroupi ST TBD 19 78
23 Julián Araujo RB TBD 24 76
24 Julio Soler LB TBD 21 72
25 Max Aarons RB TBD 26 74
26 Veljko Milosavljevic CB TBD 18 72
27 Matai Akinmboni CB TBD 19 71
28 Alex Tóth CAM TBD 20 75
29 Daniel Jebbison ST TBD 22 70
30 Rayan RW TBD 19 76`;

const BRENTFORD_RAW = `1 Caoimhín Kelleher GK TBD 26 83
2 Hákon Valdimarsson GK TBD 22 68
3 Matthew Cox GK TBD 22 65
4 Kristoffer Ajer CB TBD 26 79
5 Rico Henry LB TBD 27 77
6 Nathan Collins CB TBD 24 79
7 Ethan Pinnock CB TBD 31 77
8 Aaron Hickey RB TBD 23 77
9 Sepp van den Berg CB TBD 23 76
10 Vitaly Janelt CM TBD 26 77
11 Igor Thiago ST TBD 24 84
12 Fabio Carvalho CAM TBD 23 76
13 Dango Ouattara RW TBD 23 79
14 Mathias Jensen CM TBD 28 76
15 Josh DaSilva LM TBD 25 74
16 Keane Lewis-Potter LW TBD 23 72
17 Mikkel Damsgaard CAM TBD 25 80
18 Kevin Schade LW TBD 23 75
19 Valentine Adedokun RW TBD 21 67
20 Jordan Henderson CM TBD 35 79
21 Myles Harris CM TBD 20 64
22 Jayden Meghoma LB TBD 20 74
23 Jannik Schuster CM TBD 20 67
24 Yunus Emre Konak CDM TBD 19 69
25 Ellery Balcombe GK TBD 26 70
26 Julian Eyestone GK TBD 20 62
27 Michael Kayode RB TBD 21 76
28 Kim Ji-soo CB TBD 21 74
29 Antoni Milambo CAM TBD 21 78
30 Yehor Yarmolyuk CDM TBD 22 77
31 Gustavo Nunes RW TBD 20 71
32 Jaidon Anthony LW TBD 26 76
33 Callum Wilson ST TBD 34 74
34 Benjamin Arthur CB TBD 20 66
35 Benjamin Fredrick CB TBD 21 65
37 Romelle Donovan CAM TBD 19 68
41 Kaye Furo ST TBD 19 67`;

const BRIGHTON_RAW = `1 Bart Verbruggen GK TBD 22 82
2 Jason Steele GK TBD 33 75
3 Carl Rushworth GK TBD 23 71
4 Joel Veltman RB TBD 33 75
5 Lewis Dunk CB TBD 33 78
6 Jan Paul van Hecke CB TBD 24 79
8 Maxim De Cuyper LB TBD 24 78
9 Igor Julio CB TBD 26 76
10 Adam Webster CB TBD 30 75
11 Pascal Groß CM TBD 34 80
12 Mats Wieffer CDM TBD 25 79
13 Ferdi Kadıoğlu LB TBD 25 82
14 Carlos Baleba CDM TBD 21 81
15 James Milner CM TBD 39 72
16 Matt O'Riley CM TBD 24 80
17 Yasin Ayari CM TBD 21 72
18 Danny Welbeck ST TBD 34 75
19 Kaoru Mitoma LW TBD 27 82
20 Georginio Rutter ST TBD 22 76
21 Olivier Boscagli CB TBD 27 76
22 Solly March RW TBD 30 78
23 Diego Gómez CM TBD 22 73
24 Thomas McGill GK TBD 23 65
25 Facundo Buonanotte CAM TBD 20 73
26 Yankuba Minteh RW TBD 20 72
27 Evan Ferguson ST TBD 20 74
28 Brajan Gruda RW TBD 21 76
29 Jack Hinshelwood CM TBD 20 75
30 Valentín Barco LB TBD 21 75
31 Stefanos Tzimas ST TBD 20 72`;

const BURNLEY_RAW = `1 Václav Hladký GK TBD 34 73
2 Connor Roberts RB TBD 28 74
3 Hjalmar Ekdal LB TBD 25 73
4 Axel Tuanzebe CB TBD 27 73
5 Maxime Estève CB TBD 22 73
6 Quilindschy Hartman LB TBD 23 74
7 Kyle Walker RB TBD 35 79
8 Hannibal Mejbri CM TBD 22 74
9 Jacob Bruun Larsen CAM TBD 27 75
10 Zian Flemming CAM TBD 26 75
11 Jaidon Anthony LW TBD 25 73
12 Marcus Edwards RW TBD 25 76
13 Loum Tchaouna LW TBD 22 73
14 Josh Laurent CM TBD 29 70
15 Luca Pires Silva LB TBD 23 70
16 Lyle Foster ST TBD 24 75
17 Florentino Luis CDM TBD 25 80
18 Mike Tresor LW TBD 25 76
19 Zeki Amdouni ST TBD 24 75
20 Ashley Barnes ST TBD 35 71
21 Bashir Humphreys CB TBD 22 70
22 Luca Koleosho RW TBD 20 70
23 Lesley Ugochukwu CDM TBD 21 72`;

const CHELSEA_RAW = `1 Filip Jørgensen GK TBD 22 78
2 Robert Sánchez GK TBD 27 78
3 Mike Penders GK TBD 19 65
4 Reece James RB TBD 25 84
5 Benoît Badiashile CB TBD 23 79
6 Trevoh Chalobah CB TBD 25 76
7 Levi Colwill CB TBD 22 82
8 Tosin Adarabioyo CB TBD 27 78
9 Malo Gusto RB TBD 22 79
10 Wesley Fofana CB TBD 24 79
11 Enzo Fernández CDM TBD 24 85
12 Moisés Caicedo CDM TBD 23 88
13 Romeo Lavia CDM TBD 21 76
14 Dario Essugo CM TBD 19 68
15 Cole Palmer CAM TBD 23 86
16 João Pedro ST TBD 22 83
17 Pedro Neto RW TBD 25 77
18 Liam Delap ST TBD 22 75
19 Alejandro Garnacho LW TBD 21 75
20 Estêvão RW TBD 18 78
22 Andrey Santos CM TBD 21 73
23 Jamie Gittens LW TBD 20 76
24 Jorrel Hato LB TBD 19 76
25 Marc Guiu ST TBD 19 70
26 Caleb Wiley LB TBD 19 68
27 Kendry Páez CAM TBD 19 75
28 Josh Acheampong RB TBD 19 70
29 Omari Kellyman CAM TBD 20 69
21 Nicolas Jackson ST TBD 24 79
30 Axel Disasi CB TBD 27 76
31 David Datro Fofana ST TBD 23 70
32 Mamadou Sarr CB TBD 19 68`;

const CRYSTALPALACE_RAW = `1 Dean Henderson GK TBD 28 80
2 Walter Benitez GK TBD 31 78
3 Remi Matthews GK TBD 31 68
4 Nathan Clyne RB TBD 34 72
5 Borna Sosa LB TBD 27 76
6 Tyrick Mitchell LB TBD 25 78
7 Maxence Lacroix CB TBD 25 79
8 Chris Richards CB TBD 25 75
9 Daniel Muñoz RB TBD 28 78
10 Jefferson Lerma CDM TBD 30 77
11 Cheick Doucouré CDM TBD 25 78
12 Daichi Kamada CAM TBD 28 78
13 Will Hughes CM TBD 29 74
14 Adam Wharton CDM TBD 21 77
15 Ismaïla Sarr RW TBD 27 79
16 Jean-Philippe Mateta ST TBD 27 82
17 Yeremy Pino RW TBD 22 76
18 Brennan Johnson RW TBD 24 79
19 Eddie Nketiah ST TBD 25 76
20 Jørgen Strand Larsen ST TBD 25 78
21 Justin Devenny CAM TBD 20 68
23 Chadi Riad CB TBD 21 72
24 David Ozoh CM TBD 19 67
25 Romain Esse LW TBD 20 72`;

const EVERTON_RAW = `1 Jordan Pickford GK TBD 31 84
2 Mark Travers GK TBD 25 75
3 Thomas King GK TBD 26 67
4 Nathan Patterson RB TBD 23 74
5 Vitaliy Mykolenko LB TBD 25 76
6 Michael Keane CB TBD 31 75
7 Jarrad Branthwaite CB TBD 23 80
8 Jake O'Brien CB TBD 23 75
9 James Tarkowski CB TBD 32 82
11 James Garner CM TBD 23 76
12 Merlin Röhl CM TBD 23 72
13 Kiernan Dewsbury-Hall CM TBD 26 78
14 Iliman Ndiaye CAM TBD 25 79
15 Timothy Iroegbunam CM TBD 22 72
16 Thierno Barry ST TBD 23 76
17 Dwight McNeil LW TBD 25 76
18 Carlos Alcaraz CM TBD 22 73
19 Reece Welch CB TBD 20 65
20 Tyler Dibling RW TBD 19 73
21 Beto ST TBD 26 73
22 Tyrique George LW TBD 20 72
23 Hayden Hackney CM TBD 23 78`;

const FULHAM_RAW = `1 Bernd Leno GK TBD 33 82
2 Benjamin Lecomte GK TBD 34 76
3 Marek Rodák GK TBD 27 73
4 Kenny Tete RB TBD 29 77
5 Antonee Robinson LB TBD 27 82
7 Joachim Andersen CB TBD 29 81
8 Issa Diop CB TBD 28 77
9 Timothy Castagne RB TBD 29 78
10 Calvin Bassey CB TBD 25 77
11 Alex Borto CB TBD 22 65
12 Tom Cairney CM TBD 34 77
13 Harrison Reed CDM TBD 30 76
14 Sasa Lukic CM TBD 28 76
15 Alex Iwobi CAM TBD 28 79
16 Ryan Sessegnon LW TBD 25 75
17 Harry Wilson CAM TBD 28 76
18 Oscar Bobb CAM TBD 22 77
19 Emile Smith Rowe CAM TBD 24 77
20 Jorge Cuenca LW TBD 25 73
21 Rodrigo Muniz ST TBD 24 79
22 Raúl Jiménez ST TBD 33 79
23 Samuel Chukwueze RW TBD 25 78
24 Kevin Dos Santos RW TBD 23 76
25 Sander Berge CM TBD 27 79
26 Luke Harris CM TBD 20 68
27 Josh King CM TBD 18 67
28 Luc De Fougerolles CB TBD 20 68`;

const LEEDS_RAW = `1 Lucas Perri GK TBD 27 80
2 Alex Cairns GK TBD 32 71
3 Karl Darlow GK TBD 34 75
4 Sam Byram RB TBD 30 74
5 Jaka Bijol CB TBD 27 78
6 Pascal Struijk CB TBD 26 77
7 Jayden Bogle RB TBD 24 75
8 James Justin RB TBD 26 77
9 Joe Rodon CB TBD 27 77
10 Sebastiaan Bornauw CB TBD 26 75
11 Ethan Ampadu CDM TBD 24 77
12 Brenden Aaronson CAM TBD 25 75
13 Daniel James LW TBD 27 76
14 Sean Longstaff CM TBD 27 75
15 Ilia Gruev CDM TBD 24 74
16 Ao Tanaka CM TBD 26 76
17 Anton Stach CM TBD 26 79
18 Gabriel Gudmundsson LB TBD 24 73
19 Wilfried Gnonto RW TBD 21 74
20 Dominic Calvert-Lewin ST TBD 27 80
21 Joel Piroe ST TBD 25 76
22 Noah Okafor ST TBD 25 76
23 Lukas Nmecha ST TBD 25 74
24 Facundo Buonanotte CAM TBD 20 73
25 Largie Ramazani LW TBD 24 75`;

const LIVERPOOL_RAW = `1 Alisson Becker GK TBD 32 89
2 Giorgi Mamardashvili GK TBD 24 81
3 Harvey Davies GK TBD 22 66
4 Freddie Woodman GK TBD 27 68
5 Conor Bradley RB TBD 22 79
6 Milos Kerkez LB TBD 21 78
8 Virgil van Dijk CB TBD 33 90
9 Ibrahima Konaté CB TBD 26 86
10 Joe Gomez CB TBD 27 81
11 Owen Beck LB TBD 23 70
12 Calvin Ramsay RB TBD 22 68
13 Rhys Williams CB TBD 24 68
14 Ryan Gravenberch CM TBD 23 85
15 Alexis Mac Allister CM TBD 26 85
16 Cody Gakpo LW TBD 25 83
17 Wataru Endo CDM TBD 32 80
18 Curtis Jones CM TBD 24 79
19 Florian Wirtz CAM TBD 22 84
20 Alexander Isak ST TBD 25 83
21 Mohamed Salah RW TBD 33 89
22 Hugo Ekitike ST TBD 23 85
23 Jeremie Frimpong RB TBD 24 82
24 Federico Chiesa RW TBD 27 80
25 Dominic Szoboszlai CAM TBD 25 87
26 Trey Nyoni CM TBD 18 67
27 Rio Ngumoha LW TBD 17 68
28 Stefan Bajcetic CDM TBD 20 72
7 Kostas Tsimikas LB TBD 25 76
29 Harvey Elliott CAM TBD 22 78
30 Armin Pecsi GK TBD 20 68
31 Jayden Danns ST TBD 19 70`;

const MANCITY_RAW = `1 Gianluigi Donnarumma GK TBD 26 90
2 Marcus Bettinelli GK TBD 32 72
3 James Trafford GK TBD 22 74
5 Rúben Dias CB TBD 27 86
6 John Stones CB TBD 31 84
7 Rayan Aït-Nouri LB TBD 24 81
8 Joško Gvardiol CB TBD 23 85
9 Marc Guehi CB TBD 24 83
10 Rodri CDM TBD 29 90
11 Tijjani Reijnders CM TBD 27 85
13 Erling Haaland ST TBD 25 91
15 Phil Foden CAM TBD 25 86
16 Nico González LB TBD 23 79
19 Nico O'Reilly LB TBD 21 82
21 Abdukodir Khusanov CB TBD 21 78
22 Sverre Nypan CM TBD 19 76
23 Divine Mukasa CAM TBD 18 69
24 Antoine Semenyo RW TBD 26 86
25 Rayan Cherki CAM TBD 22 86
26 Mateus Nunes RB TBD 27 84
27 Jérémy Doku LW TBD 23 85
30 Omar Marmoush LW TBD 27 84
31 Jack Grealish LW TBD 29 77
4 Rico Lewis RB TBD 21 77
12 Mateo Kovačić CM TBD 32 82
14 Savinho LW TBD 22 78`;

const MANUTD_RAW = `1 Senne Lammens GK TBD 29 82
2 Altay Bayındır GK TBD 26 74
3 Tom Heaton GK TBD 38 70
4 Harry Maguire CB TBD 32 80
5 Lisandro Martínez CB TBD 27 80
6 Tyrell Malacia LB TBD 25 74
7 Leny Yoro CB TBD 19 78
8 Diogo Dalot RB TBD 26 79
9 Luke Shaw LB TBD 29 79
10 Noussair Mazraoui RB TBD 27 79
11 Bruno Fernandes CAM TBD 30 91
13 Amad Diallo RW TBD 22 77
14 Casemiro CDM TBD 33 81
15 Kobbie Mainoo CM TBD 19 81
16 Jonny Evans CB TBD 37 74
17 Mason Mount CAM TBD 26 79
19 Bryan Mbeumo RW TBD 25 85
20 Matheus Cunha ST TBD 25 83
21 Marcus Rashford LW TBD 27 82
22 Diego León LB TBD 18 69
23 Ayden Heaven CB TBD 18 70
24 Sekou Koné CM TBD 19 68
25 Chido Obi ST TBD 18 70
26 Harry Amass LB TBD 18 71
27 Shea Lacey RW TBD 18 68
12 Manuel Ugarte CDM TBD 25 77
18 Matthijs de Ligt CB TBD 26 82
28 Patrick Dorgu LB TBD 21 78
29 Benjamin Šeško ST TBD 23 80
30 Joshua Zirkzee ST TBD 25 75`;

const NEWCASTLE_RAW = `1 Nick Pope GK TBD 33 82
2 Mark Gillespie GK TBD 33 68
3 Kieran Trippier RB TBD 34 82
4 Dan Burn LB TBD 32 75
5 Fabian Schär CB TBD 33 78
6 Sven Botman CB TBD 25 79
7 Emil Krafth RB TBD 30 70
8 Jamal Lascelles CB TBD 31 75
9 Tino Livramento RB TBD 22 77
10 Matt Targett LB TBD 29 73
13 Joelinton CM TBD 28 82
14 Bruno Guimarães CDM TBD 27 86
15 Joe Willock CM TBD 25 75
16 Lewis Hall LB TBD 20 80
17 Harvey Barnes LW TBD 27 78
18 Miguel Almirón CAM TBD 31 76
19 Yoanne Wissa ST TBD 29 77
20 Jacob Murphy RW TBD 29 75
21 Callum Wilson ST TBD 33 76
23 Lewis Miley CM TBD 20 77
24 Antonio Cordero LW TBD 19 70
25 Nick Woltemade ST TBD 24 79
26 Malick Thiaw CB TBD 24 79`;

const NOTTMFOREST_RAW = `1 Matz Sels GK TBD 32 82
2 Carlos Miguel GK TBD 27 74
3 Matt Turner GK TBD 30 74
4 Neco Williams RB TBD 23 75
5 Harry Toffolo LB TBD 29 72
6 Willy Boly CB TBD 33 76
7 Moussa Niakhaté CB TBD 28 77
8 Joe Worrall CB TBD 28 74
9 Andrew Omobamidele CB TBD 23 73
10 Murillo CB TBD 22 82
11 Omar Richards LB TBD 27 72
12 Ola Aina RB TBD 28 80
13 Ryan Yates CM TBD 27 74
14 Morgan Gibbs-White CAM TBD 25 84
15 Elliot Anderson CM TBD 22 83
16 Nicolas Dominguez CM TBD 27 75
17 Chris Wood ST TBD 33 75
19 Anthony Elanga RW TBD 23 76
20 Ibrahim Sangaré CDM TBD 27 80
21 Callum Hudson-Odoi RW TBD 24 75
22 Taiwo Awoniyi ST TBD 27 76
24 Arnaud Kalimuendo ST TBD 24 73
25 Ramon Sosa RW TBD 25 75
26 James John McAtee CAM TBD 21 72
27 Omari Hutchinson CAM TBD 22 75
28 Dan Ndoye RW TBD 24 78
29 Igor Jesus ST TBD 25 77
30 Jair Cunha CB TBD 22 71
31 Dilane Bakwa RW TBD 22 72
32 Zach Abbott CB TBD 19 67`;

const SUNDERLAND_RAW = `1 Anthony Patterson GK TBD 24 73
2 Seny Dieng GK TBD 32 73
3 Trai Hume RB TBD 23 72
4 Niall Huggins LB TBD 23 65
5 Dan Ballard CB TBD 24 73
6 Luke O'Nien CB TBD 30 71
7 Dennis Cirkin LB TBD 23 70
8 Aji Alese LB TBD 23 70
9 Lynden Gooch RB TBD 29 70
10 Jobe Bellingham CM TBD 19 74
11 Granit Xhaka CM TBD 33 80
12 Patrick Roberts RW TBD 27 72
13 Romaine Mundle LW TBD 21 71
14 Eliezer Mayenda ST TBD 19 68
15 Nectar Triantis CB TBD 21 68
16 Alan Browne CM TBD 30 72
17 Jack Clarke LW TBD 24 74
18 Jewison Bennette LW TBD 21 70
19 Abdoullah Ba CM TBD 21 68
21 Nazariy Rusyn ST TBD 22 70
22 Wilson Isidor ST TBD 24 72
23 Nordi Mukiele CB TBD 28 78
24 Robin Roefs GK TBD 23 78
25 Chris Rigg CM TBD 19 76`;

const TOTTENHAM_RAW = `1 Guglielmo Vicario GK TBD 28 82
2 Martin Dúbravka GK TBD 36 76
3 Brandon Austin GK TBD 25 68
4 Pedro Porro RB TBD 25 80
5 Radu Drăgușin CB TBD 23 76
6 Cristian Romero CB TBD 27 83
7 Ashley Phillips CB TBD 19 63
33 Micky van de Ven CB TBD 25 82
8 João Palhinha CDM TBD 29 83
9 Emerson Royal RB TBD 25 74
10 Ben Davies LB TBD 32 76
11 Destiny Udogie LB TBD 22 79
12 Xavi Simons CAM TBD 22 81
13 Yves Bissouma CDM TBD 28 78
14 Rodrigo Bentancur CM TBD 27 80
15 Lucas Bergvall CM TBD 19 74
16 Pape Sarr CM TBD 22 77
17 James Maddison CAM TBD 28 83
19 Dominic Solanke ST TBD 27 78
20 Dejan Kulusevski CAM TBD 25 81
21 Wilson Odobert LW TBD 20 73
22 Mathys Tel ST TBD 20 76
23 Archie Gray CM TBD 19 75
24 Mateus Fernandes CM TBD 21 77
25 Randal Kolo Muani ST TBD 26 76
26 Mikey Moore LW TBD 18 74
27 Yang Min-hyeok RW TBD 20 73
28 Antonín Kinský GK TBD 22 74
29 Conor Gallagher CM TBD 26 79
34 Andrew Robertson LB TBD 31 81
35 Sandro Tonali CM TBD 25 86
36 Marcos Senesi CB TBD 29 79`;

const WESTHAM_RAW = `1 Lukáš Hrádecký GK TBD 35 79
3 Harry Tyrer GK TBD 23 65
4 Ben Johnson RB TBD 24 72
5 Max Kilman CB TBD 27 79
7 Kurt Zouma CB TBD 30 77
8 Aaron Wan-Bissaka RB TBD 27 77
9 Vladimir Coufal RB TBD 32 74
10 Konstantinos Mavropanos CB TBD 27 75
11 Jean-Clair Todibo CB TBD 26 74
12 Tomás Soucek CM TBD 30 79
13 Lucas Paquetá CAM TBD 27 83
14 Guido Rodríguez CDM TBD 30 77
15 James Ward-Prowse CM TBD 30 80
16 Kalvin Phillips CDM TBD 29 73
17 Oliver Scarles LB TBD 19 64
18 Freddie Potts CM TBD 21 67
19 Jarrod Bowen RW TBD 28 81
20 Mohammed Kudus CAM TBD 24 78
21 Crysencio Summerville LW TBD 23 78
23 Danny Ings ST TBD 32 75
24 Niclas Füllkrug ST TBD 32 79
25 Kaelan Casey CB TBD 21 69
26 George Earthy CM TBD 21 70`;

const WOLVES_RAW = `1 José Sá GK TBD 31 79
2 Daniel Bentley GK TBD 30 72
4 Yerson Mosquera CB TBD 23 71
5 Santiago Bueno CB TBD 26 75
6 Craig Dawson CB TBD 35 72
7 Toti CB TBD 25 74
8 Emmanuel Agbadou CB TBD 27 75
9 João Gomes CDM TBD 24 79
10 Tommy Doyle CM TBD 23 73
11 Luke Cundle CM TBD 22 67
12 Boubacar Traoré CM TBD 22 73
13 André CDM TBD 23 76
15 Pedro Lima RW TBD 18 64
17 Hwang Hee-chan ST TBD 29 76
18 Pablo Sarabia CAM TBD 33 76
19 Rodrigo Gomes RW TBD 22 74
20 Enso González CM TBD 20 68
21 Ty Barnett RB TBD 20 63
23 Bastien Meupiyou CB TBD 19 68`;

export const INITIAL_PLAYERS = [
...processSquad(ARSENAL_RAW, 'arsenal'),
  ...processSquad(ASTONVILLA_RAW, 'astonvilla'),
  ...processSquad(BOURNEMOUTH_RAW, 'bournemouth'),
  ...processSquad(BRENTFORD_RAW, 'brentford'),
  ...processSquad(BRIGHTON_RAW, 'brighton'),
  ...processSquad(BURNLEY_RAW, 'burnley'),
  ...processSquad(CHELSEA_RAW, 'chelsea'),
  ...processSquad(CRYSTALPALACE_RAW, 'crystalpalace'),
  ...processSquad(EVERTON_RAW, 'everton'),
  ...processSquad(FULHAM_RAW, 'fulham'),
  ...processSquad(LEEDS_RAW, 'leeds'),
  ...processSquad(LIVERPOOL_RAW, 'liverpool'),
  ...processSquad(MANCITY_RAW, 'mancity'),
  ...processSquad(MANUTD_RAW, 'manutd'),
  ...processSquad(NEWCASTLE_RAW, 'newcastle'),
  ...processSquad(NOTTMFOREST_RAW, 'nottmforest'),
  ...processSquad(SUNDERLAND_RAW, 'sunderland'),
  ...processSquad(TOTTENHAM_RAW, 'tottenham'),
  ...processSquad(WESTHAM_RAW, 'westham'),
  ...processSquad(WOLVES_RAW, 'wolves')
];
