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
  // Mock generated attributes centered around OVR
  const rng = () => (Math.random() * 10 - 5);
  return {
    pace: Math.min(99, Math.max(40, Math.round(ovr + rng() + (pos === 'LW' || pos === 'RW' || pos === 'RB' || pos === 'LB' ? 8 : 0)))),
    shooting: Math.min(99, Math.max(20, Math.round(ovr + rng() + (pos === 'ST' ? 10 : pos === 'CB' || pos === 'GK' ? -40 : 0)))),
    passing: Math.min(99, Math.max(30, Math.round(ovr + rng() + (pos === 'CAM' || pos === 'CM' || pos === 'CDM' ? 8 : 0)))),
    dribbling: Math.min(99, Math.max(20, Math.round(ovr + rng() + (pos === 'LW' || pos === 'RW' || pos === 'CAM' ? 8 : pos === 'CB' ? -20 : 0)))),
    defending: Math.min(99, Math.max(15, Math.round(ovr + rng() + (pos === 'CB' ? 10 : pos === 'CDM' ? 8 : pos === 'ST' ? -30 : 0)))),
    physical: Math.min(99, Math.max(30, Math.round(ovr + rng() + (pos === 'CB' || pos === 'CDM' || pos === 'ST' ? 8 : 0))))
  };
}

function processSquad(rawText, clubId) {
  return rawText.trim().split('\n').map((line, i) => {
    const parts = line.split(' ');
    const shirtNumber = parseInt(parts[0]);
    const ovr = parseInt(parts[parts.length - 1]);
    const age = parseInt(parts[parts.length - 2]);
    const nationality = parts[parts.length - 3];
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
      nationality,
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
13 Kepa Arrizabalaga GK TBD 30 82
35 Tommy Setford GK TBD 20 70
2 William Saliba CB TBD 24 87
4 Ben White RB TBD 27 83
3 Cristhian Mosquera CB TBD 21 75
5 Piero Hincapié LB TBD 23 81
6 Gabriel Magalhães CB TBD 27 88
12 Jurriën Timber CB TBD 23 83
17 Oleksandr Zinchenko LB TBD 28 81
33 Riccardo Calafiori CB TBD 22 82
8 Martin Ødegaard AM TBD 26 87
16 Christian Nørgaard CM TBD 31 82
23 Mikel Merino CM TBD 28 83
36 Martín Zubimendi DM TBD 26 85
41 Declan Rice DM TBD 26 87
28 Albert Sambi Lokonga CM TBD 25 76
29 Kai Havertz AM TBD 26 84
7 Bukayo Saka RW TBD 23 88
10 Eberechi Eze AM TBD 26 83
11 Gabriel Martinelli LW TBD 23 84
19 Leandro Trossard LW TBD 30 82
20 Noni Madueke RW TBD 23 80
22 Ethan Nwaneri AM TBD 18 72
9 Gabriel Jesus ST TBD 27 82
14 Viktor Gyökeres ST TBD 27 87
24 Reiss Nelson RW TBD 25 74
15 Jakub Kiwior CB TBD 24 76
49 Myles Lewis-Skelly LB TBD 18 69`;

const ASTONVILLA_RAW = `1 Emiliano Martínez GK TBD 32 85
13 Marco Bizot GK TBD 34 77
2 Matty Cash RB TBD 27 79
3 Lucas Digne LB TBD 31 78
23 Ian Maatsen LB TBD 23 79
4 Ezri Konsa CB TBD 27 80
5 Tyrone Mings CB TBD 32 76
15 Victor Lindelöf CB TBD 30 78
18 Pau Torres CB TBD 28 82
6 Ross Barkley CM TBD 31 77
7 John McGinn CM TBD 30 80
8 Boubacar Kamara DM TBD 25 81
10 Youri Tielemans CM TBD 28 85
14 Amadou Onana CM TBD 23 82
19 Douglas Luiz CM TBD 27 82
20 Harvey Elliott AM TBD 22 78
11 Leon Bailey LW TBD 27 80
22 Jadon Sancho RW TBD 25 80
24 Morgan Rogers AM TBD 22 78
25 Emiliano Buendía AM TBD 32 79
9 Ollie Watkins ST TBD 29 84
17 Andres García ST TBD 22 73
21 Tammy Abraham ST TBD 27 78
26 Donyell Malen LW TBD 26 79
16 Evann Guessand ST TBD 23 72
99 Rory Wilson ST TBD 18 66`;

const BOURNEMOUTH_RAW = `1 Djordje Petrovic GK TBD 25 80
13 Fraser Forster GK TBD 37 75
22 William Dennis GK TBD 24 68
2 Adam Smith RB TBD 33 74
3 Adrien Truffert LB TBD 23 76
4 Bafode Diakite CB TBD 24 72
5 James Hill CB TBD 22 70
6 Marcos Senesi CB TBD 27 78
8 Ryan Christie CM TBD 30 76
10 Tyler Adams DM TBD 26 78
14 Lewis Cook CM TBD 28 77
15 David Brooks AM TBD 27 76
16 Alex Scott CM TBD 21 76
17 Amine Adli LW TBD 24 75
18 Marcus Tavernier AM TBD 25 76
19 Dominic Solanke (old) - TBD null 70
20 Dango Ouattara RW TBD 23 77
9 Evanilson ST TBD 25 80
11 Justin Kluivert LW TBD 25 78
21 Enes Ünal ST TBD 27 76
7 Keane Lewis-Potter LW TBD 23 72
12 Dominic Sadi CM TBD 21 65
23 Chris Mepham CB TBD 27 74
99 Ben Doak RW TBD 19 68`;

const BRENTFORD_RAW = `1 Caoimhín Kelleher GK TBD 26 81
21 Hákon Valdimarsson GK TBD 22 68
22 Matthew Cox GK TBD 22 65
2 Kristoffer Ajer CB TBD 26 79
3 Rico Henry LB TBD 27 77
4 Nathan Collins CB TBD 24 79
5 Ethan Pinnock CB TBD 31 77
6 Aaron Hickey RB TBD 23 77
7 Sepp van den Berg CB TBD 23 76
8 Vitaly Janelt CM TBD 26 77
9 Igor Thiago ST TBD 24 76
10 Fabio Carvalho AM TBD 23 76
11 Dango Ouattara (loan) - TBD null 70
12 Mathias Jensen CM TBD 28 76
13 Josh DaSilva LM TBD 25 74
14 Keane Lewis-Potter LW TBD 23 72
15 Mikkel Damsgaard AM TBD 25 80
16 Reiss Nelson RW TBD 25 74
17 Kevin Schade LW TBD 23 75
18 Valentine Adedokun RW TBD 21 67
19 Jordan Henderson CM TBD 35 79
20 Myles Harris CM TBD 20 64
23 Edmond-Paris Maghoma LW TBD 23 67`;

const BRIGHTON_RAW = `1 Bart Verbruggen GK TBD 22 80
18 Jason Steele GK TBD 33 75
30 Carl Rushworth GK TBD 23 71
2 Joel Veltman RB TBD 33 75
3 Lewis Dunk CB TBD 33 78
4 Jan Paul van Hecke CB TBD 24 79
5 Maxim De Cuyper LB TBD 24 78
6 Igor Julio CB TBD 26 76
20 Adam Webster CB TBD 30 75
7 Pascal Groß CM TBD 34 80
8 Mats Wieffer DM TBD 25 79
10 Ferdi Kadıoğlu LB TBD 25 80
11 Carlos Baleba DM TBD 21 81
13 James Milner CM TBD 39 72
15 Matt O'Riley CM TBD 24 80
17 Yasin Ayari CM TBD 21 72
9 Danny Welbeck ST TBD 34 75
12 Kaoru Mitoma LW TBD 27 82
14 Georginio Rutter ST TBD 22 76
16 Olivier Boscagli CB TBD 27 76
19 Solly March RW TBD 30 78
21 Diego Gómez CM TBD 22 73
22 Thomas McGill GK TBD 23 65
99 Facundo Buonanotte AM TBD 20 73
99 Yankuba Minteh RW TBD 20 72
99 Evan Ferguson ST TBD 20 74`;

const BURNLEY_RAW = `1 Václav Hladký GK TBD 34 73
13 Martin Dúbravka GK TBD 36 76
2 Connor Roberts RB TBD 28 74
3 Hjalmar Ekdal LB TBD 25 73
4 Axel Tuanzebe CB TBD 27 73
5 Maxime Estève CB TBD 22 73
6 Quilindschy Hartman LB TBD 23 74
14 Joe Worrall CB TBD 28 74
23 Kyle Walker RB TBD 35 79
7 Hannibal Mejbri CM TBD 22 74
8 Jacob Bruun Larsen AM TBD 27 75
10 Zian Flemming AM TBD 26 75
16 Jaidon Anthony LW TBD 25 73
17 Marcus Edwards RW TBD 25 76
20 Loum Tchaouna LW TBD 22 73
22 Josh Laurent CM TBD 29 70
24 James Ward-Prowse CM TBD 30 80
25 Luca Pires Silva LB TBD 23 70
9 Lyle Foster ST TBD 24 75
11 Florentino (Morris) DM TBD 25 80
15 Mike Tresor LW TBD 25 76
18 Zeki Amdouni ST TBD 24 75
19 Ashley Barnes ST TBD 35 71
21 Bashir Humphreys CB TBD 22 70
99 Luca Koleosho RW TBD 20 70
99 Lesley Ugochukwu DM TBD 21 72`;

const CHELSEA_RAW = `1 Filip Jørgensen GK TBD 22 78
13 Robert Sánchez GK TBD 27 78
40 Mike Penders GK TBD 19 65
2 Reece James RB TBD 25 84
3 Marc Cucurella LB TBD 26 81
4 Benoît Badiashile CB TBD 23 79
5 Trevoh Chalobah CB TBD 25 76
6 Levi Colwill CB TBD 22 82
24 Tosin Adarabioyo CB TBD 27 78
26 Malo Gusto RB TBD 22 79
35 Wesley Fofana CB TBD 24 79
25 Enzo Fernández CM TBD 24 84
30 Moisés Caicedo DM TBD 23 87
32 Romeo Lavia DM TBD 21 76
34 Pedro Neto LW TBD 25 81
28 Dario Essugo CM TBD 19 68
20 Cole Palmer AM TBD 23 87
22 João Pedro AM TBD 22 79
7 Pedro Lomba Neto LW TBD 25 81
9 Liam Delap ST TBD 22 78
10 Alejandro Garnacho LW TBD 21 81
29 Estêvão Willian RW TBD 18 74
11 Noni Madueke RW TBD 23 70
14 Robert Lynch RB TBD 18 65
31 Andrey Santos CM TBD 21 73
99 Marc Guiu ST TBD 19 70
99 Caleb Wiley LB TBD 19 68`;

const CRYSTALPALACE_RAW = `1 Dean Henderson GK TBD 28 80
13 Walter Benitez GK TBD 31 78
26 Remi Matthews GK TBD 31 68
2 Nathan Clyne RB TBD 34 72
3 Borna Sosa LB TBD 27 76
4 Tyrick Mitchell LB TBD 25 78
5 Maxence Lacroix CB TBD 25 79
6 Chris Richards CB TBD 25 75
12 Daniel Muñoz RB TBD 28 78
16 Jefferson Lerma DM TBD 30 77
8 Cheick Doucouré DM TBD 25 78
14 Daichi Kamada AM TBD 28 78
17 Will Hughes CM TBD 29 74
22 Adam Wharton DM TBD 21 77
7 Ismaïla Sarr RW TBD 27 79
9 Jean-Philippe Mateta ST TBD 27 82
10 Yeremy Pino RW TBD 22 76
11 Brennan Johnson RW TBD 24 79
15 Eddie Nketiah ST TBD 25 76
18 Jørgen Strand Larsen ST TBD 25 78
19 Justin Devenny AM TBD 20 68
20 Uche Chukwunonyelum AM TBD 20 66
21 Chadi Riad CB TBD 21 72
23 Evann Guessand ST TBD 23 72
99 David Ozoh CM TBD 19 67`;

const EVERTON_RAW = `1 Jordan Pickford GK TBD 31 84
13 Mark Travers GK TBD 25 75
27 Thomas King GK TBD 26 67
2 Nathan Patterson RB TBD 23 74
3 Vitaliy Mykolenko LB TBD 25 76
5 Michael Keane CB TBD 31 75
6 Jarrad Branthwaite CB TBD 23 80
12 Jake O'Brien CB TBD 23 75
19 James Tarkowski CB TBD 32 80
24 Seamus Coleman RB TBD 36 72
8 Norberto Neves CM TBD 25 76
10 Jack Grealish LW TBD 29 82
14 Idrissa Gueye DM TBD 35 79
16 James Garner CM TBD 23 74
17 Merlin Röhl CM TBD 23 72
18 Kiernan Dewsbury-Hall CM TBD 26 78
20 Iliman Ndiaye AM TBD 25 79
21 Timothy Iroegbunam CM TBD 22 72
9 Thierno Barry ST TBD 23 73
11 Dwight McNeil LW TBD 25 76
22 Carlos Alcaraz CM TBD 22 73
23 Reece Welch CB TBD 20 65
26 Beto ST TBD 26 73`;

const FULHAM_RAW = `1 Bernd Leno GK TBD 33 82
13 Benjamin Lecomte GK TBD 34 76
23 Marek Rodák GK TBD 27 73
2 Kenny Tete RB TBD 29 77
3 Antonee Robinson LB TBD 27 82
4 Joachim Andersen CB TBD 29 81
5 Issa Diop CB TBD 28 77
12 Timothy Castagne RB TBD 29 78
20 Calvin Bassey CB TBD 25 77
28 Alex Borto CB TBD 22 65
6 Tom Cairney CM TBD 34 77
7 Harrison Reed DM TBD 30 76
8 Sasa Lukic CM TBD 28 76
10 Alex Iwobi AM TBD 28 79
11 Ryan Sessegnon LW TBD 25 75
17 Harry Wilson AM TBD 28 76
18 Oscar Bobb AM TBD 22 77
21 Emile Smith Rowe AM TBD 24 77
22 Jorge Cuenca LW TBD 25 73
9 Rodrigo Muniz ST TBD 24 79
14 Raúl Jiménez ST TBD 33 79
15 Samuel Chukwueze RW TBD 25 78
16 Kevin Dos Santos RW TBD 23 76
19 Sander Berge CM TBD 27 79
99 Luke Harris CM TBD 20 68`;

const LEEDS_RAW = `1 Lucas Perri GK TBD 27 80
2 Alex Cairns GK TBD 32 71
3 Karl Darlow GK TBD 34 75
4 Sam Byram RB TBD 30 74
5 Jaka Bijol CB TBD 27 78
6 Pascal Struijk CB TBD 26 77
7 Jayden Bogle RB TBD 24 75
12 James Justin RB TBD 26 77
15 Joe Rodon CB TBD 27 77
20 Sebastiaan Bornauw CB TBD 26 75
8 Ethan Ampadu DM TBD 24 77
10 Brenden Aaronson AM TBD 25 75
11 Daniel James LW TBD 27 76
14 Sean Longstaff CM TBD 27 75
16 Ilia Gruev DM TBD 24 74
17 Ao Tanaka CM TBD 26 76
18 Anton Stach CM TBD 26 74
21 Gabriel Gudmundsson LB TBD 24 73
22 Wilfried Gnonto RW TBD 21 74
9 Dominic Calvert-Lewin ST TBD 27 78
13 Joel Piroe ST TBD 25 76
19 Noah Okafor ST TBD 25 76
24 Lukas Nmecha ST TBD 25 74
99 Facundo Buonanotte AM TBD 20 73`;

const LIVERPOOL_RAW = `1 Alisson Becker GK TBD 32 89
25 Giorgi Mamardashvili GK TBD 24 81
5 Harvey Davies GK TBD 22 66
28 Freddie Woodman GK TBD 28 73
2 Trent Alexander-Arnold - TBD null 70
12 Conor Bradley RB TBD 22 79
6 Milos Kerkez LB TBD 21 78
3 Andrew Robertson LB TBD 31 84
4 Virgil van Dijk CB TBD 33 90
14 Ibrahima Konaté CB TBD 26 86
26 Joe Gomez CB TBD 27 81
32 Owen Beck LB TBD 23 70
34 Calvin Ramsay RB TBD 22 68
37 Rhys Williams CB TBD 24 68
8 Ryan Gravenberch CM TBD 23 85
17 Alexis Mac Allister CM TBD 26 85
18 Cody Gakpo LW TBD 25 83
19 Wataru Endo DM TBD 32 80
38 Curtis Jones CM TBD 24 79
7 Florian Wirtz AM TBD 22 89
9 Alexander Isak ST TBD 25 88
11 Mohamed Salah RW TBD 33 91
22 Hugo Ekitike ST TBD 23 79
30 Jeremie Frimpong RB TBD 24 82
16 Federico Chiesa RW TBD 27 80
42 Trey Nyoni CM TBD 18 67
99 Rio Ngumoha LW TBD 17 68
99 Stefan Bajcetic DM TBD 20 72`;

const MANCITY_RAW = `1 Gianluigi Donnarumma GK TBD 26 90
13 Marcus Bettinelli GK TBD 32 72
31 James Trafford GK TBD 22 74
2 Kyle Walker RB TBD 35 70
3 Rúben Dias CB TBD 27 86
5 John Stones CB TBD 31 84
6 Rayan Aït-Nouri LB TBD 24 81
14 Aymeric Laporte - TBD null 70
24 Joško Gvardiol CB TBD 23 85
25 Manuel Akanji - TBD null 70
5 Marc Guehi CB TBD 24 82
7 Kevin De Bruyne - TBD null 70
8 Rodri (Hernández) DM TBD 29 91
10 Jack Grealish LW TBD 29 70
16 Rodri (recovering) - TBD null 70
17 Kevin De Bruyne - TBD null 70
9 Erling Haaland ST TBD 25 90
10 Bernardo Silva AM TBD 30 87
11 Phil Foden AM TBD 25 88
19 Nico González LB TBD 23 79
20 Bernardo Silva (10) - TBD null 70
21 RW 78 TBD null 22
26 CM 80 TBD null 26
27 CM 86 TBD null 27
31 CM 82 TBD null 28
22 LW 81 TBD null 29
21 AM 80 TBD null 30
99 - - TBD null 32
26 ST 83 TBD null 70
20 RB 76 TBD null 70
19 AM 72 TBD null 70`;

const MANUTD_RAW = `1 André Onana GK TBD 29 83
13 Altay Bayındır GK TBD 26 74
32 Tom Heaton GK TBD 38 70
2 Victor Lindelöf - TBD null 70
5 Harry Maguire CB TBD 32 76
6 Lisandro Martínez CB TBD 27 84
12 Tyrell Malacia LB TBD 25 74
18 Leny Yoro CB TBD 19 78
20 Diogo Dalot RB TBD 26 80
23 Luke Shaw LB TBD 29 79
30 Noussair Mazraoui RB TBD 27 79
8 Bruno Fernandes AM TBD 30 87
14 Christian Eriksen CM TBD 33 81
16 Amad Diallo RW TBD 22 77
17 Alejandro Garnacho LW TBD 21 70
22 Casemiro DM TBD 33 81
25 Kobbie Mainoo CM TBD 19 79
28 Jonny Evans CB TBD 37 74
31 Scott McTominay - TBD null 70
39 Mason Mount AM TBD 26 79
11 Rasmus Højlund ST TBD 22 79
7 Bryan Mbeumo RW TBD 25 85
9 Matheus Cunha ST TBD 25 83
10 Marcus Rashford LW TBD 27 82
19 Antony RW TBD 25 74
21 Antony/Mainoo - TBD null 70
21 ST 80 TBD null 70`;

const NEWCASTLE_RAW = `1 Nick Pope GK TBD 33 82
13 Martin Dúbravka - TBD null 70
22 Mark Gillespie GK TBD 33 68
2 Kieran Trippier RB TBD 34 82
3 Dan Burn LB TBD 32 75
5 Fabian Schär CB TBD 33 78
6 Sven Botman CB TBD 25 79
12 Emil Krafth RB TBD 30 70
15 Jamal Lascelles CB TBD 31 75
23 Tino Livramento RB TBD 22 77
27 Matt Targett LB TBD 29 73
8 Sandro Tonali CM TBD 25 86
10 Anthony Gordon LW TBD 24 83
14 Joelinton CM TBD 28 79
17 Bruno Guimarães DM TBD 27 86
18 Sean Longstaff - TBD null 70
20 Joe Willock CM TBD 25 75
25 Elliot Anderson CM TBD 22 74
26 Lewis Hall LB TBD 20 74
7 Harvey Barnes LW TBD 27 78
11 Miguel Almirón AM TBD 31 76
19 Jacob Murphy RW TBD 29 75
9 Callum Wilson ST TBD 33 76
21 Alexander Isak ST TBD 25 70
29 Chris Wood ST TBD 33 75`;

const NOTTMFOREST_RAW = `1 Matz Sels GK TBD 32 79
13 Carlos Miguel GK TBD 27 74
29 Matt Turner GK TBD 30 74
2 Neco Williams RB TBD 23 75
3 Harry Toffolo LB TBD 29 72
4 Willy Boly CB TBD 33 76
5 Moussa Niakhaté CB TBD 28 77
6 Joe Worrall - TBD null 70
12 Andrew Omobamidele CB TBD 23 73
14 Murillo CB TBD 22 78
22 Omar Richards LB TBD 27 72
23 Ola Aina RB TBD 28 76
8 Ryan Yates CM TBD 27 74
10 Morgan Gibbs-White AM TBD 25 82
11 Elliot Anderson CM TBD 22 70
16 Nicolas Dominguez CM TBD 27 75
17 James Ward-Prowse - TBD null 70
20 Chris Wood ST TBD 33 70
24 Danilo DM TBD 23 78
25 Anthony Elanga RW TBD 23 76
27 Ibrahim Sangaré DM TBD 27 80
7 Callum Hudson-Odoi RW TBD 24 75
9 Taiwo Awoniyi ST TBD 27 76
15 Nicolás González LW TBD 27 76
18 Ramon Sosa RW TBD 25 75`;

const SUNDERLAND_RAW = `1 Anthony Patterson GK TBD 24 73
13 Seny Dieng GK TBD 32 73
2 Trai Hume RB TBD 23 72
3 Niall Huggins LB TBD 23 65
4 Dan Ballard CB TBD 24 73
5 Luke O'Nien CB TBD 30 71
6 Dennis Cirkin LB TBD 23 70
15 Aji Alese LB TBD 23 70
22 Lynden Gooch RB TBD 29 70
8 Jobe Bellingham CM TBD 19 74
10 Patrick Roberts RW TBD 27 72
11 Romaine Mundle LW TBD 21 71
14 Eliezer Mayenda ST TBD 19 68
16 Nectar Triantis CB TBD 21 68
17 Alan Browne CM TBD 30 72
18 Jack Clarke LW TBD 24 74
19 Chris Mepham CB TBD 27 74
20 Jewison Bennette LW TBD 21 70
21 Abdoullah Ba CM TBD 21 68
7 Tunde Adeboyejo ST TBD 27 69
9 Nazariy Rusyn ST TBD 22 70
24 Wilson Isidor ST TBD 24 72`;

const TOTTENHAM_RAW = `1 Guglielmo Vicario GK TBD 28 82
13 Brandon Austin GK TBD 25 68
40 Fraser Forster - TBD null 70
2 Pedro Porro RB TBD 25 80
3 Radu Drăgușin CB TBD 23 76
4 Cristian Romero CB TBD 27 85
5 Ashley Phillips CB TBD 19 63
6 João Palhinha DM TBD 29 83
12 Emerson Royal RB TBD 25 74
15 Ben Davies LB TBD 32 76
33 Destiny Udogie LB TBD 22 79
7 Xavi Simons AM TBD 22 84
8 Yves Bissouma DM TBD 28 78
14 Rodrigo Bentancur CM TBD 27 80
17 Lucas Bergvall CM TBD 19 72
19 Pape Matar Sarr CM TBD 22 77
20 James Maddison AM TBD 28 83
23 Manor Solomon LW TBD 25 73
9 Dominic Solanke ST TBD 27 78
10 Heung-min Son - TBD null 70
11 Brennan Johnson - TBD null 70
21 Dejan Kulusevski AM TBD 25 81
25 Wilson Odobert LW TBD 20 73
27 Mathys Tel ST TBD 20 76
99 Archie Gray CM TBD 19 70`;

const WESTHAM_RAW = `1 Lukáš Hrádecký GK TBD 35 79
13 Darren Randolph GK TBD 37 71
22 Harry Tyrer GK TBD 23 65
2 Ben Johnson RB TBD 24 72
3 Max Kilman CB TBD 27 79
4 Edson Álvarez DM TBD 27 81
5 Nayef Aguerd - TBD null 70
6 Kurt Zouma CB TBD 30 77
16 Aaron Wan-Bissaka RB TBD 27 77
23 Vladimir Coufal RB TBD 32 74
21 Konstantinos Mavropanos CB TBD 27 75
8 Tomás Soucek CM TBD 30 79
10 Lucas Paquetá AM TBD 27 83
15 Guido Rodríguez DM TBD 30 77
17 James Ward-Prowse - TBD null 70
20 Kalvin Phillips DM TBD 29 73
24 Oliver Scarles LB TBD 19 64
25 Freddie Potts CM TBD 21 67
7 Jarrod Bowen RW TBD 28 81
9 Callum Wilson (loan) - TBD null 70
11 Mohammed Kudus AM TBD 24 80
14 Crysencio Summerville LW TBD 23 78
19 Carlos Soler CM TBD 27 77
27 Danny Ings ST TBD 32 75
29 Niclas Füllkrug ST TBD 32 79`;

const WOLVES_RAW = `1 José Sá GK TBD 31 79
13 Daniel Bentley GK TBD 30 72
32 Tom King - TBD null 65
2 Nelson Semedo RB TBD 31 79
3 Rayan Aït-Nouri - TBD null 70
4 Yerson Mosquera CB TBD 23 71
5 Santiago Bueno CB TBD 26 75
6 Maximilian Kilman - TBD null 70
15 Craig Dawson CB TBD 35 72
23 Toti Gomes CB TBD 25 74
25 Emmanuel Agbadou CB TBD 27 75
8 João Gomes DM TBD 24 79
10 Matheus Cunha - TBD null 70
14 Tommy Doyle CM TBD 23 73
16 Luke Cundle CM TBD 22 67
17 Boubacar Traoré CM TBD 22 73
20 André DM TBD 23 76
22 Mario Lemina DM TBD 31 77
7 Pedro Lima RW TBD 18 64
9 Goncalo Guedes LW TBD 28 76
11 Hwang Hee-chan ST TBD 29 76
18 Jorgen Strand Larsen - TBD null 70
19 Pablo Sarabia AM TBD 33 76
21 Rodrigo Gomes RW TBD 22 74
27 Enso González CM TBD 20 68
29 Hee-chan's backup (Kalajdzic) ST TBD 27 73
99 Ty Barnett RB TBD 20 63`;

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
